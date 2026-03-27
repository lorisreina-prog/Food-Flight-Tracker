import sqlite3
import os

DB_PATH = os.environ.get("DB_PATH", "fft.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS batch (
            batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            product_category TEXT NOT NULL,
            origin_farm TEXT NOT NULL,
            origin_country TEXT NOT NULL,
            harvest_date TEXT NOT NULL,
            qr_code TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS station (
            station_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            location TEXT NOT NULL,
            operator TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS batch_event (
            event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NULL,
            event_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            notes TEXT NULL,
            temp_celsius REAL NULL,
            co2_kg REAL NULL
        );

        CREATE TABLE IF NOT EXISTS recall (
            recall_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            severity TEXT NOT NULL,
            issued_at TEXT NOT NULL,
            resolved_at TEXT NULL,
            issued_by TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS complaint (
            complaint_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            reporter_name TEXT NOT NULL,
            reporter_email TEXT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            submitted_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open'
        );

        CREATE TABLE IF NOT EXISTS complaint_rate_limit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            submitted_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS certificate (
            cert_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            cert_type TEXT NOT NULL,
            issued_by TEXT NOT NULL,
            valid_until TEXT NOT NULL,
            verified INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS quality_check (
            check_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NOT NULL,
            checked_at TEXT NOT NULL,
            passed INTEGER NOT NULL,
            notes TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS cold_chain_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NOT NULL,
            recorded_at TEXT NOT NULL,
            temp_celsius REAL NOT NULL,
            min_temp REAL NOT NULL,
            max_temp REAL NOT NULL,
            within_range INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS iot_reading (
            reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            station_id INTEGER NOT NULL,
            sensor_type TEXT NOT NULL,
            value REAL NOT NULL,
            recorded_at TEXT NOT NULL,
            notes TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS risk_prediction (
            pred_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            risk_score INTEGER NOT NULL,
            risk_level TEXT NOT NULL,
            risk_factors TEXT NOT NULL,
            ai_explanation TEXT NOT NULL,
            shelf_life_days INTEGER NULL,
            predicted_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS nutri_score (
            nutri_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        );

        CREATE TABLE IF NOT EXISTS ecological_footprint (
            eco_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            co2_total_kg REAL NOT NULL,
            water_liters REAL NOT NULL,
            land_sqm REAL NOT NULL,
            transport_km INTEGER NOT NULL,
            computed_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS price_breakdown (
            price_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            stage TEXT NOT NULL,
            cost_chf REAL NOT NULL,
            margin_pct REAL NOT NULL,
            notes TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS trust_score (
            trust_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            factors TEXT NOT NULL,
            computed_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS crowd_rating (
            rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            stars INTEGER NOT NULL,
            comment TEXT NULL,
            user_token TEXT NOT NULL,
            submitted_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS achievement (
            ach_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_token TEXT NOT NULL,
            achievement_type TEXT NOT NULL,
            earned_at TEXT NOT NULL,
            batch_id INTEGER NULL
        );

        CREATE TABLE IF NOT EXISTS ai_chat_message (
            msg_id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            batch_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alternative_product (
            alt_id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            reason TEXT NOT NULL,
            co2_kg REAL NULL,
            nutri_grade TEXT NULL,
            trust_score INTEGER NULL
        );
    """)

    conn.commit()

    try:
        conn.execute("ALTER TABLE iot_reading ADD COLUMN notes TEXT NULL")
        conn.commit()
    except Exception:
        pass

    conn.close()


def is_db_empty():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM batch")
    count = c.fetchone()[0]
    conn.close()
    return count == 0
