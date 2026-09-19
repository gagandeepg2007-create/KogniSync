from typing import TypeVar, Generic, Type, Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """
    Base async repository providing fundamental read operations.
    Does NOT manage transaction lifecycle (no commit/rollback/close).
    """

    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id_val: str) -> Optional[T]:
        return await self.session.get(self.model, id_val)

    async def list_all(self, limit: int = 100, offset: int = 0) -> Sequence[T]:
        stmt = select(self.model).limit(limit).offset(offset)
        res = await self.session.execute(stmt)
        return res.scalars().all()

    def add(self, instance: T) -> T:
        self.session.add(instance)
        return instance
