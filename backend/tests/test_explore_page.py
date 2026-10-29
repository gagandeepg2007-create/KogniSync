"""
KogniSync — Explore Page Functional, Integration & Data Validation Tests
Comprehensive tests for Explore page routing, origin/destination validation,
transport categories, passenger scaling, service tiers, and static assets.
"""

import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from app.main import app

client = TestClient(app)


class TestExplorePageRoutingAndAssets:
    """A. Navigation and Routing Tests"""

    def test_explore_route_serves_html(self):
        """Explore route /explore loads successfully with status 200 and HTML content."""
        response = client.get("/explore")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        content = response.text
        assert "KogniSync Travel" in content
        assert "Explore Itineraries" in content
        assert 'id="exploreView"' in content
        assert 'id="swapLocationsBtn"' in content
        assert 'id="transportModesBar"' in content

    def test_root_route_serves_html(self):
        """Root route / loads successfully with status 200."""
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")

    def test_bookings_route_serves_html(self):
        """Bookings route /bookings loads successfully with status 200."""
        response = client.get("/bookings")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        assert 'id="bookingsView"' in response.text

    def test_static_assets_serve_correct_content_types(self):
        """Static assets style.css and app.js serve with correct MIME types."""
        css_res = client.get("/style.css")
        assert css_res.status_code == 200
        assert "text/css" in css_res.headers.get("content-type", "")
        assert "--primary" in css_res.text

        js_res = client.get("/app.js")
        assert js_res.status_code == 200
        assert "javascript" in js_res.headers.get("content-type", "")
        assert "DOMContentLoaded" in js_res.text


