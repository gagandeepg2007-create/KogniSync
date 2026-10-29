from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.db.models.events import IdempotencyRecord
from app.repositories.base import BaseRepository
from app.repositories.exceptions import IdempotencyPayloadConflictError, RepositoryConflictError


class IdempotencyRepository(BaseRepository[IdempotencyRecord]):
    """
    Repository for managing stored idempotency responses and detecting payload mismatches.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(IdempotencyRecord, session)

    async def get_by_key(self, idempotency_key: str) -> Optional[IdempotencyRecord]:
        stmt = select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == idempotency_key)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def record_response(
        self,
        idempotency_key: str,
        scope: str,
        request_hash: str,
        resource_id: Optional[str],
        response_status: int,
        response_body: str
    ) -> IdempotencyRecord:
        record = IdempotencyRecord(
            idempotency_key=idempotency_key,
            scope=scope,
            request_hash=request_hash,
            resource_id=resource_id,
            response_status=response_status,
            response_body=response_body,
            created_at=datetime.now(timezone.utc)
        )
        try:
            async with self.session.begin_nested():
                self.session.add(record)
                await self.session.flush()
            return record
        except IntegrityError as exc:
            existing = await self.get_by_key(idempotency_key)
            if existing:
                if existing.request_hash != request_hash:
                    raise IdempotencyPayloadConflictError(
                        f"Idempotency key '{idempotency_key}' reused with conflicting payload"
                    ) from exc
                return existing
            raise RepositoryConflictError(f"Idempotency conflict: {exc}") from exc
