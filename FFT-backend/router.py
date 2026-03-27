import base64
import hashlib
import io
import json
import os
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from db import get_connection
from models import recall_status, compute_trust_score, compute_nutri_grade, award_achievements
from schemas import (
    BatchDetail, BatchListItem, BatchCreate, BatchCreated,
    EventCreate, EventCreated,
    RecallCreate, RecallCreated, RecallResolved, ActiveRecall,
    ComplaintCreate, ComplaintCreated, ComplaintListItem,
    ComplaintStatusUpdate, ComplaintStatusResult,
    StationItem, StationCreate, StationCreated,
    RiskResponse, ChatRequest, ChatResponse, AlternativeItem,
    ColdChainResponse, ColdChainLogCreate, ColdChainLogCreated,
    IoTLiveResponse, IoTReadingCreate, IoTReadingCreated, IoTReadingEntry,
    IoTAnomalyItem, IoTSimulateResponse,
    NutriScoreResponse, NutriScoreCreate, NutriScoreCreated,
    EcoFootprintResponse, EcoFootprintCreate, EcoFootprintCreated,
    PriceBreakdownItem, PriceBreakdownCreate, PriceBreakdownCreated,
    TrustScoreResponse, LeaderboardItem,
    CrowdRatingCreate, CrowdRatingCreated,
    AchievementItem, OcrRequest, OcrResponse,
    AuthRequest, AuthResponse,
)
from qr import generate_qr, get_qr_image_path
import ai as ai_module

router = APIRouter()

TEMP_RANGES = {
    "dairy":      (2.0,  8.0),
    "käse":       (2.0,  8.0),
    "milch":      (2.0,  8.0),
    "vegetables": (0.0,  4.0),
    "gemüse":     (0.0,  4.0),
    "beverages":  (5.0, 15.0),
    "getränke":   (5.0, 15.0),
    "other":      (0.0, 25.0),
}

STAGE_ORDER = {"farm": 0, "processing": 1, "transport": 2, "retail": 3}


def _temp_range(product_category: str) -> tuple[float, float]:
    key = product_category.lower()
    for k, v in TEMP_RANGES.items():
        if k in key:
            return v
    return TEMP_RANGES["other"]


def db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")


def _fetch_batch_data(c, batch_id: int) -> dict | None:
    c.execute("SELECT * FROM batch WHERE batch_id=%s", (batch_id,))
    batch_row = c.fetchone()
    if not batch_row:
        return None
    data = dict(batch_row)

    c.execute("SELECT within_range FROM cold_chain_log WHERE batch_id=%s", (batch_id,))
    cold_rows = c.fetchall()
    breaches = sum(1 for r in cold_rows if not r["within_range"])
    data["cold_chain_ok"] = len(cold_rows) == 0 or breaches == 0
    data["breaches"] = breaches

    c.execute(
        "SELECT severity FROM recall WHERE batch_id=%s AND resolved_at IS NULL",
        (batch_id,)
    )
    data["active_recalls"] = [r["severity"] for r in c.fetchall()]

    c.execute(
        "SELECT MIN(timestamp) as transport_min, MAX(timestamp) as transport_max FROM batch_event WHERE batch_id=%s AND event_type IN ('arrived','shipped','transported')",
        (batch_id,)
    )
    transport_row = c.fetchone()
    data["transport_min"] = transport_row["transport_min"]
    data["transport_max"] = transport_row["transport_max"]

    c.execute("SELECT passed FROM quality_check WHERE batch_id=%s", (batch_id,))
    qc_rows = c.fetchall()
    data["failed_quality_checks"] = sum(1 for r in qc_rows if not r["passed"])

    return data


def _score_to_level(score: int) -> str:
    if score <= 25:
        return "low"
    if score <= 50:
        return "medium"
    if score <= 75:
        return "high"
    return "critical"


