"""
LogiPredict AI - Logistics Simulation Engine Unit & Integration Tests
=====================================================================
Validation Suite for Phase 8:
1. Baseline Telematics & Metadata Generation
2. Preset Scenario Resolution
3. Multi-Factor Discrete-Event Simulation Dynamics
4. 7-Dimension Before-Versus-After Comparative Math
5. Stockout Incident Tracking & Safety Stock Buffer Detection
6. Proactive Replenishment & Detour Recommendation Synthesis
7. Zero-Division Edge Cases & Non-Destructive Data Isolation
"""

import unittest
from app.services.simulation_service import simulation_service, PRESET_SCENARIOS
from app.schemas.simulation import (
    SimulationRequest,
    DisruptionScenario,
    DisruptionScenarioType,
    InitialStockOverride,
)
from app.services.forecast_data import SKU_CATALOG
from app.services.route_service import DEFAULT_ROUTES


class TestSimulationEngine(unittest.TestCase):
    """
    Unit and mathematical verification tests for SimulationService.
    """

    def test_baseline_generation(self):
        """1. Verify baseline generation returns consistent non-empty SKU, location, and route catalogs."""
        baseline = simulation_service.get_baseline_info()
        self.assertIsNotNone(baseline)
        self.assertGreater(baseline.baseline_metrics["total_skus"], 0)
        self.assertGreater(baseline.baseline_metrics["total_initial_inventory"], 0)
        self.assertGreater(baseline.baseline_metrics["total_daily_demand"], 0)
        self.assertGreaterEqual(len(baseline.sku_catalog_summary), 20)
        self.assertGreaterEqual(len(baseline.locations_summary), 8)
        self.assertGreaterEqual(len(baseline.routes_summary), 9)
        self.assertGreaterEqual(len(baseline.preset_scenarios), 5)

    def test_preset_scenarios_listing_and_lookup(self):
        """2. Verify scenario preset definitions exist and can be retrieved by ID."""
        presets = simulation_service.get_preset_scenarios()
        self.assertEqual(len(presets), len(PRESET_SCENARIOS))

        # Test valid preset
        winter_preset = simulation_service.get_preset_scenario_by_id("SCN-WINTER-01")
        self.assertEqual(winter_preset.id, "SCN-WINTER-01")
        self.assertEqual(winter_preset.demand_surge_percentage, 35.0)
        self.assertEqual(winter_preset.lead_time_dilation_days, 8)

    def test_discrete_event_peacetime_baseline_run(self):
        """3. Run peacetime nominal baseline simulation and ensure high resilience and no stockouts."""
        req = SimulationRequest(
            simulation_name="Peacetime Baseline Test",
            duration_days=30,
            demand_surge_percentage=0.0,
            lead_time_dilation_days=0,
            inventory_change_percentage=0.0,
            random_seed=42,
        )
        res = simulation_service.run_simulation(req)

        self.assertEqual(res.status, "completed")
        self.assertEqual(res.summary_metrics.total_simulated_days, 30)
        self.assertGreaterEqual(res.summary_metrics.overall_service_level_percentage, 95.0)
        self.assertGreaterEqual(res.resilience_score, 80.0)
        self.assertEqual(len(res.daily_trajectories), 30)
        self.assertIn("inventory_levels", res.comparison.model_dump())
        self.assertIn("demand_forecasts", res.comparison.model_dump())

    def test_severe_weather_and_corridor_disruption_impact(self):
        """4. Verify demand surge and lead time dilation trigger expected stock drawdowns and comparative deltas."""
        req = SimulationRequest(
            simulation_name="Winter Pass Blockade Stress Test",
            duration_days=30,
            demand_surge_percentage=50.0,
            lead_time_dilation_days=10,
            inventory_change_percentage=-20.0,
            route_disruption_preset="zoji_la_blizzard",
            random_seed=42,
        )
        res = simulation_service.run_simulation(req)

        # Comparative metric checks
        comp = res.comparison
        self.assertGreater(comp.demand_forecasts.simulated_value, comp.demand_forecasts.baseline_value)
        self.assertGreater(comp.demand_forecasts.percentage_change, 0.0)
        self.assertLess(comp.inventory_levels.simulated_value, comp.inventory_levels.baseline_value)
        self.assertEqual(comp.supply_delays.delta, 10.0)

        # Route impact checks
        zoji_route = next((r for r in res.route_impacts if r.route_id == "RTE-SRI-KRG-01"), None)
        self.assertIsNotNone(zoji_route)
        self.assertEqual(zoji_route.status, "Delayed")
        self.assertGreater(zoji_route.simulated_transit_hours, zoji_route.baseline_transit_hours)

        # Recommendations & Impact checks
        self.assertGreater(len(res.impact_summary), 0)
        self.assertGreater(len(res.recommendations), 0)

    def test_rockfall_blockage_and_detour_routing(self):
        """5. Verify corridor complete severance (khardung_la_landslide) flags blocked routes and detour IDs."""
        req = SimulationRequest(
            simulation_name="Khardung La Cutoff Test",
            duration_days=14,
            scenario_preset="SCN-LANDSLIDE-03",
        )
        res = simulation_service.run_simulation(req)

        # Verify Khardung La route is severed and detour is suggested
        khardung = next((r for r in res.route_impacts if r.route_id == "RTE-LEH-SIA-01"), None)
        self.assertIsNotNone(khardung)
        self.assertTrue(khardung.is_blocked)
        self.assertEqual(khardung.status, "Disrupted")
        self.assertEqual(khardung.recommended_detour_id, "RTE-LEH-SIA-02")
        self.assertIsNotNone(khardung.recommended_detour_name)

    def test_zero_division_guard_and_edge_values(self):
        """6. Test zero-division protection in metric differential computations."""
        point_zero_base = simulation_service._compute_metric_diff(
            base=0.0, sim=50.0, unit="Units", higher_is_better=True
        )
        self.assertEqual(point_zero_base.percentage_change, 100.0)
        self.assertEqual(point_zero_base.delta, 50.0)
        self.assertEqual(point_zero_base.status, "improved")

        point_both_zero = simulation_service._compute_metric_diff(
            base=0.0, sim=0.0, unit="Units", higher_is_better=True
        )
        self.assertEqual(point_both_zero.percentage_change, 0.0)
        self.assertEqual(point_both_zero.delta, 0.0)
        self.assertEqual(point_both_zero.status, "neutral")

    def test_non_destructive_master_data_isolation(self):
        """7. Ensure simulation execution leaves master SKU catalog and route data completely unaltered."""
        original_stock_leh = SKU_CATALOG["SKU-POL-001"]["current_stock"]
        original_transit = DEFAULT_ROUTES[0]["standard_transit_hours"]

        req = SimulationRequest(
            simulation_name="Data Isolation Test",
            duration_days=60,
            demand_surge_percentage=200.0,
            lead_time_dilation_days=20,
            inventory_change_percentage=-80.0,
            route_disruption_preset="zoji_la_blizzard",
        )
        simulation_service.run_simulation(req)

        # Master dataset must be exactly as before
        self.assertEqual(SKU_CATALOG["SKU-POL-001"]["current_stock"], original_stock_leh)
        self.assertEqual(DEFAULT_ROUTES[0]["standard_transit_hours"], original_transit)


if __name__ == "__main__":
    unittest.main()
