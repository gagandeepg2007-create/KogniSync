#!/usr/bin/env python3
"""
scripts/init_db.py — Local PostgreSQL Database Initializer for KogniSync.

Applies BookingInventory/data/schema.sql and imports CSV data from
BookingInventory/data/csv/ in foreign-key load order into PostgreSQL.

Reads environment configuration from .env or system environment.
"""
import glob
import os
import re
import sys
import psycopg2
from dotenv import load_dotenv

# Load local .env configuration
load_dotenv()

DB_HOST = os.getenv("POSTGRES_SERVER", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5434"))
DB_USER = os.getenv("POSTGRES_USER", "kognisync")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "kognisync_pass")
DB_NAME = os.getenv("POSTGRES_DB", "kognisync_db")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_SQL_PATH = os.path.join(BASE_DIR, "BookingInventory", "data", "schema.sql")
CSV_DIR = os.path.join(BASE_DIR, "BookingInventory", "data", "csv")


def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME
    )


def reset_and_apply_schema(conn):
    print("Resetting public schema and applying BookingInventory/data/schema.sql...")
    with conn.cursor() as cur:
        cur.execute("DROP SCHEMA public CASCADE;")
        cur.execute("CREATE SCHEMA public;")
        cur.execute("GRANT ALL ON SCHEMA public TO public;")
        
        with open(SCHEMA_SQL_PATH, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        
        # Execute schema statement by statement or handle optional vector extension
        statements = schema_sql.split(";")
        for stmt in statements:
            stmt_strip = stmt.strip()
            if not stmt_strip:
                continue
            if "CREATE EXTENSION" in stmt_strip.upper() and "VECTOR" in stmt_strip.upper():
                try:
                    cur.execute(stmt_strip + ";")
                except Exception as ext_err:
                    conn.rollback()
                    cur.execute("CREATE SCHEMA public;")
                    print(f"Note: Optional extension 'vector' skipped ({ext_err.pgcode or ext_err}).")
            else:
                cur.execute(stmt_strip + ";")
    conn.commit()
    print("Schema created successfully.")


def load_csv_data(conn):
    csv_files = sorted(glob.glob(os.path.join(CSV_DIR, "*.csv")))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {CSV_DIR}")

    print(f"Loading {len(csv_files)} CSV files into PostgreSQL in dependency order...")
    total_rows = 0

    with conn.cursor() as cur:
        for filepath in csv_files:
            filename = os.path.basename(filepath)
            # Table name is filename stripped of number prefix and .csv suffix (e.g. 03_hotels.csv -> hotels)
            table_name = re.sub(r"^\d+[_-]", "", os.path.splitext(filename)[0])
            
            with open(filepath, "r", encoding="utf-8") as f:
                copy_sql = f"COPY {table_name} FROM STDIN WITH (FORMAT csv, HEADER true, ENCODING 'UTF-8')"
                cur.copy_expert(sql=copy_sql, file=f)
            
            cur.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cur.fetchone()[0]
            total_rows += count
            print(f"  Loaded {table_name:20s} <- {filename:28s} ({count:,} rows)")

    conn.commit()
    print(f"CSV data load complete. Total rows loaded: {total_rows:,}")
    return total_rows


def verify_database(conn):
    print("\nExecuting independent PostgreSQL verifications...")
    with conn.cursor() as cur:
        # 1. Verify table count
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        table_count = cur.fetchone()[0]
        
        # 2. Verify total row count across 20 tables
        cur.execute("""
            SELECT SUM(n_live_tup) 
            FROM pg_stat_user_tables 
            WHERE schemaname = 'public'
        """)
        
        # 3. Check inventory invariant (booked_units + held_units <= total_units)
        cur.execute("""
            SELECT COUNT(*) 
            FROM inventory_calendar 
            WHERE booked_units + held_units > total_units
        """)
        invariant_violations = cur.fetchone()[0]

        # 4. Check core MVP table row counts
        tables_to_check = [
            "inventory_calendar", "holds", "bookings", 
            "booking_items", "payments", "users", "hotels"
        ]
        counts = {}
        for t in tables_to_check:
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            counts[t] = cur.fetchone()[0]

    print(f"  Total Tables Present : {table_count} (Expected: 20)")
    print(f"  Inventory Invariant  : {'PASS (0 violations)' if invariant_violations == 0 else 'FAIL'}")
    print("  Representative Row Counts:")
    for t, cnt in counts.items():
        print(f"    - {t:20s}: {cnt:,} rows")
        
    if table_count < 20 or invariant_violations > 0:
        raise ValueError("Database verification failed!")
        
    return table_count, counts


def main():
    print(f"Connecting to PostgreSQL at {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        sys.exit(1)

    try:
        reset_and_apply_schema(conn)
        load_csv_data(conn)
        verify_database(conn)
        print("\nSUCCESS: PostgreSQL database initialized and verified successfully.")
    except Exception as e:
        conn.rollback()
        print(f"\nFAILURE: Database initialization failed: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
