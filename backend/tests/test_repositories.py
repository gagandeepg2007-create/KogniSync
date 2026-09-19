import pytest
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.db.models.inventory import InventoryCalendar, Hold
from app.db.models.booking import Booking, BookingItem
from app.db.models.payment import Payment
from app.db.models.travel import User
from app.repositories import (
    InventoryRepository,
    HoldRepository,
    BookingRepository,
    PaymentRepository,
    UserRepository,
    InventoryNotFoundError,
    InsufficientInventoryError,
    RepositoryConflictError
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def async_session():
    test_engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await test_engine.dispose()


@pytest.mark.anyio
async def test_1_inventory_basic_retrieval(async_session: AsyncSession):
    repo = InventoryRepository(async_session)
    items = await repo.list_all(limit=1)
    assert len(items) == 1
    inv = items[0]
    assert inv.inventory_id.startswith("inv_")


@pytest.mark.anyio
async def test_2_inventory_natural_key_lookup(async_session: AsyncSession):
    repo = InventoryRepository(async_session)
    items = await repo.list_all(limit=1)
    first = items[0]

    found = await repo.get_by_natural_key(first.entity_type, first.entity_id, first.for_date)
    assert found is not None
    assert found.inventory_id == first.inventory_id


@pytest.mark.anyio
async def test_3_inventory_for_update_locking(async_session: AsyncSession):
    repo = InventoryRepository(async_session)
    items = await repo.list_all(limit=1)
    target_id = items[0].inventory_id

    # Test lock inside session transaction
    locked_item = await repo.lock_by_id(target_id)
    assert locked_item is not None
    assert locked_item.inventory_id == target_id


@pytest.mark.anyio
async def test_4_insufficient_inventory_rejection(async_session: AsyncSession):
    repo = InventoryRepository(async_session)
    items = await repo.list_all(limit=1)
    item = items[0]
    available = item.total_units - item.booked_units - item.held_units

    with pytest.raises(InsufficientInventoryError):
        await repo.allocate_held_units(item.inventory_id, available + 1000)


@pytest.mark.anyio
async def test_5_inventory_invariant_preservation(async_session: AsyncSession):
    repo = InventoryRepository(async_session)
    items = await repo.list_all(limit=10)
    for item in items:
        assert (item.booked_units + item.held_units) <= item.total_units


@pytest.mark.anyio
async def test_6_hold_idempotency_lookup(async_session: AsyncSession):
    repo = HoldRepository(async_session)
    holds = await repo.list_all(limit=1)
    assert len(holds) == 1
    first = holds[0]

    found = await repo.get_by_idempotency_key(first.idempotency_key)
    assert found is not None
    assert found.hold_id == first.hold_id


@pytest.mark.anyio
async def test_7_booking_idempotency_lookup(async_session: AsyncSession):
    repo = BookingRepository(async_session)
    bookings = await repo.list_all(limit=1)
    assert len(bookings) == 1
    first = bookings[0]

    found = await repo.get_by_idempotency_key(first.idempotency_key)
    assert found is not None
    assert found.booking_id == first.booking_id
    assert len(found.booking_items) >= 0


@pytest.mark.anyio
async def test_8_payment_idempotency_lookup(async_session: AsyncSession):
    repo = PaymentRepository(async_session)
    payments = await repo.list_all(limit=1)
    assert len(payments) == 1
    first = payments[0]

    found = await repo.get_by_idempotency_key(first.idempotency_key)
    assert found is not None
    assert found.payment_id == first.payment_id


@pytest.mark.anyio
async def test_9_duplicate_idempotency_key_behavior(async_session: AsyncSession):
    repo = HoldRepository(async_session)
    holds = await repo.list_all(limit=1)
    existing_hold = holds[0]

    # Create a new hold object with the same idempotency key
    duplicate_hold = Hold(
        hold_id="hld_test_duplicate_999",
        inventory_id=existing_hold.inventory_id,
        user_id=existing_hold.user_id,
        units=1,
        idempotency_key=existing_hold.idempotency_key,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        status="active",
        updated_at=datetime.now(timezone.utc)
    )

    # Repository should safely handle collision and return existing record
    result = await repo.create_hold(duplicate_hold)
    assert result.hold_id == existing_hold.hold_id


@pytest.mark.anyio
async def test_10_repository_transaction_ownership(async_session: AsyncSession):
    # Verify repository methods do NOT auto-commit
    user_repo = UserRepository(async_session)
    users = await user_repo.list_all(limit=1)
    assert len(users) == 1

    # Verify session dirty/in-transaction state is maintained without repository auto-commit
    hold_repo = HoldRepository(async_session)
    test_hold = Hold(
        hold_id="hld_test_no_commit_888",
        inventory_id=users[0].user_id, # test reference
        user_id=users[0].user_id,
        units=1,
        idempotency_key="idemp_no_commit_888",
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        status="active",
        updated_at=datetime.now(timezone.utc)
    )
    # Add to session via repository without committing
    hold_repo.add(test_hold)
    assert test_hold in async_session.new

    # Roll back session explicitly at test layer
    await async_session.rollback()
    assert test_hold not in async_session


@pytest.mark.anyio
async def test_11_normal_persistence_inside_transaction(async_session: AsyncSession):
    user_repo = UserRepository(async_session)
    inv_repo = InventoryRepository(async_session)
    hold_repo = HoldRepository(async_session)

    users = await user_repo.list_all(limit=1)
    inv_items = await inv_repo.list_all(limit=1)
    user = users[0]
    inv = inv_items[0]

    now = datetime.now(timezone.utc)
    new_hold_id = f"hld_test_persist_{int(now.timestamp())}"
    new_hold = Hold(
        hold_id=new_hold_id,
        inventory_id=inv.inventory_id,
        user_id=user.user_id,
        units=1,
        idempotency_key=f"idemp_persist_{int(now.timestamp())}",
        created_at=now,
        expires_at=now + timedelta(minutes=15),
        status="active",
        updated_at=now
    )

    created = await hold_repo.create_hold(new_hold)
    assert created.hold_id == new_hold_id

    # Clean up test object via rollback so test database remains unchanged
    await async_session.rollback()


@pytest.mark.anyio
async def test_12_rollback_behavior_on_failure(async_session: AsyncSession):
    inv_repo = InventoryRepository(async_session)
    items = await inv_repo.list_all(limit=1)
    item = items[0]
    target_id = item.inventory_id
    original_held = item.held_units

    # Modify unit in session memory
    item.held_units += 1

    # Simulate transaction abort / rollback
    await async_session.rollback()

    # Re-fetch item to verify database state was untouched
    refetched = await inv_repo.get_by_id(target_id)
    assert refetched.held_units == original_held
