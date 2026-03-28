import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db import init_db, get_connection, is_db_empty
from router import router
from qr import generate_qr, QR_DIR
from models import compute_trust_score, compute_nutri_grade


def seed_data():
    conn = get_connection()
    c = conn.cursor()

    stations = [
        ("Hof Müller", "farm", "Emmental, BE", "Familie Müller"),
        ("Käserei Vogel", "processing", "Burgdorf, BE", "Käserei Vogel GmbH"),
        ("Kühllager Nordost", "storage", "Zürich, ZH", "Logi-Swiss AG"),
        ("Transporte Bärtschi", "transport", "Bern, BE", "Bärtschi Transport"),
        ("Migros Bern", "retailer", "Bern, BE", "Migros Genossenschaft"),
    ]
    for s in stations:
        c.execute("INSERT INTO station (name, type, location, operator) VALUES (%s,%s,%s,%s)", s)
    conn.commit()

    batches = [
        ("Emmentaler AOP", "Käse", "Hof Müller", "Schweiz", "2026-02-10", "FFT-BATCH-001", "LOT-2026-0210-E1"),
        ("Demeter Karotten", "Gemüse", "Biohof Stern", "Schweiz", "2026-03-01", "FFT-BATCH-002", "LOT-2026-0301-K2"),
        ("Valser Mineralwasser", "Getränke", "Valser Quellen", "Schweiz", "2026-03-15", "FFT-BATCH-003", "LOT-2026-0315-W3"),
    ]
    for b in batches:
        c.execute(
            "INSERT INTO batch (product_name, product_category, origin_farm, origin_country, harvest_date, qr_code, batch_code, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (*b, "2026-03-10T08:00:00")
        )
    conn.commit()

    for bid, qr in [(1, "FFT-BATCH-001"), (2, "FFT-BATCH-002"), (3, "FFT-BATCH-003")]:
        generate_qr(bid, qr)

    events = [
        (1, 1, "arrived",    "2026-02-10T07:00:00", "Milch angeliefert",         8.2,  0.1),
        (1, 2, "inspected",  "2026-02-12T09:00:00", "Qualitätskontrolle OK",     None, None),
        (1, 2, "departed",   "2026-02-14T14:00:00", None,                         None, 0.3),
        (1, 3, "stored",     "2026-02-15T10:00:00", "Einlagerung Kühlraum",      4.5,  None),
        (1, 4, "shipped",    "2026-03-01T06:00:00", "Lieferung Bern",            None, 0.8),
        (1, 5, "sold",       "2026-03-05T12:00:00", None,                         None, None),

        (2, 1, "arrived",    "2026-03-01T06:00:00", "Ernte abgeschlossen",       12.0, 0.05),
        (2, 2, "inspected",  "2026-03-02T08:00:00", "Bio-Zertifikat geprüft",    None, None),
        (2, 3, "stored",     "2026-03-03T10:00:00", "Kühllager",                 2.0,  None),
        (2, 4, "shipped",    "2026-03-10T05:00:00", None,                         None, 0.4),
        (2, 5, "sold",       "2026-03-12T14:00:00", None,                         None, None),

        (3, 1, "arrived",    "2026-03-15T08:00:00", "Abfüllung Mineralwasser",   None, 0.02),
        (3, 2, "inspected",  "2026-03-16T09:00:00", "Qualitätsprüfung bestanden",None, None),
        (3, 3, "stored",     "2026-03-17T11:00:00", None,                         8.0,  None),
        (3, 4, "shipped",    "2026-03-20T07:00:00", "Lieferung Migros",          None, 0.2),
        (3, 5, "sold",       "2026-03-22T15:00:00", None,                         None, None),
    ]
    for e in events:
        c.execute(
            "INSERT INTO batch_event (batch_id, station_id, event_type, timestamp, notes, temp_celsius, co2_kg) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            e
        )
    conn.commit()

    recalls = [
        (1, "Listerien-Verdacht bei Charge vom 10.02.2026", "critical", "2026-03-08T10:00:00", None, "Kantonales Labor Bern"),
        (2, "Erhöhte Pestizidrückstände festgestellt", "warning", "2026-03-05T08:00:00", "2026-03-07T16:00:00", "BLV Bern"),
    ]
    for r in recalls:
        c.execute(
            "INSERT INTO recall (batch_id, reason, severity, issued_at, resolved_at, issued_by) VALUES (%s,%s,%s,%s,%s,%s)",
            r
        )
    conn.commit()

    c.execute(
        "INSERT INTO batch_event (batch_id, station_id, event_type, timestamp, notes, temp_celsius, co2_kg) VALUES (%s,NULL,'recalled',%s,%s,NULL,NULL)",
        (1, "2026-03-08T10:00:00", "Listerien-Verdacht bei Charge vom 10.02.2026")
    )
    conn.commit()

    complaints = [
        (1, "Hans Meier", "hans@example.com", "Käse schmeckt bitter", "quality", "2026-03-09T11:00:00", "open"),
        (1, "Sandra Frei", None, "Verpackung beschädigt", "labeling", "2026-03-09T14:00:00", "open"),
        (2, "Peter Keller", "peter@example.com", "Karotten weich und fleckig", "quality", "2026-03-13T09:00:00", "reviewed"),
    ]
    for comp in complaints:
        c.execute(
            "INSERT INTO complaint (batch_id, reporter_name, reporter_email, description, category, submitted_at, status) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            comp
        )
        c.execute("INSERT INTO complaint_rate_limit (batch_id, submitted_at) VALUES (%s,%s)", (comp[0], comp[5]))
    conn.commit()

    certs = [
        (2, "bio", "Bio Suisse", "2027-01-01", 1),
        (2, "fairtrade", "Fairtrade International", "2027-06-30", 1),
    ]
    for cert in certs:
        c.execute("INSERT INTO certificate (batch_id, cert_type, issued_by, valid_until, verified) VALUES (%s,%s,%s,%s,%s)", cert)
    conn.commit()

    quality_checks = [
        (1, 2, "2026-02-12T09:30:00", 1, "Alle Parameter im Normbereich"),
        (2, 2, "2026-03-02T08:30:00", 1, "Bio-Standards erfüllt"),
        (2, 3, "2026-03-03T11:00:00", 0, "Temperatur kurzzeitig überschritten"),
        (3, 2, "2026-03-16T09:30:00", 1, "Wasserwerte einwandfrei"),
        (3, 5, "2026-03-22T10:00:00", 1, "Endkontrolle bestanden"),
    ]
    for qc in quality_checks:
        c.execute("INSERT INTO quality_check (batch_id, station_id, checked_at, passed, notes) VALUES (%s,%s,%s,%s,%s)", qc)
    conn.commit()

    cold_chain = [
        (1, 3, "2026-02-15T10:00:00", 4.5, 2.0, 6.0, 1),
        (1, 4, "2026-03-01T06:00:00", 5.8, 2.0, 6.0, 1),
        (2, 3, "2026-03-03T10:00:00", 2.0, 0.0, 4.0, 1),
        (2, 3, "2026-03-04T06:00:00", 6.5, 0.0, 4.0, 0),
        (3, 3, "2026-03-17T11:00:00", 8.0, 6.0, 10.0, 1),
        (3, 4, "2026-03-20T07:00:00", 7.5, 6.0, 10.0, 1),
    ]
    for cl in cold_chain:
        c.execute("INSERT INTO cold_chain_log (batch_id, station_id, recorded_at, temp_celsius, min_temp, max_temp, within_range) VALUES (%s,%s,%s,%s,%s,%s,%s)", cl)
    conn.commit()

    iot_readings = [
        (3, 3, "temperature", 8.1, "2026-03-17T11:00:00"),
        (3, 3, "humidity",    65.0, "2026-03-17T11:00:00"),
        (3, 4, "temperature", 7.5, "2026-03-20T07:00:00"),
        (3, 4, "humidity",    60.0, "2026-03-20T07:00:00"),
        (3, 5, "temperature", 9.2, "2026-03-22T12:00:00"),
        (3, 5, "humidity",    55.0, "2026-03-22T12:00:00"),
    ]
    for ir in iot_readings:
        c.execute("INSERT INTO iot_reading (batch_id, station_id, sensor_type, value, recorded_at) VALUES (%s,%s,%s,%s,%s)", ir)
    conn.commit()

    risk_predictions = [
        (1, 85, "critical",
         json.dumps(["Aktiver Listerien-Rückruf", "Kritische Rückrufwarnung aktiv", "Mehrere Kundenbeschwerden"]),
         "Kritisches Risiko aufgrund aktiven Listerien-Rückrufs. Produkt sollte nicht konsumiert werden.",
         0, "2026-03-10T09:00:00"),
        (2, 35, "medium",
         json.dumps(["Kühlkettenunterbrechung festgestellt", "Pestizidrückstände erhöht (gelöst)"]),
         "Mittleres Risiko durch dokumentierte Kühlkettenunterbrechung. Bio-Zertifikate positiv.",
         12, "2026-03-13T10:00:00"),
        (3, 12, "low",
         json.dumps(["Alle Qualitätskontrollen bestanden"]),
         "Niedriges Risiko. Alle Kontrollen bestanden, keine Beanstandungen.",
         180, "2026-03-22T15:00:00"),
    ]
    for rp in risk_predictions:
        c.execute(
            "INSERT INTO risk_prediction (batch_id, risk_score, risk_level, risk_factors, ai_explanation, shelf_life_days, predicted_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            rp
        )
    conn.commit()

    nutri_scores = [
        (1, 390.0, 31.0, 19.0, 0.1, 1.7, 0.0, 28.0, "2026-03-10T08:00:00"),
        (2, 35.0,  0.2,  0.0,  5.0, 0.07, 2.8, 0.9, "2026-03-13T08:00:00"),
        (3, 0.0,   0.0,  0.0,  0.0, 0.01, 0.0, 0.0, "2026-03-22T08:00:00"),
    ]
    for ns in nutri_scores:
        bid = ns[0]
        sugar = ns[4]
        sat_fat = ns[3]
        salt = ns[5]
        grade = compute_nutri_grade(sugar, sat_fat, salt)
        c.execute(
            "INSERT INTO nutri_score (batch_id, energy_kcal, fat_g, saturated_fat_g, sugar_g, salt_g, fiber_g, protein_g, grade, computed_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (bid, ns[1], ns[2], ns[3], ns[4], ns[5], ns[6], ns[7], grade, ns[8])
        )
    conn.commit()

    eco_footprints = [
        (2, 1.8, 320.0, 12.0, 45,  "2026-03-13T08:00:00"),
        (3, 0.4, 0.0,   0.0,  120, "2026-03-22T08:00:00"),
    ]
    for ef in eco_footprints:
        c.execute(
            "INSERT INTO ecological_footprint (batch_id, co2_total_kg, water_liters, land_sqm, transport_km, computed_at) VALUES (%s,%s,%s,%s,%s,%s)",
            ef
        )
    conn.commit()

    price_breakdowns = [
        (1, "farm",       1.80, 15.0, None),
        (1, "processing", 3.20, 25.0, "Käseherstellung"),
        (1, "transport",  0.40, 10.0, None),
        (1, "retail",     2.60, 35.0, "Migros Marge"),
        (3, "farm",       0.10, 5.0,  "Quellengebühr"),
        (3, "processing", 0.25, 20.0, "Abfüllung"),
        (3, "transport",  0.08, 8.0,  None),
        (3, "retail",     0.57, 40.0, None),
    ]
    for pb in price_breakdowns:
        c.execute("INSERT INTO price_breakdown (batch_id, stage, cost_chf, margin_pct, notes) VALUES (%s,%s,%s,%s,%s)", pb)
    conn.commit()

    for bid in [1, 2, 3]:
        compute_trust_score(conn, bid)

    crowd_ratings = [
        (1, 2, "Schlechter Geschmack nach dem Rückruf", "user-alpha", "2026-03-09T18:00:00"),
        (2, 5, "Tolle Bio-Qualität!", "user-beta", "2026-03-13T20:00:00"),
        (3, 4, "Erfrischend und sauber", "demo-user-001", "2026-03-23T10:00:00"),
    ]
    for cr in crowd_ratings:
        c.execute("INSERT INTO crowd_rating (batch_id, stars, comment, user_token, submitted_at) VALUES (%s,%s,%s,%s,%s)", cr)
    conn.commit()

    scan_events = [
        ("demo-user-001", 3, "2026-03-23T10:00:00"),
    ]
    for se in scan_events:
        c.execute("INSERT INTO scan_event (user_token, batch_id, scanned_at) VALUES (%s,%s,%s)", se)
    conn.commit()

    achievements = [
        ("demo-user-001", "first_scan", "2026-03-23T10:00:00", 3),
    ]
    for ach in achievements:
        c.execute("INSERT INTO achievement (user_token, achievement_type, earned_at, batch_id) VALUES (%s,%s,%s,%s)", ach)
    conn.commit()

    alternatives = [
        (1, "Gruyère AOP", "Geringere Rückrufhistorie, ähnlicher Geschmack", 2.1, "D", 80),
        (1, "Appenzeller", "Keine aktiven Rückrufe, lokal produziert",         1.8, "D", 75),
    ]
    for alt in alternatives:
        c.execute("INSERT INTO alternative_product (batch_id, product_name, reason, co2_kg, nutri_grade, trust_score) VALUES (%s,%s,%s,%s,%s,%s)", alt)
    conn.commit()

    conn.close()


