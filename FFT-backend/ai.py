import json
from anthropic import Anthropic

client = Anthropic()
MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 1000


def chat_with_assistant(batch_data: dict, message: str, history: list[dict]) -> str:
    batch_json = json.dumps(batch_data, ensure_ascii=False, default=str)
    system = (
        f"Du bist ein freundlicher Lebensmittel-Assistent. "
        f"Du hast Zugang zu folgenden Produktdaten: {batch_json}. "
        f"Beantworte Fragen über dieses Produkt, seine Reise, "
        f"Inhaltsstoffe, Herkunft, Risiken und Nachhaltigkeit. "
        f"Antworte immer auf Deutsch. Sei präzise und hilfreich. "
        f"Wenn du etwas nicht weisst, sag es ehrlich."
    )
    messages = history + [{"role": "user", "content": message}]
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            messages=messages,
        )
        return response.content[0].text
    except Exception:
        return "Entschuldigung, der Assistent ist momentan nicht verfügbar."


def generate_risk_explanation(batch_data: dict, score: int, factors: list[str]) -> str:
    batch_summary = (
        f"{batch_data.get('product_name', '')} aus {batch_data.get('origin_country', '')}, "
        f"Kategorie: {batch_data.get('product_category', '')}, "
        f"Erntedatum: {batch_data.get('harvest_date', '')}"
    )
    prompt = (
        f"Erkläre in 2-3 Sätzen warum dieses Lebensmittel "
        f"ein Risikolevel von {score}/100 hat. "
        f"Risikofaktoren: {', '.join(factors)}. "
        f"Produktdaten: {batch_summary}. "
        f"Sei direkt und verständlich für Konsumenten."
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception:
        if score >= 76:
            return f"Kritisches Risiko ({score}/100). Dieses Produkt weist schwerwiegende Sicherheitsprobleme auf und sollte nicht konsumiert werden."
        if score >= 51:
            return f"Hohes Risiko ({score}/100). Bei diesem Produkt wurden bedeutende Qualitätsmängel festgestellt."
        if score >= 26:
            return f"Mittleres Risiko ({score}/100). Bei diesem Produkt gibt es einige Auffälligkeiten, die beachtet werden sollten."
        return f"Niedriges Risiko ({score}/100). Dieses Produkt erfüllt die Qualitätsanforderungen."


def predict_shelf_life(batch_data: dict) -> int:
    prompt = (
        f"Schätze die verbleibende Haltbarkeit in Tagen für: "
        f"Produkt: {batch_data.get('product_name', '')}, "
        f"Kategorie: {batch_data.get('product_category', '')}, "
        f"Erntedatum: {batch_data.get('harvest_date', '')}, "
        f"Kühlkette ok: {batch_data.get('cold_chain_ok', True)}, "
        f"Temperaturverstösse: {batch_data.get('breaches', 0)}. "
        f"Antworte NUR mit einer Zahl (Tage). Nichts sonst."
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        return int("".join(c for c in text if c.isdigit()) or "7")
    except Exception:
        return 7


def generate_alternatives(batch_data: dict) -> list[dict]:
    prompt = (
        f"Schlage 2-3 alternative Produkte zu '{batch_data.get('product_name', '')}' "
        f"(Kategorie: {batch_data.get('product_category', '')}, "
        f"Herkunft: {batch_data.get('origin_country', '')}) vor. "
        f"Fokus auf bessere Nachhaltigkeit oder Qualität. "
        f"Antworte NUR mit einem JSON-Array in diesem Format: "
        f'[{{"product_name": "string", "reason": "string", "co2_kg": 1.5, "nutri_grade": "A"}}]'
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system="Respond ONLY with a JSON array. No text before or after.",
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        return json.loads(text)
    except Exception:
        return []


def analyse_anomaly(
    batch_id: int,
    temp_value: float,
    product_category: str,
    context_readings: list[dict],
) -> str:
    context_str = json.dumps(context_readings, ensure_ascii=False, default=str)
    prompt = (
        f"Ein Temperatursensor hat einen Ausreisser erkannt. "
        f"Produkt: {product_category}, Gemessene Temperatur: {temp_value}°C. "
        f"Letzte Messungen: {context_str}. "
        f"Erkläre in 1-2 Sätzen das Risiko für dieses Produkt "
        f"und was zu tun ist. Sei klar und direkt."
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception:
        return (
            f"Anomalie erkannt: Temperatur {temp_value}°C liegt ausserhalb des zulässigen Bereichs "
            f"für {product_category}. Bitte sofort prüfen und Kühlkette sicherstellen."
        )