@router.get("/api/batches", response_model=list[BatchListItem])
def list_batches(conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT * FROM batch ORDER BY created_at DESC")
    batches = c.fetchall()
    result = []
    for b in batches:
        bid = b["batch_id"]
        status = recall_status(conn, bid)
        c.execute("SELECT score FROM trust_score WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (bid,))
        ts_row = c.fetchone()
        c.execute("SELECT grade FROM nutri_score WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (bid,))
        ns_row = c.fetchone()
        result.append(BatchListItem(
            batch_id=bid,
            product_name=b["product_name"],
            qr_code=b["qr_code"],
            origin_country=b["origin_country"],
            harvest_date=b["harvest_date"],
            recall_status=status,
            trust_score=ts_row["score"] if ts_row else None,
            nutri_grade=ns_row["grade"] if ns_row else None,
            created_at=b["created_at"],
        ))
    return result


@router.get("/api/batch/{qr_code}", response_model=BatchDetail)
def get_batch(qr_code: str, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT * FROM batch WHERE qr_code=%s", (qr_code,))
    b = c.fetchone()
    if not b:
        raise HTTPException(status_code=404, detail="batch not found")
    bid = b["batch_id"]

    status = recall_status(conn, bid)

    c.execute("SELECT score FROM trust_score WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (bid,))
    ts_row = c.fetchone()

    c.execute("SELECT grade FROM nutri_score WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (bid,))
    ns_row = c.fetchone()

    c.execute("SELECT risk_score, risk_level FROM risk_prediction WHERE batch_id=%s ORDER BY predicted_at DESC LIMIT 1", (bid,))
    rp_row = c.fetchone()

    c.execute("SELECT AVG(stars) as avg_stars FROM crowd_rating WHERE batch_id=%s", (bid,))
    crowd_row = c.fetchone()
    crowd_score = float(crowd_row["avg_stars"]) if crowd_row and crowd_row["avg_stars"] is not None else None

    c.execute("""
        SELECT be.event_id, s.name as station_name, s.type as station_type,
               s.location, be.event_type, be.timestamp,
               be.temp_celsius, be.co2_kg, be.notes
        FROM batch_event be
        LEFT JOIN station s ON be.station_id = s.station_id
        WHERE be.batch_id=%s
        ORDER BY be.timestamp ASC
    """, (bid,))
    events = c.fetchall()

    c.execute("SELECT * FROM recall WHERE batch_id=%s ORDER BY issued_at DESC", (bid,))
    recalls = c.fetchall()

    c.execute("SELECT * FROM certificate WHERE batch_id=%s", (bid,))
    certs = c.fetchall()

    c.execute("""
        SELECT qc.check_id, s.name as station_name, qc.checked_at, qc.passed, qc.notes
        FROM quality_check qc
        JOIN station s ON qc.station_id = s.station_id
        WHERE qc.batch_id=%s
        ORDER BY qc.checked_at ASC
    """, (bid,))
    checks = c.fetchall()

    c.execute("SELECT co2_total_kg FROM ecological_footprint WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (bid,))
    eco_row = c.fetchone()

    c.execute("SELECT within_range FROM cold_chain_log WHERE batch_id=%s", (bid,))
    cold_rows = c.fetchall()
    cold_chain_ok = None
    if cold_rows:
        cold_chain_ok = all(r["within_range"] == 1 for r in cold_rows)

    return BatchDetail(
        batch_id=bid,
        product_name=b["product_name"],
        product_category=b["product_category"],
        origin_farm=b["origin_farm"],
        origin_country=b["origin_country"],
        harvest_date=b["harvest_date"],
        qr_code=b["qr_code"],
        recall_status=status,
        trust_score=ts_row["score"] if ts_row else None,
        nutri_grade=ns_row["grade"] if ns_row else None,
        risk_level=rp_row["risk_level"] if rp_row else None,
        risk_score=rp_row["risk_score"] if rp_row else None,
        crowd_score=crowd_score,
        journey=[
            dict(
                event_id=e["event_id"],
                station_name=e["station_name"],
                station_type=e["station_type"],
                location=e["location"],
                event_type=e["event_type"],
                timestamp=e["timestamp"],
                temp_celsius=e["temp_celsius"],
                co2_kg=e["co2_kg"],
                notes=e["notes"],
            ) for e in events
        ],
        recalls=[
            dict(
                recall_id=r["recall_id"],
                reason=r["reason"],
                severity=r["severity"],
                issued_at=r["issued_at"],
                resolved_at=r["resolved_at"],
                issued_by=r["issued_by"],
            ) for r in recalls
        ],
        certificates=[
            dict(
                cert_id=c2["cert_id"],
                cert_type=c2["cert_type"],
                issued_by=c2["issued_by"],
                valid_until=c2["valid_until"],
                verified=bool(c2["verified"]),
            ) for c2 in certs
        ],
        quality_checks=[
            dict(
                check_id=qc["check_id"],
                station_name=qc["station_name"],
                checked_at=qc["checked_at"],
                passed=bool(qc["passed"]),
                notes=qc["notes"],
            ) for qc in checks
        ],
        co2_total_kg=eco_row["co2_total_kg"] if eco_row else None,
        cold_chain_ok=cold_chain_ok,
    )


@router.post("/api/batch", response_model=BatchCreated, status_code=201)
def create_batch(body: BatchCreate, conn=Depends(db)):
    import uuid
    qr_code = str(uuid.uuid4())
    now = now_iso()
    c = conn.cursor()
    c.execute(
        "INSERT INTO batch (product_name, product_category, origin_farm, origin_country, harvest_date, qr_code, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING batch_id",
        (body.product_name, body.product_category, body.origin_farm, body.origin_country, body.harvest_date, qr_code, now)
    )
    batch_id = c.fetchone()["batch_id"]
    conn.commit()
    generate_qr(batch_id, qr_code)
    return BatchCreated(batch_id=batch_id, qr_code=qr_code, qr_image_url=f"/qr_images/{qr_code}.png")


@router.post("/api/batch/{batch_id}/event", response_model=EventCreated, status_code=201)
def add_event(batch_id: int, body: EventCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    c.execute(
        "INSERT INTO batch_event (batch_id, station_id, event_type, timestamp, notes, temp_celsius, co2_kg) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING event_id",
        (batch_id, body.station_id, body.event_type, body.timestamp, body.notes, body.temp_celsius, body.co2_kg)
    )
    event_id = c.fetchone()["event_id"]
    conn.commit()
    return EventCreated(event_id=event_id)


@router.post("/api/batch/{batch_id}/recall", response_model=RecallCreated, status_code=201)
def create_recall(batch_id: int, body: RecallCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    now = now_iso()
    c.execute(
        "INSERT INTO recall (batch_id, reason, severity, issued_at, issued_by) VALUES (%s,%s,%s,%s,%s) RETURNING recall_id",
        (batch_id, body.reason, body.severity, now, body.issued_by)
    )
    recall_id = c.fetchone()["recall_id"]
    conn.commit()
    if body.severity == "critical":
        c.execute(
            "INSERT INTO batch_event (batch_id, station_id, event_type, timestamp, notes, temp_celsius, co2_kg) VALUES (%s,NULL,'recalled',%s,%s,NULL,NULL)",
            (batch_id, now, body.reason)
        )
        conn.commit()
    return RecallCreated(recall_id=recall_id)


@router.patch("/api/recall/{recall_id}/resolve", response_model=RecallResolved)
def resolve_recall(recall_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT recall_id FROM recall WHERE recall_id=%s", (recall_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="recall not found")
    now = now_iso()
    c.execute("UPDATE recall SET resolved_at=%s WHERE recall_id=%s", (now, recall_id))
    conn.commit()
    return RecallResolved(recall_id=recall_id, resolved_at=now)


@router.get("/api/recalls/active", response_model=list[ActiveRecall])
def get_active_recalls(conn=Depends(db)):
    c = conn.cursor()
    c.execute("""
        SELECT r.recall_id, r.batch_id, b.product_name, r.reason,
               r.severity, r.issued_at, r.issued_by
        FROM recall r
        JOIN batch b ON r.batch_id = b.batch_id
        WHERE r.resolved_at IS NULL
        ORDER BY r.issued_at DESC
    """)
    return [ActiveRecall(**dict(r)) for r in c.fetchall()]


@router.post("/api/batch/{batch_id}/complaint", response_model=ComplaintCreated, status_code=201)
def create_complaint(batch_id: int, body: ComplaintCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")

    one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
    c.execute(
        "SELECT COUNT(*) as cnt FROM complaint_rate_limit WHERE batch_id=%s AND submitted_at > %s",
        (batch_id, one_hour_ago)
    )
    if c.fetchone()["cnt"] >= 3:
        raise HTTPException(status_code=429, detail="too many complaints")

    now = now_iso()
    c.execute(
        "INSERT INTO complaint (batch_id, reporter_name, reporter_email, description, category, submitted_at, status) VALUES (%s,%s,%s,%s,%s,%s,'open') RETURNING complaint_id",
        (batch_id, body.reporter_name, body.reporter_email, body.description, body.category, now)
    )
    complaint_id = c.fetchone()["complaint_id"]
    conn.commit()
    c.execute("INSERT INTO complaint_rate_limit (batch_id, submitted_at) VALUES (%s,%s)", (batch_id, now))
    conn.commit()

    award_achievements(conn, body.reporter_name, "complaint", batch_id)

    return ComplaintCreated(complaint_id=complaint_id)


@router.get("/api/complaints", response_model=list[ComplaintListItem])
def list_complaints(conn=Depends(db)):
    c = conn.cursor()
    c.execute("""
        SELECT c.complaint_id, c.batch_id, b.product_name, c.reporter_name,
               c.category, c.status, c.submitted_at
        FROM complaint c
        JOIN batch b ON c.batch_id = b.batch_id
        ORDER BY c.submitted_at DESC
    """)
    return [ComplaintListItem(**dict(r)) for r in c.fetchall()]


@router.patch("/api/complaint/{complaint_id}/status", response_model=ComplaintStatusResult)
def update_complaint_status(complaint_id: int, body: ComplaintStatusUpdate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT status FROM complaint WHERE complaint_id=%s", (complaint_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="complaint not found")
    current = row["status"]
    valid_transitions = {
        "open": ["reviewed", "resolved"],
        "reviewed": ["resolved"],
    }
    if body.status not in valid_transitions.get(current, []):
        raise HTTPException(status_code=400, detail="invalid status transition")
    c.execute("UPDATE complaint SET status=%s WHERE complaint_id=%s", (body.status, complaint_id))
    conn.commit()
    return ComplaintStatusResult(complaint_id=complaint_id, status=body.status)


@router.get("/api/batch/{batch_id}/qr-image")
def get_qr_image(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT qr_code FROM batch WHERE batch_id=%s", (batch_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="batch not found")
    qr_code = row["qr_code"]
    path = get_qr_image_path(qr_code)
    if not path:
        generate_qr(batch_id, qr_code)
        path = get_qr_image_path(qr_code)
    if not path:
        raise HTTPException(status_code=404, detail="qr image not found")
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "max-age=86400"})


@router.get("/api/stations", response_model=list[StationItem])
def list_stations(conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT * FROM station ORDER BY station_id")
    return [StationItem(**dict(r)) for r in c.fetchall()]


@router.post("/api/station", response_model=StationCreated, status_code=201)
def create_station(body: StationCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute(
        "INSERT INTO station (name, type, location, operator) VALUES (%s,%s,%s,%s) RETURNING station_id",
        (body.name, body.type, body.location, body.operator)
    )
    station_id = c.fetchone()["station_id"]
    conn.commit()
    return StationCreated(station_id=station_id)


@router.get("/api/batch/{batch_id}/risk", response_model=RiskResponse)
def get_risk(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")

    one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
    c.execute(
        "SELECT * FROM risk_prediction WHERE batch_id=%s AND predicted_at > %s ORDER BY predicted_at DESC LIMIT 1",
        (batch_id, one_hour_ago)
    )
    cached = c.fetchone()
    if cached:
        return RiskResponse(
            risk_score=cached["risk_score"],
            risk_level=cached["risk_level"],
            risk_factors=json.loads(cached["risk_factors"]),
            ai_explanation=cached["ai_explanation"],
            shelf_life_days=cached["shelf_life_days"],
            predicted_at=cached["predicted_at"],
        )

    batch_data = _fetch_batch_data(c, batch_id)
    score = 0
    factors = []

    if "critical" in batch_data["active_recalls"]:
        score += 30
        factors.append("Aktiver kritischer Rückruf")
    if "warning" in batch_data["active_recalls"]:
        score += 20
        factors.append("Aktive Rückrufwarnung")
    if batch_data["breaches"] > 0:
        score += 25
        factors.append(f"Kühlkettenunterbrechung ({batch_data['breaches']} Verstoss/Verstösse)")
    if batch_data["transport_min"] and batch_data["transport_max"]:
        try:
            t_min = datetime.fromisoformat(batch_data["transport_min"])
            t_max = datetime.fromisoformat(batch_data["transport_max"])
            if (t_max - t_min).days > 7:
                score += 15
                factors.append("Transportdauer über 7 Tage")
        except ValueError:
            pass
    if batch_data["failed_quality_checks"] > 2:
        score += 10
        factors.append(f"Mehrere fehlgeschlagene Qualitätskontrollen ({batch_data['failed_quality_checks']})")
    if not factors:
        factors.append("Keine wesentlichen Risikofaktoren festgestellt")

    score = min(score, 100)
    risk_level = _score_to_level(score)
    ai_explanation = ai_module.generate_risk_explanation(batch_data, score, factors)
    shelf_life_days = ai_module.predict_shelf_life(batch_data)

    now = now_iso()
    c.execute(
        "INSERT INTO risk_prediction (batch_id, risk_score, risk_level, risk_factors, ai_explanation, shelf_life_days, predicted_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (batch_id, score, risk_level, json.dumps(factors, ensure_ascii=False), ai_explanation, shelf_life_days, now)
    )
    conn.commit()

    return RiskResponse(
        risk_score=score,
        risk_level=risk_level,
        risk_factors=factors,
        ai_explanation=ai_explanation,
        shelf_life_days=shelf_life_days,
        predicted_at=now,
    )


@router.post("/api/batch/{batch_id}/chat", response_model=ChatResponse)
def chat(batch_id: int, body: ChatRequest, conn=Depends(db)):
    c = conn.cursor()
    batch_data = _fetch_batch_data(c, batch_id)
    if not batch_data:
        raise HTTPException(status_code=404, detail="batch not found")

    c.execute(
        "SELECT role, content FROM ai_chat_message WHERE session_id=%s AND batch_id=%s ORDER BY created_at ASC LIMIT 10",
        (body.session_id, batch_id)
    )
    history = [{"role": r["role"], "content": r["content"]} for r in c.fetchall()]

    reply = ai_module.chat_with_assistant(batch_data, body.message, history)

    now = now_iso()
    c.execute(
        "INSERT INTO ai_chat_message (session_id, batch_id, role, content, created_at) VALUES (%s,%s,%s,%s,%s)",
        (body.session_id, batch_id, "user", body.message, now)
    )
    c.execute(
        "INSERT INTO ai_chat_message (session_id, batch_id, role, content, created_at) VALUES (%s,%s,%s,%s,%s)",
        (body.session_id, batch_id, "assistant", reply, now)
    )
    conn.commit()

    return ChatResponse(reply=reply, session_id=body.session_id)


@router.get("/api/batch/{batch_id}/alternatives", response_model=list[AlternativeItem])
def get_alternatives(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")

    c.execute("SELECT * FROM alternative_product WHERE batch_id=%s", (batch_id,))
    rows = c.fetchall()
    if rows:
        return [AlternativeItem(**dict(r)) for r in rows]

    batch_data = _fetch_batch_data(c, batch_id)
    generated = ai_module.generate_alternatives(batch_data)

    result = []
    for alt in generated:
        c.execute(
            "INSERT INTO alternative_product (batch_id, product_name, reason, co2_kg, nutri_grade, trust_score) VALUES (%s,%s,%s,%s,%s,%s) RETURNING *",
            (batch_id, alt.get("product_name", ""), alt.get("reason", ""), alt.get("co2_kg"), alt.get("nutri_grade"), alt.get("trust_score"))
        )
        row = c.fetchone()
        conn.commit()
        result.append(AlternativeItem(**dict(row)))

    return result


@router.get("/api/batch/{batch_id}/cold-chain", response_model=ColdChainResponse)
def get_cold_chain(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    c.execute("""
        SELECT s.name as station_name, cl.recorded_at, cl.temp_celsius,
               cl.min_temp, cl.max_temp, cl.within_range
        FROM cold_chain_log cl
        JOIN station s ON cl.station_id = s.station_id
        WHERE cl.batch_id=%s
        ORDER BY cl.recorded_at ASC
    """, (batch_id,))
    rows = c.fetchall()
    logs = [
        dict(
            station_name=r["station_name"],
            recorded_at=r["recorded_at"],
            temp_celsius=r["temp_celsius"],
            min_temp=r["min_temp"],
            max_temp=r["max_temp"],
            within_range=bool(r["within_range"]),
        ) for r in rows
    ]
    breaches = sum(1 for r in rows if not r["within_range"])
    return ColdChainResponse(logs=logs, breaches=breaches, cold_chain_ok=breaches == 0)


@router.post("/api/batch/{batch_id}/cold-chain-log", response_model=ColdChainLogCreated, status_code=201)
def add_cold_chain_log(batch_id: int, body: ColdChainLogCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    within_range = 1 if body.min_temp <= body.temp_celsius <= body.max_temp else 0
    now = now_iso()
    c.execute(
        "INSERT INTO cold_chain_log (batch_id, station_id, recorded_at, temp_celsius, min_temp, max_temp, within_range) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING log_id",
        (batch_id, body.station_id, now, body.temp_celsius, body.min_temp, body.max_temp, within_range)
    )
    log_id = c.fetchone()["log_id"]
    conn.commit()
    return ColdChainLogCreated(log_id=log_id, within_range=bool(within_range))


@router.get("/api/batch/{batch_id}/iot/live", response_model=IoTLiveResponse)
def get_iot_live(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    c.execute("""
        SELECT ir.sensor_type, ir.value, ir.recorded_at, s.name as station_name
        FROM iot_reading ir
        JOIN station s ON ir.station_id = s.station_id
        WHERE ir.batch_id=%s
        ORDER BY ir.recorded_at DESC
        LIMIT 20
    """, (batch_id,))
    rows = c.fetchall()
    readings = [IoTReadingEntry(**dict(r)) for r in rows]
    latest_temp = next((r.value for r in readings if r.sensor_type == "temperature"), None)
    latest_humidity = next((r.value for r in readings if r.sensor_type == "humidity"), None)
    return IoTLiveResponse(readings=readings, latest_temp=latest_temp, latest_humidity=latest_humidity)


@router.post("/api/batch/{batch_id}/iot-reading", response_model=IoTReadingCreated, status_code=201)
def add_iot_reading(batch_id: int, body: IoTReadingCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT product_category FROM batch WHERE batch_id=%s", (batch_id,))
    batch_row = c.fetchone()
    if not batch_row:
        raise HTTPException(status_code=404, detail="batch not found")

    c.execute("SELECT station_id FROM station WHERE station_id=%s", (body.station_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="station not found")

    now = now_iso()
    anomaly_notes = None

    if body.sensor_type == "temperature":
        min_t, max_t = _temp_range(batch_row["product_category"])
        if not (min_t <= body.value <= max_t):
            c.execute(
                "INSERT INTO cold_chain_log (batch_id, station_id, recorded_at, temp_celsius, min_temp, max_temp, within_range) VALUES (%s,%s,%s,%s,%s,%s,0)",
                (batch_id, body.station_id, now, body.value, min_t, max_t)
            )
            conn.commit()

            c.execute(
                "SELECT value, recorded_at FROM iot_reading WHERE batch_id=%s AND sensor_type='temperature' ORDER BY recorded_at DESC LIMIT 5",
                (batch_id,)
            )
            context = [{"value": r["value"], "recorded_at": r["recorded_at"]} for r in c.fetchall()]
            anomaly_notes = ai_module.analyse_anomaly(batch_id, body.value, batch_row["product_category"], context)

    c.execute(
        "INSERT INTO iot_reading (batch_id, station_id, sensor_type, value, recorded_at, notes) VALUES (%s,%s,%s,%s,%s,%s) RETURNING reading_id",
        (batch_id, body.station_id, body.sensor_type, body.value, now, anomaly_notes)
    )
    reading_id = c.fetchone()["reading_id"]
    conn.commit()
    return IoTReadingCreated(reading_id=reading_id)


@router.post("/api/batch/{batch_id}/iot/simulate", response_model=IoTSimulateResponse, status_code=201)
def simulate_iot(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT product_category FROM batch WHERE batch_id=%s", (batch_id,))
    batch_row = c.fetchone()
    if not batch_row:
        raise HTTPException(status_code=404, detail="batch not found")

    c.execute(
        "SELECT recall_id FROM recall WHERE batch_id=%s AND resolved_at IS NULL AND severity='critical' LIMIT 1",
        (batch_id,)
    )
    has_critical_recall = c.fetchone() is not None

    c.execute("SELECT station_id FROM station LIMIT 1")
    station_row = c.fetchone()
    if not station_row:
        raise HTTPException(status_code=500, detail="no stations available")
    station_id = station_row["station_id"]

    min_t, max_t = _temp_range(batch_row["product_category"])
    mid_t = (min_t + max_t) / 2
    now_dt = datetime.utcnow()
    spike_positions = {3, 7} if has_critical_recall else set()

    readings = []
    for i in range(10):
        ts = (now_dt - timedelta(hours=24) + timedelta(hours=i * 2 + random.uniform(0, 1))).strftime("%Y-%m-%dT%H:%M:%S")
        temp = round(max_t + random.uniform(3.0, 8.0), 1) if i in spike_positions else round(mid_t + random.uniform(-1.5, 1.5), 1)
        readings.append((batch_id, station_id, "temperature", temp, ts))

    for i in range(10):
        ts = (now_dt - timedelta(hours=24) + timedelta(hours=i * 2 + random.uniform(0, 1))).strftime("%Y-%m-%dT%H:%M:%S")
        readings.append((batch_id, station_id, "humidity", round(random.uniform(55.0, 80.0), 1), ts))

    inserted = 0
    for bid_r, sid, sensor_type, value, ts in readings:
        anomaly_notes = None
        if sensor_type == "temperature" and not (min_t <= value <= max_t):
            c.execute(
                "INSERT INTO cold_chain_log (batch_id, station_id, recorded_at, temp_celsius, min_temp, max_temp, within_range) VALUES (%s,%s,%s,%s,%s,%s,0)",
                (bid_r, sid, ts, value, min_t, max_t)
            )
            c.execute(
                "SELECT value, recorded_at FROM iot_reading WHERE batch_id=%s AND sensor_type='temperature' ORDER BY recorded_at DESC LIMIT 5",
                (bid_r,)
            )
            context = [{"value": r["value"], "recorded_at": r["recorded_at"]} for r in c.fetchall()]
            anomaly_notes = ai_module.analyse_anomaly(bid_r, value, batch_row["product_category"], context)

        c.execute(
            "INSERT INTO iot_reading (batch_id, station_id, sensor_type, value, recorded_at, notes) VALUES (%s,%s,%s,%s,%s,%s)",
            (bid_r, sid, sensor_type, value, ts, anomaly_notes)
        )
        inserted += 1

    conn.commit()
    return IoTSimulateResponse(inserted=inserted)


@router.get("/api/batch/{batch_id}/iot/anomalies", response_model=list[IoTAnomalyItem])
def get_iot_anomalies(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    c.execute("""
        SELECT ir.reading_id, ir.sensor_type, ir.value, ir.recorded_at,
               s.name as station_name, ir.notes
        FROM iot_reading ir
        JOIN station s ON ir.station_id = s.station_id
        WHERE ir.batch_id=%s AND ir.notes IS NOT NULL
        ORDER BY ir.recorded_at DESC
    """, (batch_id,))
    return [IoTAnomalyItem(**dict(r)) for r in c.fetchall()]


@router.get("/api/batch/{batch_id}/nutri-score", response_model=NutriScoreResponse)
def get_nutri_score(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT * FROM nutri_score WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (batch_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="nutri score not found")
    return NutriScoreResponse(
        grade=row["grade"], energy_kcal=row["energy_kcal"], fat_g=row["fat_g"],
        saturated_fat_g=row["saturated_fat_g"], sugar_g=row["sugar_g"],
        salt_g=row["salt_g"], fiber_g=row["fiber_g"], protein_g=row["protein_g"],
    )


@router.post("/api/batch/{batch_id}/nutri-score", response_model=NutriScoreCreated, status_code=201)
def add_nutri_score(batch_id: int, body: NutriScoreCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    grade = compute_nutri_grade(body.sugar_g, body.saturated_fat_g, body.salt_g)
    now = now_iso()
    c.execute(
        "INSERT INTO nutri_score (batch_id, energy_kcal, fat_g, saturated_fat_g, sugar_g, salt_g, fiber_g, protein_g, grade, computed_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING nutri_id",
        (batch_id, body.energy_kcal, body.fat_g, body.saturated_fat_g, body.sugar_g, body.salt_g, body.fiber_g, body.protein_g, grade, now)
    )
    nutri_id = c.fetchone()["nutri_id"]
    conn.commit()
    compute_trust_score(conn, batch_id)
    return NutriScoreCreated(nutri_id=nutri_id, grade=grade)


@router.get("/api/batch/{batch_id}/ecological-footprint", response_model=EcoFootprintResponse)
def get_eco_footprint(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT * FROM ecological_footprint WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (batch_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="ecological footprint not found")
    return EcoFootprintResponse(
        co2_total_kg=row["co2_total_kg"], water_liters=row["water_liters"],
        land_sqm=row["land_sqm"], transport_km=row["transport_km"],
    )


@router.post("/api/batch/{batch_id}/ecological-footprint", response_model=EcoFootprintCreated, status_code=201)
def add_eco_footprint(batch_id: int, body: EcoFootprintCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    now = now_iso()
    c.execute(
        "INSERT INTO ecological_footprint (batch_id, co2_total_kg, water_liters, land_sqm, transport_km, computed_at) VALUES (%s,%s,%s,%s,%s,%s) RETURNING eco_id",
        (batch_id, body.co2_total_kg, body.water_liters, body.land_sqm, body.transport_km, now)
    )
    eco_id = c.fetchone()["eco_id"]
    conn.commit()
    return EcoFootprintCreated(eco_id=eco_id)


@router.get("/api/batch/{batch_id}/price-breakdown", response_model=list[PriceBreakdownItem])
def get_price_breakdown(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT * FROM price_breakdown WHERE batch_id=%s", (batch_id,))
    rows = c.fetchall()
    return sorted(
        [PriceBreakdownItem(**dict(r)) for r in rows],
        key=lambda x: STAGE_ORDER.get(x.stage, 99)
    )


@router.post("/api/batch/{batch_id}/price-breakdown", response_model=PriceBreakdownCreated, status_code=201)
def add_price_breakdown(batch_id: int, body: PriceBreakdownCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    c.execute(
        "INSERT INTO price_breakdown (batch_id, stage, cost_chf, margin_pct, notes) VALUES (%s,%s,%s,%s,%s) RETURNING price_id",
        (batch_id, body.stage, body.cost_chf, body.margin_pct, body.notes)
    )
    price_id = c.fetchone()["price_id"]
    conn.commit()
    return PriceBreakdownCreated(price_id=price_id)


@router.get("/api/batch/{batch_id}/trust-score", response_model=TrustScoreResponse)
def get_trust_score(batch_id: int, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    score = compute_trust_score(conn, batch_id)
    c.execute("SELECT factors FROM trust_score WHERE batch_id=%s ORDER BY computed_at DESC LIMIT 1", (batch_id,))
    row = c.fetchone()
    factors = json.loads(row["factors"]) if row else {}
    return TrustScoreResponse(score=score, factors=factors)


@router.get("/api/leaderboard", response_model=list[LeaderboardItem])
def get_leaderboard(conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch")
    for row in c.fetchall():
        compute_trust_score(conn, row["batch_id"])

    c.execute("""
        SELECT b.batch_id, b.product_name, b.origin_country,
               ts.score as trust_score, ns.grade as nutri_grade
        FROM batch b
        JOIN trust_score ts ON b.batch_id = ts.batch_id
        LEFT JOIN nutri_score ns ON b.batch_id = ns.batch_id
        ORDER BY ts.score DESC
        LIMIT 10
    """)
    return [LeaderboardItem(**dict(r)) for r in c.fetchall()]


@router.post("/api/batch/{batch_id}/crowd-rating", response_model=CrowdRatingCreated, status_code=201)
def add_crowd_rating(batch_id: int, body: CrowdRatingCreate, conn=Depends(db)):
    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE batch_id=%s", (batch_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="batch not found")
    c.execute("SELECT rating_id FROM crowd_rating WHERE batch_id=%s AND user_token=%s", (batch_id, body.user_token))
    if c.fetchone():
        raise HTTPException(status_code=400, detail="user already rated this batch")
    now = now_iso()
    c.execute(
        "INSERT INTO crowd_rating (batch_id, stars, comment, user_token, submitted_at) VALUES (%s,%s,%s,%s,%s) RETURNING rating_id",
        (batch_id, body.stars, body.comment, body.user_token, now)
    )
    rating_id = c.fetchone()["rating_id"]
    conn.commit()

    c.execute(
        "INSERT INTO scan_event (user_token, batch_id, scanned_at) VALUES (%s,%s,%s)",
        (body.user_token, batch_id, now)
    )
    conn.commit()
    award_achievements(conn, body.user_token, "scan", batch_id)

    return CrowdRatingCreated(rating_id=rating_id)


@router.get("/api/user/{user_token}/achievements", response_model=list[AchievementItem])
def get_achievements(user_token: str, conn=Depends(db)):
    c = conn.cursor()
    c.execute(
        "SELECT achievement_type, earned_at, batch_id FROM achievement WHERE user_token=%s ORDER BY earned_at DESC",
        (user_token,)
    )
    return [AchievementItem(**dict(r)) for r in c.fetchall()]


@router.post("/api/scan/ocr", response_model=OcrResponse)
def scan_ocr(body: OcrRequest, conn=Depends(db)):
    from PIL import Image
    try:
        import pyzbar.pyzbar as pyzbar
    except ImportError:
        raise HTTPException(status_code=500, detail="pyzbar not available")

    try:
        image_data = base64.b64decode(body.image_base64)
        image = Image.open(io.BytesIO(image_data))
    except Exception:
        raise HTTPException(status_code=400, detail="invalid image data")

    decoded = pyzbar.decode(image)
    if not decoded:
        raise HTTPException(status_code=404, detail="no batch found in image")

    from urllib.parse import urlparse
    qr_value = decoded[0].data.decode("utf-8")
    parsed = urlparse(qr_value)
    path_parts = parsed.path.strip("/").split("/")
    qr_code = path_parts[-1] if path_parts else qr_value

    c = conn.cursor()
    c.execute("SELECT batch_id FROM batch WHERE qr_code=%s", (qr_code,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="no batch found in image")

    found_batch_id = row["batch_id"]
    if body.user_token:
        c.execute(
            "INSERT INTO scan_event (user_token, batch_id, scanned_at) VALUES (%s,%s,%s)",
            (body.user_token, found_batch_id, now_iso())
        )
        conn.commit()
        award_achievements(conn, body.user_token, "scan", found_batch_id)

    return OcrResponse(qr_code=qr_code, batch_id=found_batch_id)


def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200000)
    return salt.hex() + ":" + key.hex()


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, key_hex = stored.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200000)
        return key.hex() == key_hex
    except Exception:
        return False


@router.post("/api/auth/register", response_model=AuthResponse)
def auth_register(body: AuthRequest, conn=Depends(db)):
    email = body.email.strip().lower()
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Ungültige E-Mail-Adresse.")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen lang sein.")

    c = conn.cursor()
    c.execute("SELECT user_id FROM app_user WHERE email=%s", (email,))
    if c.fetchone():
        raise HTTPException(status_code=409, detail="Diese E-Mail-Adresse ist bereits registriert.")

    password_hash = _hash_password(body.password)
    created_at = datetime.utcnow().isoformat()
    c.execute(
        "INSERT INTO app_user (email, password_hash, created_at) VALUES (%s,%s,%s)",
        (email, password_hash, created_at),
    )
    conn.commit()
    return AuthResponse(email=email)


@router.post("/api/auth/login", response_model=AuthResponse)
def auth_login(body: AuthRequest, conn=Depends(db)):
    email = body.email.strip().lower()
    c = conn.cursor()
    c.execute("SELECT password_hash FROM app_user WHERE email=%s", (email,))
    row = c.fetchone()
    if not row or not _verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort ist falsch.")
    return AuthResponse(email=email)
