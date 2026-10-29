#!/usr/bin/env python3
"""
scripts/run_concurrency_experiment.py — KogniSync Concurrency Benchmark Runner

Executes the authoritative 500-request concurrency stress test against real PostgreSQL:
- Initial inventory: 3 units.
- Concurrent requests: 500.
- Requested units per request: 1.
- Invariant under test: booked_units + held_units <= total_units.
- Correctness criteria: successful allocations <= 3, overallocations == 0, invariant violations == 0.
"""
import os
import sys
import time
import uuid
import asyncio
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Tuple

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, delete

from app.core.config import settings
from app.db.models.inventory import InventoryCalendar, Hold
from app.db.models.travel import User
from app.services.booking_service import BookingService
from app.db.queries.invariant_checker import check_inventory_invariants
from app.repositories import InsufficientInventoryError


EXPERIMENT_INV_ID = "inv_exp_500_contention"
TOTAL_CAPACITY = 3
TOTAL_REQUESTS = 500
CONCURRENCY_WORKERS = 25


async def setup_experiment_inventory(session: AsyncSession) -> str:
    """Prepares clean, isolated inventory item with exactly 3 units."""
    # Clean any prior run artifacts for this isolated ID
    await session.execute(delete(Hold).where(Hold.inventory_id == EXPERIMENT_INV_ID))
    await session.execute(delete(InventoryCalendar).where(InventoryCalendar.inventory_id == EXPERIMENT_INV_ID))
    await session.commit()

    now = datetime.now(timezone.utc)
    item = InventoryCalendar(
        inventory_id=EXPERIMENT_INV_ID,
        entity_type="room_type",
        entity_id="rmt_exp_500",
        for_date=date(2026, 12, 1),
        total_units=TOTAL_CAPACITY,
        booked_units=0,
        held_units=0,
        price=Decimal("199.99"),
        currency="USD",
        min_stay_nights=1,
        closed_to_arrival=False,
        updated_at=now
    )
    session.add(item)
    await session.commit()
    return EXPERIMENT_INV_ID


async def get_test_user_id(session: AsyncSession) -> str:
    stmt = select(User.user_id).limit(1)
    res = await session.execute(stmt)
    user_id = res.scalar_one_or_none()
    if not user_id:
        raise RuntimeError("No users found in database to execute experiment.")
    return user_id


