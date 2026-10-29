import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_places_endpoint():
    response = client.get("/api/v1/journeys/places")
    assert response.status_code == 200
    places = response.json()
    assert len(places) > 50
    # Spot check sample place fields
    sample = places[0]
    assert "name" in sample
    assert "type" in sample
    assert "display_label" in sample


def test_api_presets_endpoint():
    response = client.get("/api/v1/journeys/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 4
    preset_ids = [p["id"] for p in presets]
    assert "preset_direct" in preset_ids
    assert "preset_connecting" in preset_ids
    assert "preset_budget_constraint" in preset_ids
    assert "preset_deadline_constraint" in preset_ids


def test_api_search_endpoint_success():
    payload = {
        "origin": "Kochi",
        "destination": "Mumbai",
        "travel_date": "2026-09-03",
        "preference": "lowest_cost",
        "transfer_limit": 2
    }
    response = client.post("/api/v1/journeys/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["origin_queried"] == "Kochi"
    assert data["destination_queried"] == "Mumbai"
    assert data["feasible_count"] >= 1
    assert len(data["journeys"]) >= 1
    first = data["journeys"][0]
    assert first["rank"] == 1
    assert "explanation" in first


def test_api_search_validation_error():
    # Same origin and destination must return 422
    payload = {
        "origin": "Mumbai",
        "destination": "Mumbai",
        "travel_date": "2026-09-03"
    }
    response = client.post("/api/v1/journeys/search", json=payload)
    assert response.status_code == 422


def test_api_book_endpoint_success():
    payload = {
        "journey_id": "jny_api_test_001",
        "user_id": "usr_00000001",
        "idempotency_key": "api_test_key_success_999",
        "total_amount": "6316.04",
        "currency": "INR",
        "items": [
            {
                "leg_index": 0,
                "flight_id": "flt_test_api",
                "flight_number": "QF-9281",
                "fare_id": "far_test_api",
                "inventory_id": None,
                "for_date": "2026-09-03",
                "units": 1,
                "unit_price": "5500.00",
                "taxes": "816.04",
                "currency": "INR"
            }
        ]
    }
    response = client.post("/api/v1/journeys/book", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CONFIRMED"
    assert data["booking_reference"].startswith("KS-BKG-")
    assert len(data["legs"]) == 1
    assert data["legs"][0]["status"] == "CONFIRMED"
