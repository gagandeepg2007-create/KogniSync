-- KogniSync Authoritative Inventory Invariant Check
-- Verifies the fundamental invariant: booked_units + held_units <= total_units
-- Computes calculated units from active holds (excluding expired and released holds)
-- and confirmed booking items (excluding cancelled and compensated items).

WITH active_holds_summary AS (
    SELECT 
        inventory_id,
        COALESCE(SUM(units), 0) AS active_held_units_from_holds
    FROM holds
    WHERE status = 'active'
      AND expires_at > NOW()
    GROUP BY inventory_id
),
confirmed_booking_items_summary AS (
    SELECT 
        inventory_id,
        COALESCE(SUM(units), 0) AS confirmed_booked_units_from_items
    FROM booking_items
    WHERE status = 'confirmed'
      AND inventory_id IS NOT NULL
    GROUP BY inventory_id
),
inventory_audit AS (
    SELECT 
        ic.inventory_id,
        ic.entity_type,
        ic.entity_id,
        ic.for_date,
        ic.total_units,
        ic.booked_units,
        ic.held_units,
        COALESCE(ahs.active_held_units_from_holds, 0) AS active_held_from_holds,
        COALESCE(cbis.confirmed_booked_units_from_items, 0) AS confirmed_from_items,
        (ic.booked_units + ic.held_units) AS consumed_units,
        (ic.total_units - ic.booked_units - ic.held_units) AS available_units,
        GREATEST(0, (ic.booked_units + ic.held_units) - ic.total_units) AS overallocation,
        CASE 
            WHEN (ic.booked_units + ic.held_units) > ic.total_units THEN 1 
            ELSE 0 
        END AS is_violation
    FROM inventory_calendar ic
    LEFT JOIN active_holds_summary ahs ON ic.inventory_id = ahs.inventory_id
    LEFT JOIN confirmed_booking_items_summary cbis ON ic.inventory_id = cbis.inventory_id
)
SELECT 
    inventory_id,
    entity_type,
    entity_id,
    for_date,
    total_units,
    booked_units,
    held_units,
    consumed_units,
    available_units,
    overallocation,
    is_violation
FROM inventory_audit
ORDER BY is_violation DESC, overallocation DESC, inventory_id ASC;
