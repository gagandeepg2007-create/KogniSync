from datetime import date
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.inventory import InventoryCalendar
from app.repositories.base import BaseRepository
from app.repositories.exceptions import InventoryNotFoundError, InsufficientInventoryError


class InventoryRepository(BaseRepository[InventoryCalendar]):
    """
    Repository for inventory_calendar operations, row-level locking, and availability checks.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(InventoryCalendar, session)

    async def get_by_natural_key(self, entity_type: str, entity_id: str, for_date: date) -> Optional[InventoryCalendar]:
        stmt = select(InventoryCalendar).where(
            InventoryCalendar.entity_type == entity_type,
            InventoryCalendar.entity_id == entity_id,
            InventoryCalendar.for_date == for_date
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def lock_by_id(self, inventory_id: str) -> InventoryCalendar:
        """
        Locks target inventory_calendar row using SELECT ... FOR UPDATE.
        """
        stmt = select(InventoryCalendar).where(
            InventoryCalendar.inventory_id == inventory_id
        ).with_for_update()
        res = await self.session.execute(stmt)
        item = res.scalar_one_or_none()
        if not item:
            raise InventoryNotFoundError(f"Inventory id '{inventory_id}' not found")
        return item

    async def lock_by_natural_key(self, entity_type: str, entity_id: str, for_date: date) -> InventoryCalendar:
        """
        Locks target inventory_calendar row by natural key using SELECT ... FOR UPDATE.
        """
        stmt = select(InventoryCalendar).where(
            InventoryCalendar.entity_type == entity_type,
            InventoryCalendar.entity_id == entity_id,
            InventoryCalendar.for_date == for_date
        ).with_for_update()
        res = await self.session.execute(stmt)
        item = res.scalar_one_or_none()
        if not item:
            raise InventoryNotFoundError(f"Inventory ({entity_type}, {entity_id}, {for_date}) not found")
        return item

    async def allocate_held_units(self, inventory_id: str, requested_units: int) -> InventoryCalendar:
        """
        Atomically locks row with FOR UPDATE, re-reads availability inside transaction,
        checks invariant (booked_units + held_units <= total_units), and increments held_units.
        Raises InsufficientInventoryError if available units are insufficient.
        """
        item = await self.lock_by_id(inventory_id)
        available = item.total_units - item.booked_units - item.held_units
        if requested_units > available:
            raise InsufficientInventoryError(
                f"Cannot hold {requested_units} units for inventory '{inventory_id}'. "
                f"Available: {available} (Total: {item.total_units}, Booked: {item.booked_units}, Held: {item.held_units})"
            )
        item.held_units += requested_units
        return item

    async def release_held_units(self, inventory_id: str, units_to_release: int) -> InventoryCalendar:
        """
        Locks row with FOR UPDATE and decrements held_units safely.
        """
        item = await self.lock_by_id(inventory_id)
        item.held_units = max(0, item.held_units - units_to_release)
        return item