async def run_experiment():
    print("=" * 65)
    print("KOGNISYNC CONCURRENCY REPLAY — 500 CONCURRENT REQUEST EXPERIMENT")
    print("=" * 65)
    print(f"Target Database      : PostgreSQL (port {settings.POSTGRES_PORT})")
    print(f"Isolated Inventory ID: {EXPERIMENT_INV_ID}")
    print(f"Initial Inventory    : {TOTAL_CAPACITY} units")
    print(f"Concurrent Requests  : {TOTAL_REQUESTS}")
    print(f"Requested per Request: 1 unit")
    print(f"Worker Pool Limit    : {CONCURRENCY_WORKERS} simultaneous DB sessions")
    print("-" * 65)

    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=30,
        max_overflow=20,
        echo=False
    )
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    # 1. Reset and confirm initial inventory
    async with session_factory() as session:
        await setup_experiment_inventory(session)
        user_id = await get_test_user_id(session)
        inv = await session.get(InventoryCalendar, EXPERIMENT_INV_ID)
        assert inv.total_units == TOTAL_CAPACITY
        assert inv.held_units == 0
        assert inv.booked_units == 0

    print("Baseline verified: Inventory initialized to 3 units (0 held, 0 booked).\n")
    print("Launching 500 concurrent hold requests...")

    semaphore = asyncio.Semaphore(CONCURRENCY_WORKERS)
    latencies: List[float] = []

    async def single_request(req_idx: int) -> Tuple[str, str, float]:
        start_time = time.perf_counter()
        idemp_key = f"idemp_exp500_{req_idx}_{uuid.uuid4().hex[:8]}"
        corr_id = f"corr_exp500_{req_idx}"
        async with semaphore:
            async with session_factory() as sess:
                service = BookingService(sess)
                try:
                    hold = await service.create_hold(
                        inventory_id=EXPERIMENT_INV_ID,
                        user_id=user_id,
                        units=1,
                        idempotency_key=idemp_key,
                        correlation_id=corr_id
                    )
                    latency = time.perf_counter() - start_time
                    return ("SUCCESS", hold.hold_id, latency)
                except InsufficientInventoryError:
                    latency = time.perf_counter() - start_time
                    return ("REJECTED", "insufficient_inventory", latency)
                except Exception as exc:
                    latency = time.perf_counter() - start_time
                    return ("ERROR", str(exc), latency)

    overall_start = time.perf_counter()
    tasks = [single_request(i) for i in range(TOTAL_REQUESTS)]
    results = await asyncio.gather(*tasks)
    total_elapsed = time.perf_counter() - overall_start

    # Process and summarize results
    successes = [r for r in results if r[0] == "SUCCESS"]
    rejections = [r for r in results if r[0] == "REJECTED"]
    errors = [r for r in results if r[0] == "ERROR"]
    latencies = sorted([r[2] for r in results])

    p50_latency = latencies[int(len(latencies) * 0.50)] * 1000
    p95_latency = latencies[int(len(latencies) * 0.95)] * 1000
    p99_latency = latencies[int(len(latencies) * 0.99)] * 1000

    # Query final PostgreSQL state
    async with session_factory() as session:
        inv_final = await session.get(InventoryCalendar, EXPERIMENT_INV_ID)
        final_booked = inv_final.booked_units
        final_held = inv_final.held_units
        final_total = inv_final.total_units

        # Count active holds in database
        stmt = select(Hold).where(Hold.inventory_id == EXPERIMENT_INV_ID, Hold.status == "active")
        active_holds_rows = (await session.execute(stmt)).scalars().all()
        hold_ids = [h.hold_id for h in active_holds_rows]
        duplicate_holds = len(hold_ids) - len(set(hold_ids))

        # Authoritative SQL Invariant Check
        audit = await check_inventory_invariants(session, inventory_id=EXPERIMENT_INV_ID)

    overallocations = max(0, (final_booked + final_held) - final_total)
    invariant_violations = audit["total_violations"]

    # Acceptance evaluation
    is_pass = (
        len(successes) == TOTAL_CAPACITY and
        len(rejections) == (TOTAL_REQUESTS - TOTAL_CAPACITY) and
        len(errors) == 0 and
        overallocations == 0 and
        invariant_violations == 0 and
        duplicate_holds == 0 and
        final_held == TOTAL_CAPACITY
    )

    print("\n" + "=" * 65)
    print("KOGNISYNC CONCURRENCY REPLAY")
    print("=" * 65)
    print(f"Database: PostgreSQL")
    print(f"Initial inventory: {TOTAL_CAPACITY}")
    print(f"Concurrent requests: {TOTAL_REQUESTS}")
    print(f"Requested units per request: 1\n")
    print(f"Successful allocations: {len(successes)}")
    print(f"Expected maximum allocations: {TOTAL_CAPACITY}\n")
    print(f"Rejected requests: {len(rejections)}")
    print(f"Unexpected errors: {len(errors)}\n")
    print(f"Final booked units: {final_booked}")
    print(f"Final active held units: {final_held}")
    print(f"Final total capacity: {final_total}\n")
    print(f"Invariant violations: {invariant_violations}")
    print(f"Duplicate logical bookings: {duplicate_holds}\n")
    print(f"Elapsed time: {total_elapsed:.2f}s")
    print(f"p50 latency : {p50_latency:.1f}ms")
    print(f"p95 latency : {p95_latency:.1f}ms")
    print(f"p99 latency : {p99_latency:.1f}ms\n")
    print(f"Overall result: {'PASS' if is_pass else 'FAIL'}")
    print("=" * 65)

    await engine.dispose()
    return is_pass


if __name__ == "__main__":
    passed = asyncio.run(run_experiment())
    sys.exit(0 if passed else 1)