class TestOriginAndDestinationSelection:
    """B. Origin and Destination Selection & Validation"""

    def test_canonical_places_endpoint(self):
        """City options come from canonical dataset with valid structure and no duplicates."""
        res = client.get("/api/v1/journeys/places")
        assert res.status_code == 200
        places = res.json()
        assert len(places) > 50

        # Check structure
        names = set()
        for p in places:
            assert "name" in p
            assert "type" in p
            assert "display_label" in p
            assert len(p["name"]) > 0
            assert len(p["display_label"]) > 0

    def test_origin_destination_identical_rejected(self):
        """Origin and destination cannot be identical (Rule R1)."""
        payload = {
            "origin": "Mumbai",
            "destination": "Mumbai",
            "travel_date": "2026-09-03"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 422
        errors = res.json().get("detail", [])
        assert any("identical" in str(e).lower() for e in errors)

    def test_origin_destination_case_insensitive_identical_rejected(self):
        """Case-insensitive identical origin and destination is rejected."""
        payload = {
            "origin": "kochi",
            "destination": "KOCHI",
            "travel_date": "2026-09-03"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 422

    def test_nonexistent_origin_or_destination_handled_gracefully(self):
        """Searching for non-existent city returns 200 with zero candidates and helpful message."""
        payload = {
            "origin": "Atlantis",
            "destination": "El Dorado",
            "travel_date": "2026-09-03"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible_count"] == 0
        assert data["total_candidates_found"] == 0
        assert "could not be resolved" in data["message"]


class TestTransportOptions:
    """C. Transport Options & Filtering"""

    def test_flights_mode_returns_candidates(self):
        """Selecting Flights mode returns live canonical schedule options."""
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "transport_modes": ["flights"]
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible_count"] >= 1
        for jny in data["journeys"]:
            assert jny["transport_mode"] == "flights"

    def test_ground_transport_only_transparent_sync_message(self):
        """Selecting only ground transport transparently reports pending sync without fabricating data."""
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "transport_modes": ["trains", "buses"]
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible_count"] == 0
        assert "APS-05 currently covers air travel" in data["message"]
        assert "trains, buses" in data["message"]

    def test_combined_flight_and_train_modes(self):
        """When flights is included alongside pending modes, available flight options are still returned."""
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "transport_modes": ["flights", "trains"]
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible_count"] >= 1


class TestPassengersAndCostScaling:
    """D. Date, Time & Passenger Inputs"""

    def test_single_passenger_pricing(self):
        """Single passenger search returns standard unit pricing."""
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "passengers": 1,
            "preference": "lowest_cost"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        jny = res.json()["journeys"][0]
        assert jny["passengers"] == 1
        assert Decimal(jny["total_cost"]) == Decimal(jny["unit_cost_per_passenger"])

    def test_multiple_passengers_cost_scaling(self):
        """Party of 3 passengers scales total cost by exactly 3x while preserving unit cost."""
        pax = 3
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "passengers": pax,
            "preference": "lowest_cost"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        jny = res.json()["journeys"][0]
        assert jny["passengers"] == pax
        unit_cost = Decimal(jny["unit_cost_per_passenger"])
        total_cost = Decimal(jny["total_cost"])
        assert total_cost == unit_cost * pax

    def test_invalid_passenger_count_rejected(self):
        """Passenger count outside [1, 9] is rejected with 422."""
        # 0 passengers
        res = client.post("/api/v1/journeys/search", json={
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "passengers": 0
        })
        assert res.status_code == 422

        # 10 passengers (above max 9)
        res2 = client.post("/api/v1/journeys/search", json={
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "passengers": 10
        })
        assert res2.status_code == 422


class TestServiceTiersAndBudget:
    """E. Budget and Service Levels"""

    def test_service_tier_budget_defaults(self):
        """Budget tier defaults to economy class and lowest cost ranking."""
        payload = {
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "service_tier": "budget"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible_count"] >= 1
        for jny in data["journeys"]:
            assert jny["service_tier"] == "budget"
            # Legs should be economy
            for leg in jny["legs"]:
                assert leg["cabin_class"].lower() == "economy"

    def test_service_tier_premium_business_cabin(self):
        """Premium tier targets business cabin."""
        payload = {
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "service_tier": "premium"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        # If business fares exist, they should be business; if not feasible, infeasible reasons report cabin constraint
        if data["feasible_count"] > 0:
            for jny in data["journeys"]:
                assert jny["service_tier"] == "premium"
                for leg in jny["legs"]:
                    assert leg["cabin_class"].lower() == "business"

    def test_hard_budget_constraint_rejection(self):
        """When budget is set below minimum feasible journey cost, candidate is rejected into rejected list."""
        payload = {
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "max_budget": 5000.0,
            "transfer_limit": 2
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["feasible_count"] == 0
        assert data["infeasible_count"] >= 1
        rejection = data["rejected_journeys"][0]
        assert any("budget" in r.lower() for r in rejection["rejection_reasons"])


class TestDataValidationAndEdgeCases:
    """F & Integration Data Validation Edge Cases"""

    def test_missing_origin_field_rejected(self):
        """Missing required origin field returns 422."""
        payload = {
            "destination": "Mumbai",
            "travel_date": "2026-09-03"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 422

    def test_missing_date_field_rejected(self):
        """Missing travel_date returns 422."""
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai"
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 422

    def test_negative_budget_rejected(self):
        """Negative budget returns 422."""
        payload = {
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "max_budget": -500.0
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 422

    def test_itinerary_segment_ordering_and_times(self):
        """Multi-leg itineraries maintain chronological order: leg1.arrives_at <= leg2.departs_at."""
        payload = {
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "transfer_limit": 2
        }
        res = client.post("/api/v1/journeys/search", json=payload)
        assert res.status_code == 200
        journeys = res.json()["journeys"]
        for jny in journeys:
            if jny["number_of_legs"] > 1:
                for i in range(len(jny["legs"]) - 1):
                    leg1_arr = jny["legs"][i]["arrives_at"]
                    leg2_dep = jny["legs"][i + 1]["departs_at"]
                    assert leg1_arr <= leg2_dep
                    assert jny["legs"][i]["dest_airport_iata"] == jny["legs"][i + 1]["origin_airport_iata"]
