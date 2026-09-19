from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.db.models.payment import Payment
from app.repositories.base import BaseRepository
from app.repositories.exceptions import RepositoryConflictError


class PaymentRepository(BaseRepository[Payment]):
    """
    Repository for payments table persistence and idempotency key lookups.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(Payment, session)

    async def get_by_idempotency_key(self, idempotency_key: str) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.idempotency_key == idempotency_key)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_payment(self, payment: Payment) -> Payment:
        existing = await self.get_by_idempotency_key(payment.idempotency_key)
        if existing:
            return existing

        try:
            async with self.session.begin_nested():
                self.session.add(payment)
                await self.session.flush()
            return payment
        except IntegrityError as exc:
            existing = await self.get_by_idempotency_key(payment.idempotency_key)
            if existing:
                return existing
            raise RepositoryConflictError(f"Payment creation conflict: {exc}") from exc

    async def list_by_booking_id(self, booking_id: str) -> Sequence[Payment]:
        stmt = select(Payment).where(Payment.booking_id == booking_id)
        res = await self.session.execute(stmt)
        return res.scalars().all()
