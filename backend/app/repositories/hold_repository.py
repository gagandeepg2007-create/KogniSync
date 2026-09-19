from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.db.models.inventory import Hold
from app.repositories.base import BaseRepository
from app.repositories.exceptions import RepositoryConflictError


class HoldRepository(BaseRepository[Hold]):
    """
    Repository for holds table persistence and idempotency key lookups.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(Hold, session)

    async def get_by_idempotency_key(self, idempotency_key: str) -> Optional[Hold]:
        stmt = select(Hold).where(Hold.idempotency_key == idempotency_key)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_hold(self, hold: Hold) -> Hold:
        """
        Adds hold to session inside a SAVEPOINT. If unique idempotency collision occurs,
        catches IntegrityError and fetches existing record safely without aborting transaction.
        """
        existing = await self.get_by_idempotency_key(hold.idempotency_key)
        if existing:
            return existing

        try:
            async with self.session.begin_nested():
                self.session.add(hold)
                await self.session.flush()
            return hold
        except IntegrityError as exc:
            existing = await self.get_by_idempotency_key(hold.idempotency_key)
            if existing:
                return existing
            raise RepositoryConflictError(f"Hold creation conflict: {exc}") from exc

    async def update_status(self, hold_id: str, new_status: str) -> Optional[Hold]:
        hold = await self.get_by_id(hold_id)
        if hold:
            hold.status = new_status
        return hold

    async def list_active_by_user(self, user_id: str) -> Sequence[Hold]:
        stmt = select(Hold).where(Hold.user_id == user_id, Hold.status == "active")
        res = await self.session.execute(stmt)
        return res.scalars().all()
