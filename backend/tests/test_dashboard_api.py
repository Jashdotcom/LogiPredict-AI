"""
LogiPredict AI - Command Center Dashboard API Integration Tests
==============================================================
Phase 6.4: Command Center Dashboard API Testing Suite
Indian Army Forward Supply Chain (SIH 2026)
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.alert_service import alert_store_service


class TestDashboardApi(unittest.TestCase):
    """
    Integration tests for /api/v1/dashboard endpoints.
    """

    def setUp(self):
        self.client = TestClient(app)
        alert_store_service.reset_to_pristine()

    def test_get_dashboard_summary(self):
        """Test GET /api/v1/dashboard/summary returns aggregated telemetry."""
        response = self.client.get("/api/v1/dashboard/summary")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        data = json_data["data"]

        # Check all core top-level keys
        self.assertIn("kpis", data)
        self.assertIn("inventoryHealth", data)
        self.assertIn("inventoryDistribution", data)
        self.assertIn("demandForecast", data)
        self.assertIn("priorityAlerts", data)
        self.assertIn("recentActivities", data)
        self.assertIn("quickActions", data)
        self.assertTrue(data.get("isLive"))

        # Verify KPI structures (camelCase + snake_case compatibility)
        kpis = data["kpis"]
        self.assertEqual(len(kpis), 6)
        for kpi in kpis:
            self.assertIn("id", kpi)
            self.assertIn("title", kpi)
            self.assertIn("value", kpi)
            self.assertIn("rawNumber", kpi)
            self.assertIn("raw_number", kpi)
            self.assertIn("isPositive", kpi)
            self.assertIn("is_positive", kpi)
            self.assertIn("statusVariant", kpi)
            self.assertIn("iconName", kpi)
            self.assertIn("colorScheme", kpi)

        # Verify inventory health categories
        health = data["inventoryHealth"]
        self.assertGreater(len(health), 0)
        for h in health:
            self.assertIn("category", h)
            self.assertIn("current", h)
            self.assertIn("safetyStock", h)
            self.assertIn("reorderLevel", h)
            self.assertIn("status", h)

        # Verify inventory distribution buckets
        dist = data["inventoryDistribution"]
        self.assertEqual(len(dist), 4)
        for d in dist:
            self.assertIn("name", d)
            self.assertIn("value", d)
            self.assertIn("count", d)
            self.assertIn("color", d)

        # Verify demand forecast series
        forecast = data["demandForecast"]
        self.assertGreater(len(forecast), 0)
        for point in forecast:
            self.assertIn("date", point)
            self.assertIn("day", point)
            self.assertIn("isFuture", point)
            self.assertIn("is_future", point)
            if point["isFuture"]:
                self.assertIsNotNone(point["forecast"])
                self.assertIsNotNone(point["predicted"])
                self.assertIsNotNone(point["upperBound"])
                self.assertIsNotNone(point["lowerBound"])
            else:
                self.assertIsNotNone(point["actual"])

        # Verify recent activities feed
        activities = data["recentActivities"]
        self.assertGreater(len(activities), 0)
        for act in activities:
            self.assertIn("id", act)
            self.assertIn("activity", act)
            self.assertIn("item", act)
            self.assertIn("resource", act)
            self.assertIn("timestamp", act)
            self.assertIn("status", act)
            self.assertIn("badgeVariant", act)

        # Verify quick actions
        actions = data["quickActions"]
        self.assertEqual(len(actions), 5)
        for act in actions:
            self.assertIn("id", act)
            self.assertIn("label", act)
            self.assertIn("icon", act)
            self.assertIn("path", act)

    def test_get_dashboard_kpis(self):
        """Test GET /api/v1/dashboard/kpis returns top 6 KPI metric cards."""
        response = self.client.get("/api/v1/dashboard/kpis")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 6)
        ids = [k["id"] for k in data]
        self.assertIn("total-inventory-items", ids)
        self.assertIn("inventory-health", ids)
        self.assertIn("below-minimum-stock", ids)
        self.assertIn("predicted-stockouts", ids)
        self.assertIn("pending-replenishments", ids)
        self.assertIn("active-priority-alerts", ids)

    def test_get_inventory_health_endpoint(self):
        """Test GET /api/v1/dashboard/inventory-health returns categories & distribution."""
        response = self.client.get("/api/v1/dashboard/inventory-health")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("categories", data)
        self.assertIn("distribution", data)

    def test_get_demand_forecast_endpoint(self):
        """Test GET /api/v1/dashboard/demand-forecast returns forecast series."""
        response = self.client.get("/api/v1/dashboard/demand-forecast?timeframe=14d")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(len(data), 14)

    def test_get_dashboard_alerts_endpoint(self):
        """Test GET /api/v1/dashboard/alerts returns prioritized alert cards."""
        response = self.client.get("/api/v1/dashboard/alerts")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)


if __name__ == "__main__":
    unittest.main()
