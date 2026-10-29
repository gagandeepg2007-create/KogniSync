import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_api_booking_full_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Inspect invariant check endpoint
        inv_check = await client.get("/api/v1/reliability/invariant-check")
        assert inv_check.status_code == 200
        inv_data = inv_check.json()
        assert inv_data["passed"] is True
        assert inv_data["total_violations"] == 0

        # 2. Inspect a real inventory item
        from app.db.database import AsyncSessionLocal
        from app.db.models.inventory import InventoryCalendar
        from app.db.models.travel import User
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            inv_res = await session.execute(select(InventoryCalendar).where(InventoryCalendar.total_units > 2).limit(1))
            inv_row = inv_res.scalar_one()
            target_inv_id = inv_row.inventory_id

            usr_res = await session.execute(select(User.user_id).limit(1))
            target_user_id = usr_res.scalar_one()

        inv_resp = await client.get(f"/api/v1/inventory/{target_inv_id}")
        assert inv_resp.status_code == 200
        inv_info = inv_resp.json()
        assert inv_info["inventory_id"] == target_inv_id
        assert "available_units" in inv_info

        # 3. Create a hold
        hold_idemp = f"api_idemp_{uuid.uuid4().hex[:12]}"
        corr_id = f"api_corr_{uuid.uuid4().hex[:12]}"
        hold_payload = {
            "inventory_id": target_inv_id,
            "user_id": target_user_id,
            "units": 1,
            "idempotency_key": hold_idemp,
            "correlation_id": corr_id,
            "ttl_seconds": 600
        }
        create_resp = await client.post("/api/v1/holds", json=hold_payload)
        assert create_resp.status_code == 201
        hold_body = create_resp.json()
        hold_id = hold_body["hold_id"]
        assert hold_body["status"] == "active"
        assert hold_body["units"] == 1

        # 4. Get hold details
        get_hold_resp = await client.get(f"/api/v1/holds/{hold_id}")
        assert get_hold_resp.status_code == 200
        assert get_hold_resp.json()["hold_id"] == hold_id

        # 5. Confirm booking with payment simulation
        bkg_idemp = f"api_bkg_{uuid.uuid4().hex[:12]}"
        confirm_payload = {
            "hold_id": hold_id,
            "user_id": target_user_id,
            "payment_method": "card",
            "idempotency_key": bkg_idemp,
            "correlation_id": corr_id,
            "simulate_payment_failure": False
        }
        confirm_resp = await client.post("/api/v1/bookings/confirm", json=confirm_payload)
        assert confirm_resp.status_code == 201
        bkg_body = confirm_resp.json()
        booking_id = bkg_body["booking_id"]
        assert bkg_body["status"] == "confirmed"

        # 6. Retrieve booking
        get_bkg_resp = await client.get(f"/api/v1/bookings/{booking_id}")
        assert get_bkg_resp.status_code == 200
        assert get_bkg_resp.json()["booking_id"] == booking_id

        # 7. Cancel booking and verify release
        cancel_resp = await client.post(
            f"/api/v1/bookings/{booking_id}/cancel",
            json={"correlation_id": corr_id, "reason": "user_cancelled"}
        )
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["status"] == "cancelled"

        # 8. Query lifecycle audit events
        events_resp = await client.get(f"/api/v1/events/{corr_id}")
        assert events_resp.status_code == 200
        events_list = events_resp.json()
        assert len(events_list) >= 3
        event_types = [e["event_type"] for e in events_list]
        assert "HOLD_CREATED" in event_types
        assert "BOOKING_CONFIRMED" in event_types
        assert "BOOKING_CANCELLED" in event_types

    from app.db.database import engine
    await engine.dispose()
