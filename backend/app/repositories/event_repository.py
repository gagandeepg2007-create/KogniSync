from typing import Optional, Sequence
from datetime import datetime, timezone
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.events import BookingLifecycleEvent
from app.repositories.base import BaseRepository


class EventRepository(BaseRepository[BookingLifecycleEvent]):
    """
    Repository for append-only booking lifecycle events and audit trail.
    Enables tracing of state transitions with correlation IDs.
    Never calls session.commit(), session.rollback(), or session.close().
    """

    def __init__(self, session: AsyncSession):
        super().__init__(BookingLifecycleEvent, session)

    async def record_event(
        self,
        event_type: str,
        correlation_id: str,
        inventory_id: Optional[str] = None,
        hold_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        payment_id: Optional[str] = None,
        user_id: Optional[str] = None,
        state_from: Optional[str] = None,
        state_to: Optional[str] = None,
        units: Optional[int] = None,
        metadata: Optional[dict] = None,
        timestamp: Optional[datetime] = None
    ) -> BookingLifecycleEvent:
        event = BookingLifecycleEvent(
            event_id=f"evt_{uuid.uuid4().hex[:16]}",
            event_type=event_type,
            correlation_id=correlation_id,
            inventory_id=inventory_id,
            hold_id=hold_id,
            booking_id=booking_id,
            payment_id=payment_id,
            user_id=user_id,
            state_from=state_from,
            state_to=state_to,
            units=units,
            metadata_json=json.dumps(metadata) if metadata else None,
            created_at=timestamp or datetime.now(timezone.utc)
        )
        self.session.add(event)
        return event

    async def list_by_correlation_id(self, correlation_id: str) -> Sequence[BookingLifecycleEvent]:
        stmt = (
            select(BookingLifecycleEvent)
            .where(BookingLifecycleEvent.correlation_id == correlation_id)
            .order_by(BookingLifecycleEvent.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return res.scalars().all()

    async def list_by_hold_id(self, hold_id: str) -> Sequence[BookingLifecycleEvent]:
        stmt = (
            select(BookingLifecycleEvent)
            .where(BookingLifecycleEvent.hold_id == hold_id)
            .order_by(BookingLifecycleEvent.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return res.scalars().all()

    async def list_by_booking_id(self, booking_id: str) -> Sequence[BookingLifecycleEvent]:
        stmt = (
            select(BookingLifecycleEvent)
            .where(BookingLifecycleEvent.booking_id == booking_id)
            .order_by(BookingLifecycleEvent.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return res.scalars().all()
