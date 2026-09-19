import os
import psycopg2

DB_HOST = os.getenv("POSTGRES_SERVER", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5434"))
DB_USER = os.getenv("POSTGRES_USER", "kognisync")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "kognisync_pass")
DB_NAME = os.getenv("POSTGRES_DB", "kognisync_db")


def test_postgres_tables_and_rows():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME
    )
    with conn.cursor() as cur:
        # Verify 20 canonical tables exist
        cur.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        """)
        table_count = cur.fetchone()[0]
        assert table_count == 20, f"Expected 20 tables, found {table_count}"

        # Verify inventory invariant (booked_units + held_units <= total_units)
        cur.execute("""
            SELECT COUNT(*) 
            FROM inventory_calendar 
            WHERE booked_units + held_units > total_units
        """)
        violations = cur.fetchone()[0]
        assert violations == 0, f"Inventory invariant violated in {violations} rows"

        # Verify inventory_calendar table has expected rows
        cur.execute("SELECT COUNT(*) FROM inventory_calendar")
        inv_count = cur.fetchone()[0]
        assert inv_count > 0, "inventory_calendar is empty"

    conn.close()
