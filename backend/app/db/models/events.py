from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.models.base import AppBase


class BookingLifecycleEvent(AppBase):
    """
    Append-only audit log for booking, hold, and payment lifecycle events.
    Enables complete traceability and auditability across all state transitions.
    Application-owned table located in 'app' schema, preserving canonical 'public' schema.
    """
    __tablename__ = "booking_lifecycle_events"
    __table_args__ = {"schema": "app"}

    event_id: Mapped[str] = mapped_column(String, primary_key=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    inventory_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    hold_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    booking_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    payment_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    state_from: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    state_to: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    units: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class IdempotencyRecord(AppBase):
    """
    Application-owned idempotency registry to cache operation results and
    detect conflicting request payloads for the same idempotency key.
    Located in 'app' schema, preserving canonical 'public' schema.
    """
    __tablename__ = "idempotency_records"
    __table_args__ = {"schema": "app"}

    idempotency_key: Mapped[str] = mapped_column(String(200), primary_key=True)
    scope: Mapped[str] = mapped_column(String(50), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    response_status: Mapped[int] = mapped_column(Integer, nullable=False)
    response_body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
