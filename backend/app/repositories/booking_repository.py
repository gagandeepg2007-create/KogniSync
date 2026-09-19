from typing import Optional, Sequence, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from app.db.models.booking import Booking, BookingItem
from app.repositories.base import BaseRepository
from app.repositories.exceptions import RepositoryConflictError


class BookingRepository(BaseRepository[Booking]):
    """
    Repository for bookings and booking_items persistence and idempotency key lookups.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(Booking, session)

    async def get_by_idempotency_key(self, idempotency_key: str) -> Optional[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.booking_items))
            .where(Booking.idempotency_key == idempotency_key)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_by_reference(self, booking_reference: str) -> Optional[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.booking_items))
            .where(Booking.booking_reference == booking_reference)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_booking(self, booking: Booking, items: List[BookingItem]) -> Booking:
        existing = await self.get_by_idempotency_key(booking.idempotency_key)
        if existing:
            return existing

        try:
            async with self.session.begin_nested():
                self.session.add(booking)
                for item in items:
                    item.booking_id = booking.booking_id
                    self.session.add(item)
                await self.session.flush()
            return booking
        except IntegrityError as exc:
            existing = await self.get_by_idempotency_key(booking.idempotency_key)
            if existing:
                return existing
            raise RepositoryConflictError(f"Booking creation conflict: {exc}") from exc

    async def list_by_user_id(self, user_id: str) -> Sequence[Booking]:
        stmt = (
            select(Booking)
            .options(selectinload(Booking.booking_items))
            .where(Booking.user_id == user_id)
        )
        res = await self.session.execute(stmt)
        return res.scalars().all()
