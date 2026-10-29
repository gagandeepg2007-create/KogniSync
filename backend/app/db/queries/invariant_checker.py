from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


INVARIANT_AUDIT_SQL = """
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
"""


async def check_inventory_invariants(
    session: AsyncSession,
    inventory_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the authoritative inventory invariant SQL check against PostgreSQL.
    Verifies that for every item: booked_units + held_units <= total_units.
    """
    sql = INVARIANT_AUDIT_SQL
    params = {}
    if inventory_id:
        sql += " WHERE inventory_id = :inv_id"
        params["inv_id"] = inventory_id
    sql += " ORDER BY is_violation DESC, overallocation DESC, inventory_id ASC;"

    result = await session.execute(text(sql), params)
    rows = result.fetchall()

    violations = []
    total_checked = len(rows)
    total_overallocated_units = 0

    for r in rows:
        row_dict = {
            "inventory_id": r.inventory_id,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "for_date": str(r.for_date),
            "total_units": r.total_units,
            "booked_units": r.booked_units,
            "held_units": r.held_units,
            "consumed_units": r.consumed_units,
            "available_units": r.available_units,
            "overallocation": r.overallocation,
            "is_violation": bool(r.is_violation)
        }
        if r.is_violation:
            violations.append(row_dict)
            total_overallocated_units += r.overallocation

    return {
        "passed": len(violations) == 0,
        "total_items_checked": total_checked,
        "total_violations": len(violations),
        "total_overallocated_units": total_overallocated_units,
        "violations": violations
    }
