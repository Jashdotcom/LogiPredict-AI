"""
LogiPredict AI - Simulation API Router Integration Tests
========================================================
Validation Suite for Phase 8 Endpoints:
1. GET /api/v1/simulation/baseline
2. GET /api/v1/simulation/scenarios
3. GET /api/v1/simulation/scenarios/{id} & Error Handling
4. POST /api/v1/simulation/run (Custom & Preset Execution)
5. GET /api/v1/simulation/{simulation_id} History Retrieval
"""

import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestSimulationApi(unittest.TestCase):
    """
    FastAPI client integration tests for /api/v1/simulation endpoints.
    """

    def setUp(self):
        self.client = TestClient(app)

    def test_get_baseline_endpoint(self):
        """Test GET /api/v1/simulation/baseline returns baseline metadata and default parameters."""
        response = self.client.get("/api/v1/simulation/baseline")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        data = json_data["data"]
        self.assertIn("baseline_metrics", data)
        self.assertIn("sku_catalog_summary", data)
        self.assertIn("locations_summary", data)
        self.assertIn("routes_summary", data)
        self.assertIn("preset_scenarios", data)
        self.assertIn("default_parameters", data)
        self.assertGreater(data["baseline_metrics"]["total_skus"], 0)

    def test_list_scenarios_endpoint(self):
        """Test GET /api/v1/simulation/scenarios returns list of military disruption presets."""
        response = self.client.get("/api/v1/simulation/scenarios")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        scenarios = json_data["data"]
        self.assertGreaterEqual(len(scenarios), 5)
        ids = [s["id"] for s in scenarios]
        self.assertIn("SCN-WINTER-01", ids)
        self.assertIn("SCN-SURGE-02", ids)

    def test_get_scenario_by_id_endpoint(self):
        """Test GET /api/v1/simulation/scenarios/{scenario_id} returns specific preset detail."""
        response = self.client.get("/api/v1/simulation/scenarios/SCN-WINTER-01")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["id"], "SCN-WINTER-01")
        self.assertEqual(data["category"], "Weather Disruption")

    def test_get_invalid_scenario_by_id_returns_404(self):
        """Test GET /api/v1/simulation/scenarios/{invalid} returns 404 error."""
        response = self.client.get("/api/v1/simulation/scenarios/SCN-NON-EXISTENT")
        self.assertEqual(response.status_code, 404)

    def test_run_simulation_custom_parameters(self):
        """Test POST /api/v1/simulation/run with custom parameters returns full results & envelopes."""
        payload = {
            "simulation_name": "Forward Artillery Readiness Simulation",
            "duration_days": 14,
            "demand_surge_percentage": 40.0,
            "lead_time_dilation_days": 5,
            "inventory_change_percentage": -10.0,
            "selected_category": "Ammunition",
        }
        response = self.client.post("/api/v1/simulation/run", json=payload)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        data = json_data["data"]
        self.assertIn("simulation_id", data)
        self.assertEqual(data["summary_metrics"]["total_simulated_days"], 14)
        self.assertIn("comparison", data)
        self.assertIn("daily_trajectories", data)
        self.assertIn("impact_summary", data)
        self.assertIn("recommendations", data)
        self.assertEqual(len(data["daily_trajectories"]), 14)

    def test_run_simulation_with_preset_and_fetch_history(self):
        """Test POST /api/v1/simulation/run with preset, then GET /api/v1/simulation/{id} retrieves it."""
        payload = {
            "scenario_preset": "SCN-LANDSLIDE-03",
            "duration_days": 21,
        }
        response = self.client.post("/api/v1/simulation/run", json=payload)
        self.assertEqual(response.status_code, 200)
        sim_data = response.json()["data"]
        sim_id = sim_data["simulation_id"]
        self.assertIsNotNone(sim_id)

        # Retrieve by simulation_id
        hist_response = self.client.get(f"/api/v1/simulation/{sim_id}")
        self.assertEqual(hist_response.status_code, 200)
        hist_data = hist_response.json()["data"]
        self.assertEqual(hist_data["simulation_id"], sim_id)
        self.assertEqual(hist_data["summary_metrics"]["total_simulated_days"], 21)


if __name__ == "__main__":
    unittest.main()
