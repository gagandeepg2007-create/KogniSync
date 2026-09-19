import pytest
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.db.models import (
    Base, Currency, Language, Country, FxRate, City, Airline, Airport,
    Hotel, HotelRoomType, HotelRatePlan, Flight, FlightFare, User, Trip,
    Itinerary, InventoryCalendar, Hold, Booking, BookingItem, Payment
)


EXPECTED_TABLES = {
    "currencies", "languages", "countries", "fx_rates", "cities", "airlines",
    "airports", "hotels", "hotel_room_types", "hotel_rate_plans", "flights",
    "flight_fares", "users", "trips", "itineraries", "inventory_calendar",
    "holds", "bookings", "booking_items", "payments"
}


def test_orm_table_mappings():
    mapped_tables = set(Base.metadata.tables.keys())
    assert mapped_tables == EXPECTED_TABLES, f"Mismatch in mapped tables: {mapped_tables ^ EXPECTED_TABLES}"
    assert len(mapped_tables) == 20


def test_model_primary_keys():
    assert InventoryCalendar.__table__.primary_key.columns.keys() == ["inventory_id"]
    assert Hold.__table__.primary_key.columns.keys() == ["hold_id"]
    assert Booking.__table__.primary_key.columns.keys() == ["booking_id"]
    assert BookingItem.__table__.primary_key.columns.keys() == ["booking_item_id"]
    assert Payment.__table__.primary_key.columns.keys() == ["payment_id"]
    assert User.__table__.primary_key.columns.keys() == ["user_id"]
    assert Hotel.__table__.primary_key.columns.keys() == ["hotel_id"]


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_orm_read_only_queries():
    test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with session_factory() as session:
        # 1. Read Currency
        stmt = select(Currency).limit(1)
        res = await session.execute(stmt)
        curr = res.scalar_one_or_none()
        assert curr is not None
        assert isinstance(curr.currency_id, str)
        assert curr.currency_id.startswith("cur_")

        # 2. Read InventoryCalendar & check Decimal money precision
        stmt = select(InventoryCalendar).limit(1)
        res = await session.execute(stmt)
        inv = res.scalar_one_or_none()
        assert inv is not None
        assert isinstance(inv.inventory_id, str)
        assert inv.inventory_id.startswith("inv_")
        assert isinstance(inv.price, Decimal)

        # 3. Read User
        stmt = select(User).limit(1)
        res = await session.execute(stmt)
        usr = res.scalar_one_or_none()
        assert usr is not None
        assert isinstance(usr.user_id, str)
        assert usr.user_id.startswith("usr_")

        # 4. Read Booking & eager load BookingItems via selectinload
        stmt = select(Booking).options(selectinload(Booking.booking_items)).limit(1)
        res = await session.execute(stmt)
        bkg = res.scalar_one_or_none()
        assert bkg is not None
        assert isinstance(bkg.booking_id, str)
        assert bkg.booking_id.startswith("bkg_")
        assert isinstance(bkg.total_amount, Decimal)
        assert isinstance(bkg.booking_items, list)

    await test_engine.dispose()


@pytest.mark.anyio
async def test_inventory_invariant_via_orm():
    test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with session_factory() as session:
        stmt = select(InventoryCalendar).where(
            (InventoryCalendar.booked_units + InventoryCalendar.held_units) > InventoryCalendar.total_units
        )
        res = await session.execute(stmt)
        violations = res.scalars().all()
        assert len(violations) == 0, f"Found {len(violations)} inventory invariant violations"

    await test_engine.dispose()
