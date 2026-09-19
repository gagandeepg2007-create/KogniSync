from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[str] = mapped_column(String, primary_key=True)
    booking_id: Mapped[str] = mapped_column(String, ForeignKey("bookings.booking_id"), nullable=False)
    method: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    authorised_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    captured_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    refunded_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    gateway_reference: Mapped[str] = mapped_column(String, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    failure_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    authorised_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="payments")
    currency_rel: Mapped["Currency"] = relationship("Currency")
