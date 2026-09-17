-- APS-05 — Distributed Booking & Inventory System
-- Starter queries. Every one runs as-is against data/APS-05.db.
--
-- CAST(x AS REAL) appears below only for sorting and rough exploration.
-- Never use it for a value you will show someone or add to another value.

-- ==========================================================================
-- 1. The contended inventory — where your load test should aim
-- Some room types are deliberately scarce. Racing 500 requests at 40 free units proves nothing.
-- ==========================================================================
SELECT h.name AS hotel, rt.name AS room_type, ic.for_date, ic.total_units,
          ic.booked_units, ic.held_units,
          (ic.total_units - ic.booked_units - ic.held_units) AS free
     FROM inventory_calendar ic
     JOIN hotel_room_types rt ON rt.room_type_id = ic.entity_id AND ic.entity_type='room_type'
     JOIN hotels h ON h.hotel_id = rt.hotel_id
    WHERE ic.total_units <= 4
      AND (ic.total_units - ic.booked_units - ic.held_units) BETWEEN 1 AND 3
    ORDER BY free LIMIT 20;

-- ==========================================================================
-- 2. The invariant, as a query. It must always return nothing.
-- booked + held <= total. It is a CHECK constraint in the DDL; make it true in your code too.
-- ==========================================================================
SELECT inventory_id, total_units, booked_units, held_units
     FROM inventory_calendar
    WHERE booked_units + held_units > total_units;

-- ==========================================================================
-- 3. Holds and their TTL
-- Active holds consume units. Expired ones must not — and are kept, not deleted (R8).
-- ==========================================================================
SELECT status, COUNT(*) AS holds, SUM(units) AS units,
          MIN(created_at) AS oldest, MIN(expires_at) AS next_expiry
     FROM holds GROUP BY status;

-- ==========================================================================
-- 4. Idempotency keys are unique — a retry resolves to the same booking
-- This query must return nothing. If it returns rows, your retry path double-booked.
-- ==========================================================================
SELECT idempotency_key, COUNT(*) AS bookings
     FROM bookings GROUP BY idempotency_key HAVING COUNT(*) > 1;

-- ==========================================================================
-- 5. A multi-item booking, which is what the saga has to compensate
-- Partial failure means some lines confirmed and some compensated.
-- ==========================================================================
SELECT b.booking_reference, b.status AS booking_status, COUNT(bi.booking_item_id) AS lines,
          GROUP_CONCAT(bi.status) AS line_statuses, b.total_amount, b.currency
     FROM bookings b JOIN booking_items bi ON bi.booking_id = b.booking_id
    GROUP BY b.booking_id HAVING lines > 1 ORDER BY lines DESC LIMIT 15;

-- ==========================================================================
-- 6. Compensation actually happened somewhere in the seed
-- Look at these before you write your own rollback path.
-- ==========================================================================
SELECT bi.booking_item_id, bi.status, bi.compensated_at, bi.line_total, bi.currency
     FROM booking_items bi WHERE bi.status='compensated' LIMIT 10;

-- ==========================================================================
-- 7. Cancellation must restock
-- Cancelled bookings are retained (R8), so you can reconcile against them.
-- ==========================================================================
SELECT b.status, COUNT(*) AS bookings, SUM(bi.units) AS units_involved
     FROM bookings b JOIN booking_items bi ON bi.booking_id = b.booking_id
    WHERE b.status IN ('cancelled','refunded','failed') GROUP BY b.status;
