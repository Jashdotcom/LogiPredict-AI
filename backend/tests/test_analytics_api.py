"""
LogiPredict AI - Analytics & Reporting API Integration Tests
============================================================
Phase 9.1 & Phase 9.2: Executive Analytics Dashboard & Reporting Module Testing Suite
Indian Army Forward Supply Chain (SIH 2026)
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.services.alert_service import alert_store_service


class TestAnalyticsApi(unittest.TestCase):
    """
    Integration tests for /api/v1/analytics endpoints.
    """

    def setUp(self):
        self.client = TestClient(app)
        alert_store_service.reset_to_pristine()

    def test_get_analytics_overview(self):
        """Test GET /api/v1/analytics/overview returns unified payload."""
        response = self.client.get("/api/v1/analytics/overview?timeframe=7d")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        data = json_data["data"]

        self.assertIn("kpis", data)
        self.assertIn("inventory_trends", data)
        self.assertIn("forecast_accuracy", data)
        self.assertIn("stockout_risks", data)
        self.assertIn("replenishment_summary", data)
        self.assertIn("delivery_performance", data)

        # Verify 6 KPIs
        kpis = data["kpis"]
        self.assertEqual(len(kpis), 6)
        for kpi in kpis:
            self.assertIn("id", kpi)
            self.assertIn("title", kpi)
            self.assertIn("value", kpi)
            self.assertIn("raw_number", kpi)
            self.assertIn("rawNumber", kpi)
            self.assertIn("is_positive", kpi)
            self.assertIn("isPositive", kpi)

    def test_get_analytics_kpis(self):
        """Test GET /api/v1/analytics/kpis returns 6 executive KPI cards."""
        response = self.client.get("/api/v1/analytics/kpis")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(len(json_data["data"]), 6)

    def test_get_inventory_trends(self):
        """Test GET /api/v1/analytics/inventory-trends returns valid series."""
        response = self.client.get("/api/v1/analytics/inventory-trends?timeframe=7d")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        trends = json_data["data"]
        self.assertGreater(len(trends["data"]), 0)
        self.assertIn("summary", trends)
        self.assertIn("turnover_rate", trends["summary"])

    def test_get_forecast_accuracy(self):
        """Test GET /api/v1/analytics/forecast-accuracy returns error metrics."""
        response = self.client.get("/api/v1/analytics/forecast-accuracy?timeframe=7d")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        acc = json_data["data"]
        self.assertIn("mape", acc)
        self.assertIn("mae", acc)
        self.assertIn("rmse", acc)
        self.assertIn("accuracy_percentage", acc)
        self.assertGreater(len(acc["data"]), 0)

    def test_get_stockout_risks(self):
        """Test GET /api/v1/analytics/stockout-risks returns distribution."""
        response = self.client.get("/api/v1/analytics/stockout-risks")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        risks = json_data["data"]
        self.assertIn("healthy_count", risks)
        self.assertIn("low_stock_count", risks)
        self.assertIn("critical_count", risks)
        self.assertIn("by_depot", risks)
        self.assertIn("by_category", risks)

    def test_get_replenishment_summary(self):
        """Test GET /api/v1/analytics/replenishment-summary."""
        response = self.client.get("/api/v1/analytics/replenishment-summary")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        rep = json_data["data"]
        self.assertIn("total_requisitions", rep)
        self.assertIn("status_breakdown", rep)
        self.assertIn("fulfillment_rate_percentage", rep)

    def test_get_delivery_performance(self):
        """Test GET /api/v1/analytics/delivery-performance."""
        response = self.client.get("/api/v1/analytics/delivery-performance")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        perf = json_data["data"]
        self.assertIn("total_deliveries", perf)
        self.assertIn("on_time_delivery_rate_percentage", perf)
        self.assertIn("corridor_metrics", perf)

    def test_get_audit_report(self):
        """Test GET /api/v1/analytics/audit-report."""
        response = self.client.get("/api/v1/analytics/audit-report?scope=Ladakh%20Sector")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        report = json_data["data"]
        self.assertIn("overall_readiness_score", report)
        self.assertIn("stockout_mitigation_rate", report)

    # Phase 9.2 CSV Exports & Demo Reports Tests
    def test_export_inventory_csv(self):
        """Test GET /api/v1/analytics/export/inventory returns valid CSV attachment."""
        response = self.client.get("/api/v1/analytics/export/inventory?category=POL")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.headers.get("content-type", ""))
        self.assertIn("attachment; filename=", response.headers.get("content-disposition", ""))

        # Verify CSV text contents
        content = response.text
        self.assertTrue(content.startswith("﻿") or "SKU ID" in content)
        self.assertIn("SKU ID,Item Name,Category", content)
        self.assertIn("Available Stock", content)
        self.assertIn("Daily Burn Rate", content)
        self.assertIn("Days of Cover", content)
        self.assertIn("Safety Stock (Min)", content)
        self.assertIn("Total Valuation (INR)", content)

    def test_export_forecasts_csv(self):
        """Test GET /api/v1/analytics/export/forecasts returns valid CSV."""
        response = self.client.get("/api/v1/analytics/export/forecasts?timeframe=7d")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.headers.get("content-type", ""))
        content = response.text
        self.assertIn("SKU ID,Item Name,Category", content)
        self.assertIn("Predicted Demand", content)
        self.assertIn("Residual Error", content)
        self.assertIn("Lower Confidence (95%)", content)
        self.assertIn("Upper Confidence (95%)", content)

    def test_export_alerts_csv(self):
        """Test GET /api/v1/analytics/export/alerts returns valid CSV."""
        response = self.client.get("/api/v1/analytics/export/alerts")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.headers.get("content-type", ""))
        content = response.text
        self.assertIn("Alert ID,Anomaly Type,Severity", content)
        self.assertIn("Trigger Condition", content)
        self.assertIn("Recommended Action", content)

    def test_get_demo_report_json(self):
        """Test GET /api/v1/analytics/reports/demo-report returns full DemoReportResponse."""
        response = self.client.get("/api/v1/analytics/reports/demo-report?timeframe=7d")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        rep = json_data["data"]

        self.assertIn("report_id", rep)
        self.assertIn("title", rep)
        self.assertIn("classification", rep)
        self.assertIn("disclaimer", rep)
        self.assertIn("SYNTHETIC DATA DISCLAIMER", rep["disclaimer"])
        self.assertIn("executive_summary", rep)
        self.assertIn("inventory_analysis", rep)
        self.assertIn("forecasting_analysis", rep)
        self.assertIn("predictive_alerts_summary", rep)
        self.assertIn("logistics_performance", rep)
        self.assertIn("strategic_recommendations", rep)
        self.assertIn("certification", rep)

        # Verify recommendations list
        recs = rep["strategic_recommendations"]
        self.assertGreaterEqual(len(recs), 3)
        self.assertTrue(any(r["priority"] == "URGENT" for r in recs))
        self.assertTrue(any(r["requires_human_review"] for r in recs))

    def test_get_demo_report_html(self):
        """Test GET /api/v1/analytics/reports/demo-html returns printable HTML."""
        response = self.client.get("/api/v1/analytics/reports/demo-html?timeframe=7d")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers.get("content-type", ""))
        html = response.text
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("HQ Northern Command Master Readiness & Logistics Report", html)
        self.assertIn("SYNTHETIC DATA DISCLAIMER", html)
        self.assertIn("Executive Summary", html)
        self.assertIn("Strategic Recommendations", html)
        self.assertIn("DIGITALLY SEALED", html)


if __name__ == "__main__":
    unittest.main()
