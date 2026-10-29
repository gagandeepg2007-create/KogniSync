from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_parse_travel_intent():
    payload = {
        "text": "I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed.",
        "current_context": {
            "origin": "Bangalore",
            "destination": "Chennai",
            "date": "2026-10-30",
            "passengers": 1,
            "budget": 3000,
        },
    }
    response = client.post("/api/ai/parse-travel-intent", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "intent" in data
    intent = data["intent"]
    assert intent["origin"] == "Bangalore"
    assert intent["destination"] == "Chennai"
    assert intent["arrival_deadline"] == "14:00"
    assert intent["budget"] == 3000.0


def test_api_parse_travel_intent_empty():
    response = client.post("/api/ai/parse-travel-intent", json={"text": ""})
    assert response.status_code == 400
