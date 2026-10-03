"""
LogiPredict AI - Routes & Telematics API Integration Tests
==========================================================
Phase 7 Validation:
1. GET /api/v1/locations & /api/v1/locations/{id}
2. GET /api/v1/routes (with filtering, search, sorting)
3. GET /api/v1/routes/kpis
4. GET /api/v1/routes/{id}
5. POST /api/v1/routes/optimize
6. POST /api/v1/routes/simulate-disruption
7. POST /api/v1/routes/reset
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.route_service import route_service


class TestRouteApi(unittest.TestCase):
    """
    Integration tests for /api/v1/routes and /api/v1/locations endpoints.
    """

    def setUp(self):
        self.client = TestClient(app)
        route_service.reset_to_pristine()

    def test_list_locations_endpoint(self):
        """Test GET /api/v1/locations returns list of military hubs."""
        response = self.client.get("/api/v1/locations")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        locations = json_data["data"]["locations"]
        self.assertGreaterEqual(len(locations), 8)
        self.assertEqual(json_data["data"]["total"], len(locations))

    def test_get_location_by_id_endpoint(self):
        """Test GET /api/v1/locations/{location_id} returns specific depot metadata."""
        response = self.client.get("/api/v1/locations/LOC-LEH-01")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["location_id"], "LOC-LEH-01")
        self.assertEqual(data["name"], "Leh Base Logistics Hub")
        self.assertIn("svg_x", data)
        self.assertIn("svg_y", data)

    def test_get_invalid_location_404(self):
        """Test GET /api/v1/locations/{invalid} returns 404."""
        response = self.client.get("/api/v1/locations/LOC-INVALID-99")
        self.assertEqual(response.status_code, 404)

    def test_list_routes_endpoint_with_query_params(self):
        """Test GET /api/v1/routes supports search, filtering, and sorting."""
        # Unfiltered
        response = self.client.get("/api/v1/routes")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertGreaterEqual(data["total"], 9)
        self.assertIn("kpis", data)

        # Filter by origin
        response = self.client.get("/api/v1/routes?origin=LOC-SRI-03")
        self.assertEqual(response.status_code, 200)
        filtered = response.json()["data"]["routes"]
        self.assertTrue(all(r["origin_location_id"] == "LOC-SRI-03" for r in filtered))

        # Search by pass name
        response = self.client.get("/api/v1/routes?search=Zoji")
        self.assertEqual(response.status_code, 200)
        searched = response.json()["data"]["routes"]
        self.assertGreaterEqual(len(searched), 1)

    def test_get_route_kpis_endpoint(self):
        """Test GET /api/v1/routes/kpis returns network health and status counts."""
        response = self.client.get("/api/v1/routes/kpis")
        self.assertEqual(response.status_code, 200)
        kpis = response.json()["data"]
        self.assertIn("total_routes", kpis)
        self.assertIn("operational_routes", kpis)
        self.assertIn("average_transit_hours", kpis)
        self.assertIn("average_capacity_utilization_pct", kpis)

    def test_get_route_by_id_endpoint(self):
        """Test GET /api/v1/routes/{route_id} returns waypoints and terrain data."""
        response = self.client.get("/api/v1/routes/RTE-SRI-KRG-01")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["route_id"], "RTE-SRI-KRG-01")
        self.assertIn("waypoints", data)
        self.assertGreater(len(data["waypoints"]), 0)

    def test_optimize_convoy_route_endpoint(self):
        """Test POST /api/v1/routes/optimize returns AI path and alternatives."""
        payload = {
            "origin_location_id": "LOC-SRI-03",
            "destination_location_id": "LOC-KRG-04",
            "total_cargo_weight_tonnes": 15.0,
            "avoid_avalanche_zones": True,
        }
        response = self.client.post("/api/v1/routes/optimize", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["primary_route_id"], "RTE-SRI-KRG-01")
        self.assertIn("hours_saved_vs_baseline", data)
        self.assertIn("fuel_estimate_liters", data)
        self.assertIn("waypoints", data)

    def test_optimize_identical_origin_destination_validation(self):
        """Test POST /api/v1/routes/optimize with identical nodes rejects with 422."""
        payload = {
            "origin_location_id": "LOC-LEH-01",
            "destination_location_id": "LOC-LEH-01",
            "total_cargo_weight_tonnes": 10.0,
        }
        response = self.client.post("/api/v1/routes/optimize", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_simulate_disruption_endpoint(self):
        """Test POST /api/v1/routes/simulate-disruption injects scenarios and generates reroutes."""
        payload = {
            "scenario_preset": "khardung_la_landslide",
        }
        response = self.client.post("/api/v1/routes/simulate-disruption", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["scenario_name"], "Khardung La Axis Avalanche / Rockfall Blockage")
        self.assertGreater(data["affected_routes_count"], 0)
        self.assertGreater(len(data["reroute_recommendations"]), 0)

    def test_reset_routes_endpoint(self):
        """Test POST /api/v1/routes/reset restores all corridors to default pristine state."""
        # First inject disruption
        self.client.post(
            "/api/v1/routes/simulate-disruption",
            json={"scenario_preset": "zoji_la_blizzard"},
        )

        # Verify disruption
        kpis_before = self.client.get("/api/v1/routes/kpis").json()["data"]
        self.assertGreater(kpis_before["delayed_routes"], 0)

        # Reset
        response = self.client.post("/api/v1/routes/reset")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertTrue(json_data["data"]["reset"])

        # Verify pristine
        kpis_after = self.client.get("/api/v1/routes/kpis").json()["data"]
        self.assertEqual(kpis_after["delayed_routes"], 0)
        self.assertEqual(kpis_after["disrupted_routes"], 0)
        self.assertEqual(kpis_after["operational_routes"], kpis_after["total_routes"])


if __name__ == "__main__":
    unittest.main()
