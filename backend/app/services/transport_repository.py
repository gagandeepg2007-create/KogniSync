import sqlite3
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.journey import PlaceItem


class TransportRepository:
    """
    Data access layer for canonical transport tables in APS-05.db.
    Queries authoritative flights, flight_fares, airports, cities, airlines,
    and inventory_calendar tables without hardcoding or inventing routes.
    """

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            self.db_path = settings.resolve_canonical_db_path()
        else:
            self.db_path = db_path

    def _get_connection(self) -> sqlite3.Connection:
        """
        Creates a read-only SQLite connection.
        """
        conn = sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        return conn

    def get_all_places(self) -> List[PlaceItem]:
        """
        Returns all cities and airports for autocomplete and selector dropdowns.
        """
        results: List[PlaceItem] = []
        seen_ids = set()

        with self._get_connection() as conn:
            cur = conn.cursor()
            # Fetch cities
            cur.execute("""
                SELECT city_id, name, country_code
                FROM cities
                WHERE status = 'active'
                ORDER BY name ASC
            """)
            for row in cur.fetchall():
                cid = row["city_id"]
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    results.append(
                        PlaceItem(
                            id=cid,
                            type="city",
                            name=row["name"],
                            iata=None,
                            city_name=row["name"],
                            country_code=row["country_code"],
                            display_label=f"{row['name']} ({row['country_code']})"
                        )
                    )

            # Fetch airports with city details
            cur.execute("""
                SELECT a.airport_id, a.iata, a.name as airport_name, c.name as city_name, c.country_code
                FROM airports a
                JOIN cities c ON a.city_id = c.city_id
                ORDER BY a.iata ASC
            """)
            for row in cur.fetchall():
                aid = row["airport_id"]
                if aid not in seen_ids:
                    seen_ids.add(aid)
                    results.append(
                        PlaceItem(
                            id=aid,
                            type="airport",
                            name=row["airport_name"],
                            iata=row["iata"],
                            city_name=row["city_name"],
                            country_code=row["country_code"],
                            display_label=f"{row['iata']} — {row['airport_name']}, {row['city_name']}"
                        )
                    )

        return results

    def resolve_airports_for_query(self, query: str) -> List[Dict[str, Any]]:
        """
        Resolves user query (airport IATA, airport ID, airport name, city name, city ID)
        to a list of matching canonical airport dictionaries.
        """
        q = query.strip()
        if not q:
            return []

        with self._get_connection() as conn:
            cur = conn.cursor()
            sql = """
                SELECT
                    a.airport_id, a.iata, a.name as airport_name,
                    c.city_id, c.name as city_name, c.country_code
                FROM airports a
                JOIN cities c ON a.city_id = c.city_id
                WHERE
                    UPPER(a.iata) = UPPER(?)
                    OR a.airport_id = ?
                    OR c.city_id = ?
                    OR UPPER(c.name) = UPPER(?)
                    OR UPPER(a.name) LIKE UPPER(?)
                    OR UPPER(c.name) LIKE UPPER(?)
            """
            param = f"%{q}%"
            cur.execute(sql, (q, q, q, q, param, param))
            rows = cur.fetchall()
            return [dict(r) for r in rows]

    def get_flight_fares(self, flight_id: str, preferred_cabin: str = "any") -> List[Dict[str, Any]]:
        """
        Retrieves active fares for a specific flight, optionally filtered by cabin class.
        Sorted by total price (base_fare + taxes) ascending.
        """
        with self._get_connection() as conn:
            cur = conn.cursor()
            if preferred_cabin in ("economy", "business"):
                sql = """
                    SELECT fare_id, flight_id, cabin_class, fare_class, base_fare, taxes,
                           currency, seats_total, status
                    FROM flight_fares
                    WHERE flight_id = ? AND status = 'active' AND cabin_class = ?
                    ORDER BY (CAST(base_fare AS REAL) + CAST(taxes AS REAL)) ASC
                """
                cur.execute(sql, (flight_id, preferred_cabin))
            else:
                sql = """
                    SELECT fare_id, flight_id, cabin_class, fare_class, base_fare, taxes,
                           currency, seats_total, status
                    FROM flight_fares
                    WHERE flight_id = ? AND status = 'active'
                    ORDER BY (CAST(base_fare AS REAL) + CAST(taxes AS REAL)) ASC
                """
                cur.execute(sql, (flight_id,))

            rows = cur.fetchall()
            return [dict(r) for r in rows]

    def get_inventory_status(self, fare_id: str, for_date: date) -> Optional[Dict[str, Any]]:
        """
        Checks inventory_calendar for available units for this flight fare on travel date.
        """
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT inventory_id, entity_type, entity_id, for_date, total_units,
                       booked_units, held_units, price, currency
                FROM inventory_calendar
                WHERE entity_type = 'flight_fare' AND entity_id = ? AND for_date = ?
            """, (fare_id, for_date.isoformat()))
            row = cur.fetchone()
            if row:
                return dict(row)
            return None

    def search_direct_flights(
        self,
        origin_airport_ids: List[str],
        dest_airport_ids: List[str],
        travel_date: date
    ) -> List[Dict[str, Any]]:
        """
        Finds all scheduled direct flights departing on travel_date between origin and destination airports.
        """
        if not origin_airport_ids or not dest_airport_ids:
            return []

        date_str = travel_date.isoformat()
        orig_ph = ",".join("?" for _ in origin_airport_ids)
        dest_ph = ",".join("?" for _ in dest_airport_ids)

        sql = f"""
            SELECT
                f.flight_id, f.airline_id, al.name as airline_name, al.iata as airline_iata,
                f.flight_number, f.origin_airport_id, a1.iata as origin_airport_iata,
                a1.name as origin_airport_name, c1.name as origin_city_name,
                f.dest_airport_id, a2.iata as dest_airport_iata,
                a2.name as dest_airport_name, c2.name as dest_city_name,
                f.departs_at, f.arrives_at, f.duration_minutes, f.aircraft_type,
                f.carbon_kg, f.status
            FROM flights f
            JOIN airlines al ON f.airline_id = al.airline_id
            JOIN airports a1 ON f.origin_airport_id = a1.airport_id
            JOIN cities c1 ON a1.city_id = c1.city_id
            JOIN airports a2 ON f.dest_airport_id = a2.airport_id
            JOIN cities c2 ON a2.city_id = c2.city_id
            WHERE
                f.origin_airport_id IN ({orig_ph})
                AND f.dest_airport_id IN ({dest_ph})
                AND substr(f.departs_at, 1, 10) = ?
                AND f.status = 'active'
            ORDER BY f.departs_at ASC
        """
        params = list(origin_airport_ids) + list(dest_airport_ids) + [date_str]

        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]

    def search_connecting_1stop_flights(
        self,
        origin_airport_ids: List[str],
        dest_airport_ids: List[str],
        travel_date: date,
        min_transfer_minutes: int = 45,
        max_transfer_minutes: int = 1440
    ) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """
        Finds all valid 1-transfer flight pairs (Leg 1, Leg 2) connecting origin to destination.
        Strictly validates:
        - Leg 1 departs on travel_date from origin
        - Leg 1 destination == Leg 2 origin
        - Leg 2 destination IN dest_airport_ids
        - Leg 2 departs_at > Leg 1 arrives_at
        - Layover duration between min_transfer_minutes (45) and max_transfer_minutes (1440)
        - No cyclic routes (Leg 1 origin != Leg 2 destination, and intermediate airport != origin/dest)
        """
        if not origin_airport_ids or not dest_airport_ids:
            return []

        date_str = travel_date.isoformat()
        orig_ph = ",".join("?" for _ in origin_airport_ids)
        dest_ph = ",".join("?" for _ in dest_airport_ids)

        sql = f"""
            SELECT
                f1.flight_id as leg1_flight_id, f1.airline_id as leg1_airline_id,
                al1.name as leg1_airline_name, al1.iata as leg1_airline_iata,
                f1.flight_number as leg1_flight_number, f1.origin_airport_id as leg1_origin_airport_id,
                a1.iata as leg1_origin_airport_iata, a1.name as leg1_origin_airport_name,
                c1.name as leg1_origin_city_name, f1.dest_airport_id as leg1_dest_airport_id,
                a_mid.iata as leg1_dest_airport_iata, a_mid.name as leg1_dest_airport_name,
                c_mid.name as leg1_dest_city_name, f1.departs_at as leg1_departs_at,
                f1.arrives_at as leg1_arrives_at, f1.duration_minutes as leg1_duration_minutes,
                f1.aircraft_type as leg1_aircraft_type, f1.carbon_kg as leg1_carbon_kg,

                f2.flight_id as leg2_flight_id, f2.airline_id as leg2_airline_id,
                al2.name as leg2_airline_name, al2.iata as leg2_airline_iata,
                f2.flight_number as leg2_flight_number, f2.origin_airport_id as leg2_origin_airport_id,
                a_mid.iata as leg2_origin_airport_iata, a_mid.name as leg2_origin_airport_name,
                c_mid.name as leg2_origin_city_name, f2.dest_airport_id as leg2_dest_airport_id,
                a2.iata as leg2_dest_airport_iata, a2.name as leg2_dest_airport_name,
                c2.name as leg2_dest_city_name, f2.departs_at as leg2_departs_at,
                f2.arrives_at as leg2_arrives_at, f2.duration_minutes as leg2_duration_minutes,
                f2.aircraft_type as leg2_aircraft_type, f2.carbon_kg as leg2_carbon_kg,

                (strftime('%s', f2.departs_at) - strftime('%s', f1.arrives_at)) / 60 as layover_minutes
            FROM flights f1
            JOIN airlines al1 ON f1.airline_id = al1.airline_id
            JOIN airports a1 ON f1.origin_airport_id = a1.airport_id
            JOIN cities c1 ON a1.city_id = c1.city_id

            JOIN flights f2 ON f1.dest_airport_id = f2.origin_airport_id
            JOIN airlines al2 ON f2.airline_id = al2.airline_id
            JOIN airports a_mid ON f1.dest_airport_id = a_mid.airport_id
            JOIN cities c_mid ON a_mid.city_id = c_mid.city_id

            JOIN airports a2 ON f2.dest_airport_id = a2.airport_id
            JOIN cities c2 ON a2.city_id = c2.city_id

            WHERE
                f1.origin_airport_id IN ({orig_ph})
                AND f2.dest_airport_id IN ({dest_ph})
                AND substr(f1.departs_at, 1, 10) = ?
                AND f1.status = 'active'
                AND f2.status = 'active'
                AND f2.departs_at > f1.arrives_at
                AND (strftime('%s', f2.departs_at) - strftime('%s', f1.arrives_at)) / 60 BETWEEN ? AND ?
                AND f1.origin_airport_id != f2.dest_airport_id
                AND a1.city_id != a_mid.city_id
                AND a_mid.city_id != a2.city_id
                AND a1.city_id != a2.city_id
            ORDER BY f1.departs_at ASC
        """
        params = list(origin_airport_ids) + list(dest_airport_ids) + [date_str, min_transfer_minutes, max_transfer_minutes]

        pairs: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
        with self._get_connection() as conn:
            cur = conn.cursor()
            cur.execute(sql, params)
            for r in cur.fetchall():
                row = dict(r)
                leg1 = {
                    "flight_id": row["leg1_flight_id"],
                    "airline_id": row["leg1_airline_id"],
                    "airline_name": row["leg1_airline_name"],
                    "airline_iata": row["leg1_airline_iata"],
                    "flight_number": row["leg1_flight_number"],
                    "origin_airport_id": row["leg1_origin_airport_id"],
                    "origin_airport_iata": row["leg1_origin_airport_iata"],
                    "origin_airport_name": row["leg1_origin_airport_name"],
                    "origin_city_name": row["leg1_origin_city_name"],
                    "dest_airport_id": row["leg1_dest_airport_id"],
                    "dest_airport_iata": row["leg1_dest_airport_iata"],
                    "dest_airport_name": row["leg1_dest_airport_name"],
                    "dest_city_name": row["leg1_dest_city_name"],
                    "departs_at": row["leg1_departs_at"],
                    "arrives_at": row["leg1_arrives_at"],
                    "duration_minutes": row["leg1_duration_minutes"],
                    "aircraft_type": row["leg1_aircraft_type"],
                    "carbon_kg": row["leg1_carbon_kg"],
                }
                leg2 = {
                    "flight_id": row["leg2_flight_id"],
                    "airline_id": row["leg2_airline_id"],
                    "airline_name": row["leg2_airline_name"],
                    "airline_iata": row["leg2_airline_iata"],
                    "flight_number": row["leg2_flight_number"],
                    "origin_airport_id": row["leg2_origin_airport_id"],
                    "origin_airport_iata": row["leg2_origin_airport_iata"],
                    "origin_airport_name": row["leg2_origin_airport_name"],
                    "origin_city_name": row["leg2_origin_city_name"],
                    "dest_airport_id": row["leg2_dest_airport_id"],
                    "dest_airport_iata": row["leg2_dest_airport_iata"],
                    "dest_airport_name": row["leg2_dest_airport_name"],
                    "dest_city_name": row["leg2_dest_city_name"],
                    "departs_at": row["leg2_departs_at"],
                    "arrives_at": row["leg2_arrives_at"],
                    "duration_minutes": row["leg2_duration_minutes"],
                    "aircraft_type": row["leg2_aircraft_type"],
                    "carbon_kg": row["leg2_carbon_kg"],
                }
                pairs.append((leg1, leg2))
        return pairs
