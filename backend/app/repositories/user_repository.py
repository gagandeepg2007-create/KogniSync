from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.travel import User, Trip, Itinerary
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Minimal repository for user identity and travel context lookups.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_user_trips(self, user_id: str) -> Sequence[Trip]:
        stmt = select(Trip).where(Trip.owner_user_id == user_id)
        res = await self.session.execute(stmt)
        return res.scalars().all()

    async def get_trip_itineraries(self, trip_id: str) -> Sequence[Itinerary]:
        stmt = select(Itinerary).where(Itinerary.trip_id == trip_id)
        res = await self.session.execute(stmt)
        return res.scalars().all()
