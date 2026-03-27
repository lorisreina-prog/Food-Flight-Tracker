import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]


def get_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS batch (
            batch_id SERIAL PRIMARY KEY,
            product_name TEXT NOT NULL,
            product_category TEXT NOT NULL,
            origin_farm TEXT NOT NULL,
            origin_country TEXT NOT NULL,
            harvest_date TEXT NOT NULL,
            qr_code TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS station (
            station_id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            location TEXT NOT NULL,
            operator TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS batch_event (
            event_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NULL,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            notes TEXT NULL,
            temp_celsius REAL NULL,
            co2_kg REAL NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS recall (
            recall_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            severity TEXT NOT NULL,
            issued_at TEXT NOT NULL,
            resolved_at TEXT NULL,
            issued_by TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS complaint (
            complaint_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            reporter_name TEXT NOT NULL,
            reporter_email TEXT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open'
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS complaint_rate_limit (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            submitted_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS certificate (
            cert_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            cert_type TEXT NOT NULL,
            issued_by TEXT NOT NULL,
            valid_until TEXT NOT NULL,
            verified INTEGER NOT NULL DEFAULT 0
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS quality_check (
            check_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NOT NULL,
            checked_at TEXT NOT NULL,
            passed INTEGER NOT NULL,
            notes TEXT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS cold_chain_log (
            log_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NOT NULL,
            recorded_at TEXT NOT NULL,
            temp_celsius REAL NOT NULL,
            min_temp REAL NOT NULL,
            max_temp REAL NOT NULL,
            within_range INTEGER NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS iot_reading (
            reading_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NOT NULL,
            sensor_type TEXT NOT NULL,
            value REAL NOT NULL,
            recorded_at TEXT NOT NULL,
            notes TEXT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS risk_prediction (
            pred_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            risk_score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            risk_factors TEXT NOT NULL,
            ai_explanation TEXT NOT NULL,
            shelf_life_days INTEGER NULL,
            predicted_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS nutri_score (
            nutri_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            energy_kcal REAL NOT NULL,
            fat_g REAL NOT NULL,
            saturated_fat_g REAL NOT NULL,
            sugar_g REAL NOT NULL,
            salt_g REAL NOT NULL,
            fiber_g REAL NOT NULL,
            protein_g REAL NOT NULL,
            grade TEXT NOT NULL,
            computed_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS ecological_footprint (
            eco_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            co2_total_kg REAL NOT NULL,
            water_liters REAL NOT NULL,
            land_sqm REAL NOT NULL,
            transport_km INTEGER NOT NULL,
            computed_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS price_breakdown (
            price_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            stage TEXT NOT NULL,
            cost_chf REAL NOT NULL,
            margin_pct REAL NOT NULL,
            notes TEXT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS trust_score (
            trust_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            factors TEXT NOT NULL,
            computed_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS crowd_rating (
            rating_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            stars INTEGER NOT NULL,
            comment TEXT NULL,
            user_token TEXT NOT NULL,
            submitted_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS achievement (
            ach_id SERIAL PRIMARY KEY,
            user_token TEXT NOT NULL,
            achievement_type TEXT NOT NULL,
            earned_at TEXT NOT NULL,
            batch_id INTEGER NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS ai_chat_message (
            msg_id SERIAL PRIMARY KEY,
            session_id TEXT NOT NULL,
            batch_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS alternative_product (
            alt_id SERIAL PRIMARY KEY,
            batch_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            reason TEXT NOT NULL,
            co2_kg REAL NULL,
            nutri_grade TEXT NULL,
            trust_score INTEGER NULL
        )
    """)
    conn.commit()
    conn.close()


def is_db_empty():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM batch")
    count = c.fetchone()["count"]
    conn.close()
    return count == 0
