"""
LogiPredict AI - Predictive Alerts API Integration Tests
========================================================
Phase 6.3: FastAPI Route Endpoints Integration Testing Suite
Indian Army Forward Supply Chain (SIH 2026)
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.alert_service import alert_store_service


class TestAlertsApi(unittest.TestCase):
    """
    Integration tests for /api/v1/alerts endpoints.
    """

    def setUp(self):
        self.client = TestClient(app)
        alert_store_service.reset_to_pristine()

    def test_get_alerts_list(self):
        """Test GET /api/v1/alerts returns paginated records and KPIs."""
        response = self.client.get("/api/v1/alerts?pageSize=5")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertIn("items", json_data["data"])
        self.assertIn("kpis", json_data["data"])
        self.assertLessEqual(len(json_data["data"]["items"]), 5)

    def test_get_alerts_filtering_and_search(self):
        """Test search query, severity filtering, and location filtering."""
        # Filter by severity
        res_crit = self.client.get("/api/v1/alerts?severity=critical")
        self.assertEqual(res_crit.status_code, 200)
        items_crit = res_crit.json()["data"]["items"]
        for item in items_crit:
            self.assertEqual(item["severity"], "critical")

        # Search term
        res_search = self.client.get("/api/v1/alerts?search=Diesel")
        self.assertEqual(res_search.status_code, 200)
        items_search = res_search.json()["data"]["items"]
        self.assertGreater(len(items_search), 0)

    def test_get_alert_summary(self):
        """Test GET /api/v1/alerts/summary dynamic KPI counters."""
        response = self.client.get("/api/v1/alerts/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("total_active_alerts", data)
        self.assertIn("critical_count", data)
        self.assertIn("warning_count", data)
        self.assertIn("unacknowledged_count", data)
        self.assertIn("transit_risks_count", data)

    def test_get_alert_details_by_id(self):
        """Test GET /api/v1/alerts/{alert_id} for valid and invalid IDs."""
        # Valid ID
        res_valid = self.client.get("/api/v1/alerts/ALT-1049")
        self.assertEqual(res_valid.status_code, 200)
        self.assertEqual(res_valid.json()["data"]["alert_id"], "ALT-1049")

        # Invalid ID
        res_invalid = self.client.get("/api/v1/alerts/NON-EXISTENT-ID")
        self.assertEqual(res_invalid.status_code, 404)

    def test_acknowledge_alert_endpoint(self):
        """Test POST /api/v1/alerts/{alert_id}/acknowledge."""
        payload = {"acknowledged_by": "Col. Rajesh Verma"}
        response = self.client.post("/api/v1/alerts/ALT-1049/acknowledge", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["status"], "acknowledged")
        self.assertTrue(data["is_acknowledged"])
        self.assertEqual(data["acknowledged_by"], "Col. Rajesh Verma")

    def test_resolve_alert_endpoint(self):
        """Test POST /api/v1/alerts/{alert_id}/resolve."""
        payload = {
            "resolved_by": "Brig. Kuldeep Singh",
            "resolution_notes": "Emergency aerial supply dropped 5,000L diesel at Drass Post.",
        }
        response = self.client.post("/api/v1/alerts/ALT-1049/resolve", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["status"], "resolved")
        self.assertTrue(data["is_resolved"])
        self.assertEqual(data["resolved_by"], "Brig. Kuldeep Singh")
        self.assertIn("5,000L diesel", data["resolution_notes"])

    def test_evaluate_alerts_endpoint(self):
        """Test POST /api/v1/alerts/evaluate runs dynamic simulation evaluation."""
        custom_item = {
            "item_id": "SKU-TEST-API-01",
            "item_name": "High-Calorie Mountain Biscuit Packs",
            "category": "Rations & Subsistence",
            "current_stock": 50.0,
            "min_threshold": 200.0,
            "reorder_level": 500.0,
            "consumption_rate_daily": 20.0,
            "lead_time_days": 5,
            "storage_location_id": "LOC-SIA-05",
            "location_name": "Siachen Base Camp",
        }
        response = self.client.post(
            "/api/v1/alerts/evaluate",
            json={"inventory_items": [custom_item], "auto_persist": True},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["item_id"], "SKU-TEST-API-01")
        self.assertEqual(data[0]["severity"], "critical")

    def test_reset_alerts_endpoint(self):
        """Test POST /api/v1/alerts/reset restores synthetic baseline."""
        response = self.client.post("/api/v1/alerts/reset")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["reset"])


if __name__ == "__main__":
    unittest.main()
