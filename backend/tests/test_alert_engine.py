"""
LogiPredict AI - Predictive Alert Engine Test Suite
===================================================
Phase 6.3: Predictive Alert Generation, Priority Classification,
Deterministic Deduplication, Lifecycle State Transitions, and KPI Synchronizer Tests.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime, timezone
import unittest

from app.schemas.alert import AlertSeverity, AlertType
from app.services.alert_service import (
    AlertEngine,
    AlertStoreService,
    alert_engine,
    alert_store_service,
)
from app.utils.exceptions import ValidationError, NotFoundError


class TestAlertEngineRules(unittest.TestCase):
    """
    Unit tests validating mathematical anomaly trigger conditions and severity tiers.
    """

    def setUp(self):
        self.engine = AlertEngine()

    def test_critical_safety_stock_breach(self):
        """Test stock below min_threshold triggers CRITICAL LOW_STOCK alert."""
        item = {
            "item_id": "SKU-POL-KRS-02",
            "item_name": "High-Altitude Kerosene SKO",
            "category": "POL",
            "current_stock": 18000.0,
            "min_threshold": 25000.0,
            "reorder_level": 32000.0,
            "consumption_rate_daily": 1800.0,
            "lead_time_days": 5,
            "storage_location_id": "LOC-DRS-04",
            "location_name": "Drass FOB",
        }
        alerts = self.engine.evaluate_inventory_item(item)
        self.assertTrue(any(a.severity == AlertSeverity.CRITICAL and a.alert_type == AlertType.LOW_STOCK for a in alerts))
        crit_alert = next(a for a in alerts if a.severity == AlertSeverity.CRITICAL and a.alert_type == AlertType.LOW_STOCK)
        self.assertIn("Safety Buffer", crit_alert.title)
        self.assertIn("18,000.0", crit_alert.trigger_condition)

    def test_warning_reorder_level_breach(self):
        """Test stock between min_threshold and reorder_level triggers WARNING REPLENISHMENT_REQUIRED."""
        item = {
            "item_id": "SKU-ORD-81M-04",
            "item_name": "81mm Mortar Shells",
            "category": "Ordnance & Ammunition",
            "current_stock": 200.0,
            "min_threshold": 150.0,
            "reorder_level": 250.0,
            "consumption_rate_daily": 8.0,
            "lead_time_days": 6,
            "storage_location_id": "LOC-DRS-04",
        }
        alerts = self.engine.evaluate_inventory_item(item)
        self.assertTrue(any(a.severity == AlertSeverity.WARNING and a.alert_type == AlertType.REPLENISHMENT_REQUIRED for a in alerts))

    def test_predicted_stockout_depletion(self):
        """Test stock runway shorter than lead time triggers CRITICAL PREDICTED_STOCKOUT."""
        item = {
            "item_id": "SKU-ENG-BAT-09",
            "item_name": "LiFePO4 Extreme-Cold Battery",
            "category": "Spares & Engineering",
            "current_stock": 35.0,  # Above min_threshold (30.0)
            "min_threshold": 30.0,
            "reorder_level": 50.0,
            "consumption_rate_daily": 10.0,  # 3.5 days runway
            "lead_time_days": 6,  # lead time is 6 days > 3.5 days
            "storage_location_id": "LOC-KRG-02",
        }
        alerts = self.engine.evaluate_inventory_item(item)
        self.assertTrue(any(a.alert_type == AlertType.PREDICTED_STOCKOUT for a in alerts))
        stockout_alert = next(a for a in alerts if a.alert_type == AlertType.PREDICTED_STOCKOUT)
        self.assertEqual(stockout_alert.severity, AlertSeverity.CRITICAL)

    def test_demand_velocity_surge(self):
        """Test consumption >= 1.5x baseline triggers DEMAND_SURGE alert."""
        item = {
            "item_id": "SKU-ORD-556-03",
            "item_name": "5.56mm INSAS Ammunition",
            "category": "Ordnance & Ammunition",
            "current_stock": 800.0,
            "min_threshold": 200.0,
            "reorder_level": 350.0,
            "consumption_rate_daily": 12.0,
            "current_consumption_rate": 24.0,  # 2.0x baseline
            "baseline_consumption_rate": 12.0,
            "lead_time_days": 3,
            "storage_location_id": "LOC-KRG-02",
        }
        alerts = self.engine.evaluate_inventory_item(item)
        self.assertTrue(any(a.alert_type == AlertType.DEMAND_SURGE for a in alerts))
        surge_alert = next(a for a in alerts if a.alert_type == AlertType.DEMAND_SURGE)
        self.assertEqual(surge_alert.severity, AlertSeverity.WARNING)
        self.assertIn("2.0x", surge_alert.title)

    def test_cold_chain_thermal_excursion(self):
        """Test medical cold-chain temperature outside +2°C to +8°C envelope."""
        # Warning excursion (e.g. 9.5°C)
        item_warn = {
            "item_id": "SKU-MED-PLM-07",
            "item_name": "Freeze-Dried Plasma",
            "category": "Medical & Cold-Chain",
            "current_stock": 250.0,
            "min_threshold": 100.0,
            "reorder_level": 150.0,
            "consumption_rate_daily": 6.0,
            "lead_time_days": 2,
            "is_temperature_sensitive": True,
            "target_temp_min": 2.0,
            "target_temp_max": 8.0,
            "current_temperature": 9.2,
            "storage_location_id": "LOC-LEH-03",
        }
        alerts_warn = self.engine.evaluate_inventory_item(item_warn)
        self.assertTrue(any(a.alert_type == AlertType.COLD_CHAIN_EXCURSION and a.severity == AlertSeverity.WARNING for a in alerts_warn))

        # Critical severe excursion (e.g. 14.5°C)
        item_crit = {**item_warn, "current_temperature": 14.5}
        alerts_crit = self.engine.evaluate_inventory_item(item_crit)
        self.assertTrue(any(a.alert_type == AlertType.COLD_CHAIN_EXCURSION and a.severity == AlertSeverity.CRITICAL for a in alerts_crit))

    def test_forecast_residual_statistical_anomaly(self):
        """Test neural forecast residual deviation >= 3.0 sigma triggers FORECAST_ANOMALY."""
        item = {
            "item_id": "SKU-RAT-MRE-05",
            "item_name": "Combat Rations MRE",
            "category": "Rations & Subsistence",
            "current_stock": 15000.0,
            "min_threshold": 5000.0,
            "reorder_level": 7500.0,
            "consumption_rate_daily": 450.0,
            "lead_time_days": 7,
            "forecast_residual_sigma": 3.4,
            "storage_location_id": "LOC-SIA-05",
        }
        alerts = self.engine.evaluate_inventory_item(item)
        self.assertTrue(any(a.alert_type == AlertType.FORECAST_ANOMALY for a in alerts))
        anom_alert = next(a for a in alerts if a.alert_type == AlertType.FORECAST_ANOMALY)
        self.assertEqual(anom_alert.severity, AlertSeverity.WARNING)
        self.assertIn("3.4σ", anom_alert.title)

    def test_route_disruptions_and_delays(self):
        """Test route blockages, high avalanche risk, and transit delays."""
        # Critical Blocked Route
        blocked_route = {
            "route_id": "RTE-LEH-SIA-04",
            "route_name": "Khardung La Axis",
            "origin_location_id": "LOC-LEH-03",
            "destination_location_id": "LOC-SIA-05",
            "risk_score": 0.85,
            "is_blocked": True,
            "standard_transit_hours": 8.5,
            "current_estimated_transit_hours": 16.0,
        }
        alerts = self.engine.evaluate_route(blocked_route)
        self.assertTrue(any(a.alert_type == AlertType.ROUTE_DISRUPTION and a.severity == AlertSeverity.CRITICAL for a in alerts))
        self.assertTrue(any(a.alert_type == AlertType.DELAYED_SUPPLY for a in alerts))

        # Elevated Risk (Warning)
        elevated_route = {
            "route_id": "RTE-SRI-KRG-01",
            "route_name": "Zoji La Pass Axis",
            "origin_location_id": "LOC-SRI-01",
            "destination_location_id": "LOC-KRG-02",
            "risk_score": 0.52,
            "is_blocked": False,
            "standard_transit_hours": 6.5,
            "current_estimated_transit_hours": 6.8,
        }
        elevated_alerts = self.engine.evaluate_route(elevated_route)
        self.assertTrue(any(a.alert_type == AlertType.ROUTE_DISRUPTION and a.severity == AlertSeverity.WARNING for a in elevated_alerts))

    def test_negative_baseline_no_false_positives(self):
        """Negative baseline test: Healthy inventory, normal consumption, and clear route trigger zero alerts."""
        healthy_item = {
            "item_id": "SKU-POL-DSL-01",
            "item_name": "Diesel ATF-800",
            "category": "POL",
            "current_stock": 90000.0,
            "min_threshold": 30000.0,
            "reorder_level": 45000.0,
            "consumption_rate_daily": 3000.0,
            "current_consumption_rate": 3050.0,
            "baseline_consumption_rate": 3000.0,
            "lead_time_days": 4,
            "forecast_residual_sigma": 0.8,
            "storage_location_id": "LOC-LEH-03",
            "is_temperature_sensitive": False,
        }
        item_alerts = self.engine.evaluate_inventory_item(healthy_item)
        self.assertEqual(len(item_alerts), 0, "Healthy inventory item must not trigger false positive alerts")

        clear_route = {
            "route_id": "RTE-KRG-DRS-02",
            "route_name": "Kargil-Drass Sector",
            "origin_location_id": "LOC-KRG-02",
            "destination_location_id": "LOC-DRS-04",
            "risk_score": 0.12,
            "is_blocked": False,
            "standard_transit_hours": 1.8,
            "current_estimated_transit_hours": 1.9,
        }
        route_alerts = self.engine.evaluate_route(clear_route)
        self.assertEqual(len(route_alerts), 0, "Clear route must not trigger false positive alerts")


class TestAlertLifecycleAndDeduplication(unittest.TestCase):
    """
    Unit tests for alert state transitions, deterministic deduplication, and KPI synchronization.
    """

    def setUp(self):
        self.store = AlertStoreService()
        self.store.reset_to_pristine()

    def test_deterministic_deduplication(self):
        """Test that evaluating repeated unmitigated conditions does NOT generate duplicate alerts."""
        depleted_item = {
            "item_id": "SKU-TEST-DEDUP-01",
            "item_name": "Test SKU for Deduplication",
            "category": "Ordnance",
            "current_stock": 10.0,
            "min_threshold": 100.0,
            "reorder_level": 200.0,
            "consumption_rate_daily": 5.0,
            "lead_time_days": 4,
            "storage_location_id": "LOC-TEST-01",
        }

        # First evaluation pass
        first_pass = self.store.evaluate_and_persist(inventory_items=[depleted_item])
        self.assertEqual(len(first_pass), 1)
        alert_id = first_pass[0].alert_id

        # Second evaluation pass with exact same condition
        second_pass = self.store.evaluate_and_persist(inventory_items=[depleted_item])
        self.assertEqual(len(second_pass), 0, "Deduplication must suppress redundant active alert")

        # Resolve the first alert
        self.store.resolve_alert(
            alert_id=alert_id,
            resolved_by="Col. Rajesh Verma",
            resolution_notes="Emergency resupply completed.",
        )

        # Third evaluation pass after resolution: new alert can now be created if condition reoccurs
        third_pass = self.store.evaluate_and_persist(inventory_items=[depleted_item])
        self.assertEqual(len(third_pass), 1, "Resolved alert should allow new alert on recurrence")

    def test_acknowledgment_and_resolution_lifecycle(self):
        """Test state machine: new -> acknowledged -> resolved."""
        # Query a 'new' alert
        query_res = self.store.query_alerts(status="new")
        self.assertGreater(len(query_res["items"]), 0)
        target = query_res["items"][0]
        alert_id = target.alert_id

        # Acknowledge
        ack_res = self.store.acknowledge_alert(
            alert_id=alert_id, acknowledged_by="Lt. Col. Vikram Batra"
        )
        self.assertEqual(ack_res.status, "acknowledged")
        self.assertTrue(ack_res.is_acknowledged)
        self.assertEqual(ack_res.acknowledged_by, "Lt. Col. Vikram Batra")
        self.assertIsNotNone(ack_res.acknowledged_at)

        # Resolve
        resolve_res = self.store.resolve_alert(
            alert_id=alert_id,
            resolved_by="Lt. Col. Vikram Batra",
            resolution_notes="Fuel tanker convoy arrived and decanted.",
        )
        self.assertEqual(resolve_res.status, "resolved")
        self.assertTrue(resolve_res.is_resolved)
        self.assertEqual(resolve_res.resolution_notes, "Fuel tanker convoy arrived and decanted.")

        # Cannot re-acknowledge resolved alert
        with self.assertRaises(ValidationError):
            self.store.acknowledge_alert(alert_id=alert_id, acknowledged_by="Other Officer")

    def test_dynamic_kpi_synchronization(self):
        """Test that calculated KPIs accurately mirror the record store state."""
        kpis_before = self.store.calculate_kpis()
        initial_active = kpis_before.total_active_alerts
        initial_resolved = kpis_before.resolved_count

        # Query a new alert and resolve it
        new_alerts = [a for a in self.store._alerts if a.get("status") == "new"]
        self.assertGreater(len(new_alerts), 0)
        target_id = new_alerts[0]["alert_id"]

        self.store.resolve_alert(
            alert_id=target_id,
            resolved_by="HQ Officer",
            resolution_notes="Resolved in test.",
        )

        kpis_after = self.store.calculate_kpis()
        self.assertEqual(kpis_after.total_active_alerts, initial_active - 1)
        self.assertEqual(kpis_after.resolved_count, initial_resolved + 1)


if __name__ == "__main__":
    unittest.main()