def seed_product_L2600992():
    """Insert or recreate demo product L2600992 (Club Mate)."""
    conn = get_connection()
    c = conn.cursor()

    # Delete existing entry so we can re-seed with correct data
    c.execute("SELECT batch_id FROM batch WHERE batch_code=%s OR qr_code=%s", ("L2600992", "L2600992"))
    existing = c.fetchone()
    if existing:
        old_bid = existing["batch_id"]
        for tbl in ["batch_event", "recall", "complaint", "complaint_rate_limit", "certificate",
                    "quality_check", "cold_chain_log", "iot_reading", "risk_prediction",
                    "nutri_score", "ecological_footprint", "price_breakdown", "trust_score",
                    "crowd_rating", "scan_event", "achievement", "alternative_product",
                    "ai_chat_message"]:
            c.execute(f"DELETE FROM {tbl} WHERE batch_id=%s", (old_bid,))
        c.execute("DELETE FROM batch WHERE batch_id=%s", (old_bid,))
        conn.commit()

    # Ensure stations exist (use station ids 1-5 from original seed)
    c.execute("SELECT station_id FROM station WHERE name='Hof Müller' LIMIT 1")
    if not c.fetchone():
        conn.close()
        return
    sid_farm, sid_proc, sid_stor, sid_trans, sid_retail = 1, 2, 3, 4, 5

    c.execute(
        "INSERT INTO batch (product_name, product_category, origin_farm, origin_country, harvest_date, qr_code, batch_code, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING batch_id",
        ("Club Mate", "Getränke", "Hacienda La Merced", "Argentinien", "2025-11-15", "L2600992", "L2600992", "2026-01-10T06:00:00")
    )
    bid = c.fetchone()["batch_id"]
    conn.commit()

    generate_qr(bid, "L2600992")

    events = [
        (bid, sid_farm,   "arrived",   "2025-11-15T08:00:00", "Maté-Ernte abgeschlossen, Argentinien",          22.0, 0.3),
        (bid, sid_proc,   "inspected", "2025-11-20T10:00:00", "Qualitätskontrolle & Bio-Zertifikat geprüft",    None, None),
        (bid, sid_proc,   "departed",  "2025-12-01T07:00:00", "Abfüllung & Abfertigung Hamburg",                None, 4.8),
        (bid, sid_stor,   "stored",    "2026-01-10T12:00:00", "Einlagerung Kühlhaus Zürich",                     18.0, None),
        (bid, sid_trans,  "shipped",   "2026-03-15T05:00:00", "Lieferung Detailhandel — Temperaturanstieg",     28.0, 0.4),
        (bid, sid_retail, "sold",      "2026-03-20T10:00:00", "Verfügbar im Regal",                              None, None),
    ]
    for e in events:
        c.execute("INSERT INTO batch_event (batch_id, station_id, event_type, timestamp, notes, temp_celsius, co2_kg) VALUES (%s,%s,%s,%s,%s,%s,%s)", e)
    conn.commit()

    cold_chain = [
        (bid, sid_stor,  "2026-01-10T12:00:00", 18.0, 10.0, 25.0, 1),
        (bid, sid_stor,  "2026-02-01T08:00:00", 17.5, 10.0, 25.0, 1),
        (bid, sid_trans, "2026-03-15T05:00:00", 28.0, 10.0, 25.0, 0),
        (bid, sid_trans, "2026-03-15T10:00:00", 31.2, 10.0, 25.0, 0),
        (bid, sid_trans, "2026-03-15T15:00:00", 22.5, 10.0, 25.0, 1),
        (bid, sid_retail,"2026-03-20T10:00:00", 19.5, 10.0, 25.0, 1),
    ]
    for cl in cold_chain:
        c.execute("INSERT INTO cold_chain_log (batch_id, station_id, recorded_at, temp_celsius, min_temp, max_temp, within_range) VALUES (%s,%s,%s,%s,%s,%s,%s)", cl)
    conn.commit()

    iot_readings = [
        (bid, sid_stor,  "temperature", 18.0, "2026-01-10T12:00:00"),
        (bid, sid_stor,  "humidity",    55.0, "2026-01-10T12:00:00"),
        (bid, sid_trans, "temperature", 28.0, "2026-03-15T05:00:00"),
        (bid, sid_trans, "humidity",    62.0, "2026-03-15T05:00:00"),
        (bid, sid_trans, "temperature", 31.2, "2026-03-15T10:00:00"),
        (bid, sid_trans, "humidity",    58.0, "2026-03-15T10:00:00"),
        (bid, sid_retail,"temperature", 19.5, "2026-03-20T10:00:00"),
        (bid, sid_retail,"humidity",    50.0, "2026-03-20T10:00:00"),
    ]
    for ir in iot_readings:
        c.execute("INSERT INTO iot_reading (batch_id, station_id, sensor_type, value, recorded_at) VALUES (%s,%s,%s,%s,%s)", ir)
    conn.commit()

    c.execute(
        "INSERT INTO recall (batch_id, reason, severity, issued_at, resolved_at, issued_by) VALUES (%s,%s,%s,%s,%s,%s)",
        (bid, "Temperaturüberschreitung während Transport (31°C für >5h)", "warning", "2026-03-16T08:00:00", None, "Lebensmittelkontrolle Zürich")
    )
    conn.commit()

    complaints = [
        (bid, "Jonas Weber",   "jonas@example.com", "Flasche leicht aufgebläht",     "quality", "2026-03-22T09:00:00", "open"),
        (bid, "Laura Schmid",  None,                 "Geschmack ungewöhnlich bitter", "quality", "2026-03-23T14:00:00", "reviewed"),
    ]
    for comp in complaints:
        c.execute("INSERT INTO complaint (batch_id, reporter_name, reporter_email, description, category, submitted_at, status) VALUES (%s,%s,%s,%s,%s,%s,%s)", comp)
        c.execute("INSERT INTO complaint_rate_limit (batch_id, submitted_at) VALUES (%s,%s)", (bid, comp[5]))
    conn.commit()

    certs = [
        (bid, "bio",       "Bio Argentina",         "2027-06-01", 1),
        (bid, "fairtrade", "Fairtrade International","2027-12-31", 1),
    ]
    for cert in certs:
        c.execute("INSERT INTO certificate (batch_id, cert_type, issued_by, valid_until, verified) VALUES (%s,%s,%s,%s,%s)", cert)
    conn.commit()

    quality_checks = [
        (bid, sid_proc,   "2025-11-20T10:30:00", 1, "Koffein- & Zuckergehalt im Normbereich"),
        (bid, sid_stor,   "2026-01-10T13:00:00", 1, "Lagertemperatur OK, keine Undichtigkeiten"),
        (bid, sid_retail, "2026-03-20T10:30:00", 0, "Temperaturanomalie während Transport festgestellt"),
    ]
    for qc in quality_checks:
        c.execute("INSERT INTO quality_check (batch_id, station_id, checked_at, passed, notes) VALUES (%s,%s,%s,%s,%s)", qc)
    conn.commit()

    c.execute(
        "INSERT INTO risk_prediction (batch_id, risk_score, risk_level, risk_factors, ai_explanation, shelf_life_days, predicted_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (bid, 68, "high",
         json.dumps(["Hitzestress während Transport: 31.2°C für >5h", "Aktive Rückrufwarnung wegen Temperaturüberschreitung", "Endkontrolle nicht bestanden", "2 Kundenbeschwerden eingegangen"]),
         "Erhöhtes Risiko durch dokumentierte Hitzeexposition während Transport (31.2°C über 5 Stunden). KI-Analyse ergibt 68% Wahrscheinlichkeit für Qualitätsverlust — Kohlensäureverlust und Geschmacksveränderung möglich. Kühlkettenbruch nicht relevant; Wärmebelastung ist das Hauptproblem.",
         14, "2026-03-20T11:00:00")
    )
    conn.commit()

    sugar, sat_fat, salt = 5.6, 0.0, 0.01
    grade = compute_nutri_grade(sugar, sat_fat, salt)
    c.execute(
        "INSERT INTO nutri_score (batch_id, energy_kcal, fat_g, saturated_fat_g, sugar_g, salt_g, fiber_g, protein_g, grade, computed_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (bid, 25.0, 0.0, 0.0, 5.6, 0.01, 0.0, 0.2, grade, "2026-01-10T08:00:00")
    )
    conn.commit()

    c.execute(
        "INSERT INTO ecological_footprint (batch_id, co2_total_kg, water_liters, land_sqm, transport_km, computed_at) VALUES (%s,%s,%s,%s,%s,%s)",
        (bid, 3.8, 80.0, 2.1, 11800, "2026-01-10T08:00:00")
    )
    conn.commit()

    price_breakdown = [
        (bid, "farm",       0.30, 12.0, "Maté-Ernte Argentinien"),
        (bid, "processing", 0.45, 18.0, "Abfüllung & Karbonisierung"),
        (bid, "transport",  0.55, 22.0, "Seefracht + LKW CH"),
        (bid, "retail",     1.20, 42.0, "Detailhandel Marge"),
    ]
    for pb in price_breakdown:
        c.execute("INSERT INTO price_breakdown (batch_id, stage, cost_chf, margin_pct, notes) VALUES (%s,%s,%s,%s,%s)", pb)
    conn.commit()

    alternatives = [
        (bid, "Charitea Mate",    "Kürzere Transportwege, keine Temperaturprobleme", 2.1, "B", 82),
        (bid, "Bio Mate Tee (lose)", "Regionaler Händler, deutlich geringerer CO₂-Fußabdruck", 0.8, "A", 90),
    ]
    for alt in alternatives:
        c.execute("INSERT INTO alternative_product (batch_id, product_name, reason, co2_kg, nutri_grade, trust_score) VALUES (%s,%s,%s,%s,%s,%s)", alt)
    conn.commit()

    c.execute(
        "INSERT INTO crowd_rating (batch_id, stars, comment, user_token, submitted_at) VALUES (%s,%s,%s,%s,%s)",
        (bid, 3, "Schmeckt gut, aber nach dem Rückruf bin ich unsicher", "demo-user-002", "2026-03-23T18:00:00")
    )
    conn.commit()

    compute_trust_score(conn, bid)
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(QR_DIR, exist_ok=True)
    init_db()
    if is_db_empty():
        seed_data()
    seed_product_L2600992()
    yield


app = FastAPI(title="Food Flight Tracker API", lifespan=lifespan)

_cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_cors_regex = os.environ.get("CORS_ORIGINS_REGEX", r"https://food-flight-tracker-.*\.vercel\.app")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins.split(",")],
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(QR_DIR, exist_ok=True)
app.mount("/qr_images", StaticFiles(directory=QR_DIR), name="qr_images")

app.include_router(router)
