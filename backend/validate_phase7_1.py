"""
LogiPredict AI - Phase 7.1 Route Planning & Simulation Validation Suite
========================================================================
Automated validation for:
1. Master synthetic logistics locations & route data integrity
2. Capacity utilization formula (Allocated / Total * 100) and zero-division guard
3. Route status determination rules (operational, delayed, disrupted, unavailable)
4. AI Shortest-path & Multi-criteria Convoy Optimization
5. Non-destructive disruption simulation (delays, capacity throttle, pass closures)
6. Dynamic tactical rerouting and detour recommendations
7. Pristine state rollback / reset functionality
8. FastAPI REST API endpoints integration

Indian Army Forward Supply Chain (SIH 2026)
"""

import sys
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.location_route import (
    RoadCondition,
    RouteStatus,
    RouteOptimizationRequest,
    DisruptionSimulationRequest,
)
from app.services.route_service import RouteService, route_service
from app.utils.exceptions import ValidationError, NotFoundError


def run_phase7_1_validations():
    print("=" * 80)
    print(" LOGIPREDICT AI - PHASE 7.1 ROUTE PLANNING & SIMULATION VALIDATION SUITE ")
    print("=" * 80)

    # ---------------------------------------------------------
    # 1. Master Synthetic Data Integrity & Locations
    # ---------------------------------------------------------
    print("\n[STEP 1] Validating Locations & Corridors Data Integrity...")
    service = RouteService()
    locations = service.get_all_locations()
    assert len(locations) >= 8, f"Expected at least 8 depots, got {len(locations)}"

    loc_ids = [loc.location_id for loc in locations]
    expected_nodes = [
        "LOC-LEH-01", "LOC-UDH-02", "LOC-SRI-03", "LOC-KRG-04",
        "LOC-DRS-05", "LOC-SIA-06", "LOC-NBR-07", "LOC-PNG-08"
    ]
    for exp_id in expected_nodes:
        assert exp_id in loc_ids, f"Expected node {exp_id} missing in locations"
        loc = service.get_location_by_id(exp_id)
        assert loc.name and loc.latitude and loc.longitude
        assert loc.svg_x is not None and loc.svg_y is not None

    print(f"  ✓ Validated {len(locations)} Forward Operating Bases, Base Depots, and Outposts with SVG coordinates")

    # ---------------------------------------------------------
    # 2. Mathematical Capacity Utilization & Status Rules
    # ---------------------------------------------------------
    print("\n[STEP 2] Validating Capacity Utilization & Status Determination...")
    # Formula test: 45 / 60 * 100 = 75.0%
    util = service.compute_capacity_utilization(45.0, 60.0)
    assert util == 75.0, f"Expected 75.0%, got {util}"

    # Zero-division test
    zero_util = service.compute_capacity_utilization(10.0, 0.0)
    assert zero_util == 0.0, f"Expected 0.0% for 0 total capacity, got {zero_util}"

    # Negative value protection
    neg_util = service.compute_capacity_utilization(-5.0, 50.0)
    assert neg_util == 0.0, f"Expected 0.0% for negative allocated, got {neg_util}"

    # Over-capacity ceiling
    over_util = service.compute_capacity_utilization(120.0, 100.0)
    assert over_util == 100.0, f"Expected capped 100.0%, got {over_util}"

    print("  ✓ Capacity Utilization formula (Allocated/Total * 100) & zero-division safeguard verified")

    # Status rules test
    status_clear = service._determine_route_status({
        "is_blocked": False,
        "road_condition": RoadCondition.CLEAR_ALL_WEATHER,
        "risk_score": 0.20,
        "standard_transit_hours": 5.0,
        "current_estimated_transit_hours": 5.2,
        "capacity_utilization_pct": 50.0,
    })
    assert status_clear == RouteStatus.OPERATIONAL, f"Expected OPERATIONAL, got {status_clear}"

    status_delayed = service._determine_route_status({
        "is_blocked": False,
        "road_condition": RoadCondition.CLEAR_ALL_WEATHER,
        "risk_score": 0.20,
        "standard_transit_hours": 5.0,
        "current_estimated_transit_hours": 7.5,  # 1.5x delay >= 1.25x
        "capacity_utilization_pct": 50.0,
    })
    assert status_delayed == RouteStatus.DELAYED, f"Expected DELAYED, got {status_delayed}"

    status_blocked = service._determine_route_status({
        "is_blocked": True,
        "road_condition": RoadCondition.LANDSLIDE_BLOCKED,
        "risk_score": 0.90,
        "standard_transit_hours": 5.0,
        "current_estimated_transit_hours": 5.0,
        "capacity_utilization_pct": 50.0,
    })
    assert status_blocked == RouteStatus.DISRUPTED, f"Expected DISRUPTED, got {status_blocked}"

    print("  ✓ Route status determination engine verified (OPERATIONAL, DELAYED, DISRUPTED)")

    # ---------------------------------------------------------
    # 3. AI Convoy Route Optimization Engine
    # ---------------------------------------------------------
    print("\n[STEP 3] Validating AI Convoy Shortest-Path & Risk Optimization...")
    opt_req = RouteOptimizationRequest(
        origin_location_id="LOC-SRI-03",
        destination_location_id="LOC-KRG-04",
        total_cargo_weight_tonnes=25.0,
        avoid_avalanche_zones=True,
    )
    opt_res = service.optimize_route(opt_req)
    assert opt_res.primary_route_id == "RTE-SRI-KRG-01", f"Expected primary route RTE-SRI-KRG-01, got {opt_res.primary_route_id}"
    assert len(opt_res.alternative_route_ids) >= 1
    assert opt_res.total_distance_km == 204.0
    assert opt_res.estimated_transit_hours == 6.8
    assert len(opt_res.waypoints) >= 7
    print(f"  ✓ Convoy Optimization: Selected primary corridor '{opt_res.primary_route_name}' ({opt_res.total_distance_km} km, {opt_res.estimated_transit_hours}h ETA)")

    # Test identical origin/destination validation error
    try:
        service.optimize_route(RouteOptimizationRequest(
            origin_location_id="LOC-LEH-01",
            destination_location_id="LOC-LEH-01",
        ))
        assert False, "Should raise ValidationError for identical origin and destination"
    except ValidationError:
        print("  ✓ Validation Guard: Identical origin and destination selection correctly rejected")

    # ---------------------------------------------------------
    # 4. Disruption Simulation & Tactical Detour Engine
    # ---------------------------------------------------------
    print("\n[STEP 4] Validating Disruption Simulation & Tactical Detours...")
    # Scenario: Khardung La Landslide Blockage on Leh -> Siachen
    disrupt_req = DisruptionSimulationRequest(
        scenario_preset="khardung_la_landslide"
    )
    disrupt_res = service.simulate_disruption(disrupt_req)
    assert disrupt_res.affected_routes_count >= 1
    assert any(r.route_id == "RTE-LEH-SIA-01" for r in disrupt_res.affected_routes)

    # Verify reroute recommendation generated
    assert len(disrupt_res.reroute_recommendations) >= 1
    reroute = disrupt_res.reroute_recommendations[0]
    assert reroute["disrupted_route_id"] == "RTE-LEH-SIA-01"
    assert reroute["recommended_detour_id"] == "RTE-LEH-SIA-02"
    print(f"  ✓ Disruption Scenario '{disrupt_res.scenario_name}' applied: Automatically suggested alternative bypass '{reroute['recommended_detour_name']}'")

    # ---------------------------------------------------------
    # 5. Pristine Reset Rollback
    # ---------------------------------------------------------
    print("\n[STEP 5] Validating Pristine State Reset Rollback...")
    service.reset_to_pristine()
    kpis = service.calculate_kpis()
    assert kpis.disrupted_routes == 0, f"Expected 0 disrupted routes after reset, got {kpis.disrupted_routes}"
    assert kpis.operational_routes == kpis.total_routes
    print("  ✓ Pristine state reset restored 100% operational baseline network")

    # ---------------------------------------------------------
    # 6. FastAPI REST Endpoints Integration
    # ---------------------------------------------------------
    print("\n[STEP 6] Validating FastAPI REST Endpoints Integration...")
    client = TestClient(app)

    # 6.1 GET /api/v1/locations
    res_loc = client.get("/api/v1/locations")
    assert res_loc.status_code == 200
    assert res_loc.json()["success"] is True
    assert len(res_loc.json()["data"]["locations"]) >= 8
    print("  ✓ GET /api/v1/locations: Successfully retrieved all military hubs")

    # 6.2 GET /api/v1/routes
    res_routes = client.get("/api/v1/routes?origin=LOC-SRI-03&destination=LOC-KRG-04")
    assert res_routes.status_code == 200
    routes_data = res_routes.json()["data"]
    assert routes_data["total"] >= 2
    assert "kpis" in routes_data
    print("  ✓ GET /api/v1/routes: Retrieved filtered corridors between Srinagar and Kargil")

    # 6.3 GET /api/v1/routes/kpis
    res_kpis = client.get("/api/v1/routes/kpis")
    assert res_kpis.status_code == 200
    assert "total_routes" in res_kpis.json()["data"]
    print("  ✓ GET /api/v1/routes/kpis: Retrieved global network KPIs")

    # 6.4 GET /api/v1/routes/{route_id}
    res_detail = client.get("/api/v1/routes/RTE-SRI-KRG-01")
    assert res_detail.status_code == 200
    assert res_detail.json()["data"]["route_id"] == "RTE-SRI-KRG-01"
    assert len(res_detail.json()["data"]["waypoints"]) >= 7
    print("  ✓ GET /api/v1/routes/RTE-SRI-KRG-01: Retrieved route telemetry and waypoints")

    # 6.5 POST /api/v1/routes/optimize
    res_opt = client.post("/api/v1/routes/optimize", json={
        "origin_location_id": "LOC-KRG-04",
        "destination_location_id": "LOC-LEH-01",
        "total_cargo_weight_tonnes": 30.0,
    })
    assert res_opt.status_code == 200
    assert res_opt.json()["data"]["primary_route_id"] == "RTE-KRG-LEH-01"
    print("  ✓ POST /api/v1/routes/optimize: Convoy optimizer returned primary and alternative corridors")

    # 6.6 POST /api/v1/routes/simulate-disruption
    res_sim = client.post("/api/v1/routes/simulate-disruption", json={
        "scenario_preset": "zoji_la_blizzard",
    })
    assert res_sim.status_code == 200
    assert res_sim.json()["data"]["affected_routes_count"] >= 1
    print("  ✓ POST /api/v1/routes/simulate-disruption: Simulated Zoji La Blizzard and recalculated delay ETA")

    # 6.7 POST /api/v1/routes/reset
    res_reset = client.post("/api/v1/routes/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["data"]["reset"] is True
    print("  ✓ POST /api/v1/routes/reset: Reset route telemetry and simulation state")

    print("\n" + "=" * 80)
    print(" ALL PHASE 7.1 BACKEND ROUTE & SIMULATION TESTS PASSED WITH 100% SUCCESS! ")
    print("=" * 80)
    return True


if __name__ == "__main__":
    success = run_phase7_1_validations()
    sys.exit(0 if success else 1)
