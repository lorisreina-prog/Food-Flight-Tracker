import json
from datetime import datetime


def recall_status(db, batch_id: int) -> str:
    c = db.cursor()
    c.execute(
        "SELECT severity FROM recall WHERE batch_id=%s AND resolved_at IS NULL",
        (batch_id,)
    )
    rows = c.fetchall()
    if not rows:
        return "none"
    order = {"critical": 3, "warning": 2, "info": 1}
    worst = max(rows, key=lambda r: order.get(r["severity"], 0))
    return worst["severity"]


def compute_nutri_grade(sugar_g: float, saturated_fat_g: float, salt_g: float) -> str:
    if sugar_g < 5 and saturated_fat_g < 1.5 and salt_g < 0.3:
        return "A"
    if sugar_g < 10 and saturated_fat_g < 3 and salt_g < 0.6:
        return "B"
    if sugar_g < 15 and saturated_fat_g < 5 and salt_g < 1.0:
        return "C"
    if sugar_g < 25 and saturated_fat_g < 8 and salt_g < 1.5:
        return "D"
    return "E"


def compute_trust_score(db, batch_id: int) -> int:
    c = db.cursor()
    score = 0
    factors = {}

    c.execute(
        "SELECT COUNT(DISTINCT station_id) as cnt FROM batch_event WHERE batch_id=%s AND station_id IS NOT NULL",
        (batch_id,)
    )
    station_count = c.fetchone()["cnt"]
    if station_count >= 3:
        score += 20
        factors["stations"] = 20
    else:
        factors["stations"] = 0

    c.execute(
        "SELECT COUNT(*) as cnt FROM certificate WHERE batch_id=%s AND verified=1",
        (batch_id,)
    )
    cert_count = c.fetchone()["cnt"]
    if cert_count >= 1:
        score += 20
        factors["certificates"] = 20
    else:
        factors["certificates"] = 0

    status = recall_status(db, batch_id)
    if status == "none":
        score += 20
        factors["no_recalls"] = 20
    else:
        factors["no_recalls"] = 0

    c.execute(
        "SELECT COUNT(*) as cnt FROM quality_check WHERE batch_id=%s AND passed=1",
        (batch_id,)
    )
    qc_count = c.fetchone()["cnt"]
    if qc_count >= 1:
        score += 20
        factors["quality_checks"] = 20
    else:
        factors["quality_checks"] = 0

    c.execute("SELECT COUNT(*) as cnt FROM nutri_score WHERE batch_id=%s", (batch_id,))
    nutri_count = c.fetchone()["cnt"]
    if nutri_count >= 1:
        score += 20
        factors["nutri_score"] = 20
    else:
        factors["nutri_score"] = 0

    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

    c.execute("SELECT trust_id FROM trust_score WHERE batch_id=%s", (batch_id,))
    existing = c.fetchone()
    if existing:
        c.execute(
            "UPDATE trust_score SET score=%s, factors=%s, computed_at=%s WHERE batch_id=%s",
            (score, json.dumps(factors), now, batch_id)
        )
    else:
        c.execute(
            "INSERT INTO trust_score (batch_id, score, factors, computed_at) VALUES (%s,%s,%s,%s)",
            (batch_id, score, json.dumps(factors), now)
        )

    db.commit()
    return score


def award_achievements(db, user_token: str, action: str, batch_id: int = None) -> None:
    c = db.cursor()
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")

    def has_achievement(atype: str) -> bool:
        c.execute(
            "SELECT ach_id FROM achievement WHERE user_token=%s AND achievement_type=%s",
            (user_token, atype)
        )
        return c.fetchone() is not None

    def award(atype: str, bid: int = None) -> None:
        if not has_achievement(atype):
            c.execute(
                "INSERT INTO achievement (user_token, achievement_type, earned_at, batch_id) VALUES (%s,%s,%s,%s)",
                (user_token, atype, now, bid)
            )
            db.commit()

    if action == "scan":
        c.execute(
            "SELECT COUNT(DISTINCT batch_id) as cnt FROM scan_event WHERE user_token=%s",
            (user_token,)
        )
        count = c.fetchone()["cnt"]
        if count >= 1:
            award("first_scan", batch_id)
        if count >= 10:
            award("explorer", batch_id)

    elif action == "complaint":
        if batch_id is not None:
            status = recall_status(db, batch_id)
            if status != "none":
                award("recall_reporter", batch_id)

        c.execute(
            "SELECT COUNT(*) as cnt FROM complaint WHERE reporter_name=%s",
            (user_token,)
        )
        complaint_count = c.fetchone()["cnt"]
        if complaint_count >= 5:
            award("quality_checker", batch_id)
