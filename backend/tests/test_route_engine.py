"""
LogiPredict AI - Route Engine Integration Tests
==============================================
Phase 7 Validation:
1. Route Network Hubs & Corridors
2. Shortest-Path & Multi-Criteria Optimization
3. Non-Destructive Disruption Simulation
4. Alternative Detour Generation
5. Capacity Utilization Math
6. Pristine Baseline Reset
"""
import unittest

from app.services.route_service import route_service
from app.schemas.location_route import (
    RoadCondition,
    RouteStatus,
    RouteOptimizationRequest,
    DisruptionSimulationRequest
)

class TestRouteEngine(unittest.TestCase):

    def setUp(self):
        # Reset to pristine state before every test
        route_service.reset_to_pristine()

    def test_locations_and_routes_baseline(self):
        """1. Verify standard hubs and corridors exist in default dataset."""
        locations = route_service.get_all_locations()
        self.assertGreaterEqual(len(locations), 8)
        ids = [loc.location_id for loc in locations]
        self.assertIn("LOC-LEH-01", ids)
        self.assertIn("LOC-SRI-03", ids)

        # Access original routes to see total count
        routes = route_service.query_routes()
        self.assertGreaterEqual(len(routes), 9)  # Base corridors count

    def test_capacity_utilization_math(self):
        """5. Validate zero-division protection and clamping for capacity calculation."""
        util1 = route_service.compute_capacity_utilization(50, 100)
        self.assertEqual(util1, 50.0)

        # Zero-division fallback
        util2 = route_service.compute_capacity_utilization(50, 0)
        self.assertEqual(util2, 0.0)

        # Overflow/Underflow clamping
        util3 = route_service.compute_capacity_utilization(150, 100)
        self.assertEqual(util3, 100.0)

        util4 = route_service.compute_capacity_utilization(-20, 100)
        self.assertEqual(util4, 0.0)

    def test_multi_objective_route_optimization(self):
        """2. Validate closest-path shortest selection algorithm with risk penalties."""
        req = RouteOptimizationRequest(
            origin_location_id="LOC-SRI-03",
            destination_location_id="LOC-KRG-04",
            total_cargo_weight_tonnes=20,
            avoid_avalanche_zones=True
        )
        resp = route_service.optimize_route(req)

        # Primary should be Zoji La route normally
        self.assertEqual(resp.primary_route_id, "RTE-SRI-KRG-01")
        self.assertGreaterEqual(len(resp.alternative_route_ids), 1)
        self.assertTrue(resp.total_distance_km > 0)
        self.assertTrue(resp.estimated_transit_hours > 0)

    def test_disruption_simulation_presets(self):
        """3. Validate known disruption presets dynamically alter operational metrics without destroying data."""
        # Baseline check
        route = route_service.get_route_by_id("RTE-SRI-KRG-01")
        base_time = route["standard_transit_hours"]
        self.assertEqual(route["status"], RouteStatus.OPERATIONAL)

        # Trigger blizzard
        req = DisruptionSimulationRequest(scenario_preset="zoji_la_blizzard")
        sim_resp = route_service.simulate_disruption(req)

        self.assertGreaterEqual(sim_resp.affected_routes_count, 1)
        target = next((r for r in sim_resp.affected_routes if r.route_id == "RTE-SRI-KRG-01"), None)
        self.assertIsNotNone(target)

        # Ensure it got delayed
        self.assertGreater(target.current_estimated_transit_hours, base_time)
        self.assertEqual(target.road_condition, RoadCondition.SNOW_BOUND)
        self.assertEqual(target.status, RouteStatus.DELAYED)

    def test_blockage_and_detour_recommendation(self):
        """4. Validate completely blocked routes push status to DISRUPTED and suggest alternatives."""
        req = DisruptionSimulationRequest(scenario_preset="khardung_la_landslide")
        resp = route_service.simulate_disruption(req)

        route = route_service.get_route_by_id("RTE-LEH-SIA-01")
        self.assertTrue(route["is_blocked"])
        self.assertEqual(route["status"], RouteStatus.DISRUPTED)

        # Should have generated a detour via RTE-LEH-SIA-02
        self.assertGreater(len(resp.reroute_recommendations), 0)
        detour = resp.reroute_recommendations[0]
        self.assertEqual(detour["disrupted_route_id"], "RTE-LEH-SIA-01")
        self.assertIsNotNone(detour["recommended_detour_id"])

    def test_baseline_reset(self):
        """6. Validate 1-click restore functionality to pristine operational parameters."""
        # Make a mess
        req = DisruptionSimulationRequest(
            route_id="RTE-UDH-SRI-01",
            is_blocked=True,
            delay_multiplier=3.0
        )
        route_service.simulate_disruption(req)

        bad_route = route_service.get_route_by_id("RTE-UDH-SRI-01")
        self.assertTrue(bad_route["is_blocked"])

        # Reset
        route_service.reset_to_pristine()

        clean_route = route_service.get_route_by_id("RTE-UDH-SRI-01")
        self.assertFalse(clean_route["is_blocked"])
        self.assertEqual(clean_route["status"], RouteStatus.OPERATIONAL)
        self.assertEqual(clean_route["current_estimated_transit_hours"], clean_route["standard_transit_hours"])

if __name__ == "__main__":
    unittest.main()
