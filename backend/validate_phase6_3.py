"""
LogiPredict AI - Phase 6.3 Comprehensive Alert Validation Runner
================================================================
Executes automated validation for:
1. Synthetic inventory depletion & predictive stockout triggers
2. Cold-chain thermal excursions (+2°C to +8°C envelope)
3. Convoy transit delays & mountain pass route blockages
4. Consumption velocity surges (>= 1.5x baseline)
5. Neural forecast residual statistical anomalies (>= 3.0 sigma)
6. Negative baseline tests (zero false positives on nominal data)
7. Deterministic deduplication hashing (MD5 key deduplication)
8. Lifecycle state transitions (new -> acknowledged -> resolved) with audit trails
9. Dynamic KPI synchronization across store & summary endpoints
10. FastAPI Route Endpoints Integration

Indian Army Forward Supply Chain (SIH 2026)
"""

import sys
import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.alert import AlertSeverity, AlertType
from app.services.alert_service import (
    AlertEngine,
    AlertStoreService,
    alert_engine,
    alert_store_service,
)
from app.utils.exceptions import ValidationError, NotFoundError


def run_phase6_3_validations():
    print("=" * 80)
    print(" LOGIPREDICT AI - PHASE 6.3 PREDICTIVE ALERT SYSTEM VALIDATION SUITE ")
    print("=" * 80)

    # ---------------------------------------------------------
    # 1. Mathematical Anomaly Trigger Validation
    # ---------------------------------------------------------
    print("\n[STEP 1] Validating Mathematical Anomaly Trigger Rules...")
    engine = AlertEngine()

    # Rule 1.1: Critical Low Stock
    item_low_stock = {
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
    alerts = engine.evaluate_inventory_item(item_low_stock)
    assert any(a.severity == AlertSeverity.CRITICAL and a.alert_type == AlertType.LOW_STOCK for a in alerts), \
        "Rule 1.1 Failed: Low stock did not trigger CRITICAL LOW_STOCK"
    print("  ✓ Rule 1.1: Physical safety stock breach triggered CRITICAL LOW_STOCK alert")

    # Rule 1.2: Warning Replenishment Required
    item_reorder = {
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
    alerts = engine.evaluate_inventory_item(item_reorder)
    assert any(a.severity == AlertSeverity.WARNING and a.alert_type == AlertType.REPLENISHMENT_REQUIRED for a in alerts), \
        "Rule 1.2 Failed: Stock between min and reorder did not trigger WARNING REPLENISHMENT_REQUIRED"
    print("  ✓ Rule 1.2: Reorder threshold breach triggered WARNING REPLENISHMENT_REQUIRED alert")

    # Rule 1.3: Predicted Stockout
    item_stockout = {
        "item_id": "SKU-ENG-BAT-09",
        "item_name": "LiFePO4 Extreme-Cold Battery",
        "category": "Spares & Engineering",
        "current_stock": 35.0,
        "min_threshold": 30.0,
        "reorder_level": 50.0,
        "consumption_rate_daily": 10.0,  # 3.5 days runway
        "lead_time_days": 6,  # 6 days lead time > 3.5 days runway
        "storage_location_id": "LOC-KRG-02",
    }
    alerts = engine.evaluate_inventory_item(item_stockout)
    assert any(a.alert_type == AlertType.PREDICTED_STOCKOUT and a.severity == AlertSeverity.CRITICAL for a in alerts), \
        "Rule 1.3 Failed: Depletion before lead time did not trigger CRITICAL PREDICTED_STOCKOUT"
    print("  ✓ Rule 1.3: Projected depletion prior to lead time resupply triggered CRITICAL PREDICTED_STOCKOUT")

    # Rule 1.4: Consumption Velocity Surge
    item_surge = {
        "item_id": "SKU-ORD-556-03",
        "item_name": "5.56mm INSAS Ammunition",
        "category": "Ordnance & Ammunition",
        "current_stock": 800.0,
        "min_threshold": 200.0,
        "reorder_level": 350.0,
        "consumption_rate_daily": 12.0,
        "current_consumption_rate": 24.0,  # 2.0x baseline >= 1.5x
        "baseline_consumption_rate": 12.0,
        "lead_time_days": 3,
        "storage_location_id": "LOC-KRG-02",
    }
    alerts = engine.evaluate_inventory_item(item_surge)
    assert any(a.alert_type == AlertType.DEMAND_SURGE and a.severity == AlertSeverity.WARNING for a in alerts), \
        "Rule 1.4 Failed: 2.0x surge did not trigger WARNING DEMAND_SURGE"
    print("  ✓ Rule 1.4: Consumption velocity spike (>= 1.5x) triggered WARNING DEMAND_SURGE alert")

    # Rule 1.5: Cold-Chain Thermal Excursion
    item_cold_chain = {
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
        "current_temperature": 14.5,  # Severe excursion > 10.0°C
        "storage_location_id": "LOC-LEH-03",
    }
    alerts = engine.evaluate_inventory_item(item_cold_chain)
    assert any(a.alert_type == AlertType.COLD_CHAIN_EXCURSION and a.severity == AlertSeverity.CRITICAL for a in alerts), \
        "Rule 1.5 Failed: 14.5°C temp did not trigger CRITICAL COLD_CHAIN_EXCURSION"
    print("  ✓ Rule 1.5: Thermal excursion outside envelope triggered CRITICAL COLD_CHAIN_EXCURSION alert")

    # Rule 1.6: Forecast Residual Statistical Anomaly
    item_residual = {
        "item_id": "SKU-RAT-MRE-05",
        "item_name": "Combat Rations MRE",
        "category": "Rations & Subsistence",
        "current_stock": 15000.0,
        "min_threshold": 5000.0,
        "reorder_level": 7500.0,
        "consumption_rate_daily": 450.0,
        "lead_time_days": 7,
        "forecast_residual_sigma": 3.4,  # >= 3.0 sigma
        "storage_location_id": "LOC-SIA-05",
    }
    alerts = engine.evaluate_inventory_item(item_residual)
    assert any(a.alert_type == AlertType.FORECAST_ANOMALY and a.severity == AlertSeverity.WARNING for a in alerts), \
        "Rule 1.6 Failed: 3.4 sigma residual did not trigger WARNING FORECAST_ANOMALY"
    print("  ✓ Rule 1.6: Neural residual divergence (>= 3.0σ) triggered WARNING FORECAST_ANOMALY alert")

    # Rule 1.7: Route Disruptions & Transit Delays
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
    alerts = engine.evaluate_route(blocked_route)
    assert any(a.alert_type == AlertType.ROUTE_DISRUPTION and a.severity == AlertSeverity.CRITICAL for a in alerts), \
        "Rule 1.7 Failed: Blocked route did not trigger CRITICAL ROUTE_DISRUPTION"
    assert any(a.alert_type == AlertType.DELAYED_SUPPLY for a in alerts), \
        "Rule 1.7 Failed: Delay > 1.25x did not trigger DELAYED_SUPPLY"
    print("  ✓ Rule 1.7: Mountain pass blockage and transit delay triggered CRITICAL ROUTE_DISRUPTION and DELAYED_SUPPLY alerts")

    # ---------------------------------------------------------
    # 2. Negative Baseline Validation (Zero False Positives)
    # ---------------------------------------------------------
    print("\n[STEP 2] Validating Negative Baseline (Zero False Positives)...")
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
    healthy_alerts = engine.evaluate_inventory_item(healthy_item)
    assert len(healthy_alerts) == 0, f"Negative Baseline Failed: Expected 0 alerts, got {len(healthy_alerts)}"

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
    clear_route_alerts = engine.evaluate_route(clear_route)
    assert len(clear_route_alerts) == 0, f"Negative Baseline Failed: Expected 0 route alerts, got {len(clear_route_alerts)}"
    print("  ✓ Negative Baseline: Nominal inventory buffers, normal consumption, and clear routes generated 0 false positives")

    # ---------------------------------------------------------
    # 3. Deterministic Deduplication Hashing Validation
    # ---------------------------------------------------------
    print("\n[STEP 3] Validating Deterministic Deduplication Hashing...")
    store = AlertStoreService()
    store.reset_to_pristine()

    test_sku = {
        "item_id": "SKU-TEST-DEDUP-99",
        "item_name": "Test Munitions for Deduplication",
        "category": "Ordnance",
        "current_stock": 5.0,
        "min_threshold": 100.0,
        "reorder_level": 200.0,
        "consumption_rate_daily": 10.0,
        "lead_time_days": 3,
        "storage_location_id": "LOC-TEST-01",
    }

    # Pass 1: Alert created
    pass1 = store.evaluate_and_persist(inventory_items=[test_sku])
    assert len(pass1) == 1, "Pass 1 failed to generate alert"
    test_alert_id = pass1[0].alert_id
    print(f"  ✓ Pass 1: Generated initial anomaly alert {test_alert_id} (Dedup hash: {pass1[0].dedup_hash[:8]}...)")

    # Pass 2: Exact condition re-evaluated -> suppressed by deduplication hash
    pass2 = store.evaluate_and_persist(inventory_items=[test_sku])
    assert len(pass2) == 0, f"Pass 2 failed deduplication: generated {len(pass2)} duplicate alerts"
    print("  ✓ Pass 2: Suppressed redundant active alert via MD5 dedup hash check")

    # Pass 3: Resolve alert and re-evaluate -> recurrence creates new alert
    store.resolve_alert(
        alert_id=test_alert_id,
        resolved_by="Col. Rajesh Verma",
        resolution_notes="Airlift supply completed.",
    )
    pass3 = store.evaluate_and_persist(inventory_items=[test_sku])
    assert len(pass3) == 1, "Pass 3 failed to generate recurrence alert after resolution"
    print(f"  ✓ Pass 3: Successfully re-triggered new alert {pass3[0].alert_id} upon recurring anomaly condition after resolution")

    # ---------------------------------------------------------
    # 4. Lifecycle State Transitions & Audit Trails
    # ---------------------------------------------------------
    print("\n[STEP 4] Validating Lifecycle State Transitions & Audit Trails...")
    # Query an alert in 'new' state
    query_new = store.query_alerts(status="new")
    target_alert = query_new["items"][0]
    target_id = target_alert.alert_id

    # Acknowledge
    ack_result = store.acknowledge_alert(alert_id=target_id, acknowledged_by="Lt. Col. Vikram Batra")
    assert ack_result.status == "acknowledged"
    assert ack_result.is_acknowledged is True
    assert ack_result.acknowledged_by == "Lt. Col. Vikram Batra"
    assert ack_result.acknowledged_at is not None
    print(f"  ✓ Acknowledge: Alert {target_id} transitioned 'new' -> 'acknowledged' with officer callsign stamp")

    # Resolve
    resolve_result = store.resolve_alert(
        alert_id=target_id,
        resolved_by="Brig. Kuldeep Singh",
        resolution_notes="24,000L fuel bowser decanted into storage tanks.",
    )
    assert resolve_result.status == "resolved"
    assert resolve_result.is_resolved is True
    assert resolve_result.resolved_by == "Brig. Kuldeep Singh"
    assert "24,000L fuel bowser" in resolve_result.resolution_notes
    assert resolve_result.resolved_at is not None
    print(f"  ✓ Resolve: Alert {target_id} transitioned 'acknowledged' -> 'resolved' with mitigation audit notes")

    # Ensure resolved alert cannot be re-acknowledged
    try:
        store.acknowledge_alert(alert_id=target_id, acknowledged_by="Other Officer")
        assert False, "Validation Error expected when acknowledging resolved alert"
    except ValidationError:
        print("  ✓ Guard: Correctly prevented invalid state transition (cannot acknowledge a resolved alert)")

    # ---------------------------------------------------------
    # 5. Dynamic KPI Synchronization
    # ---------------------------------------------------------
    print("\n[STEP 5] Validating Dynamic KPI Synchronization...")
    kpis = store.calculate_kpis()
    assert kpis.total_active_alerts == (kpis.critical_count + kpis.warning_count + kpis.info_count)
    assert kpis.total_records >= kpis.total_active_alerts + kpis.resolved_count
    print(f"  ✓ KPI Sync: Total Active ({kpis.total_active_alerts}) = Critical ({kpis.critical_count}) + Warning ({kpis.warning_count}) + Info ({kpis.info_count})")
    print(f"  ✓ KPI Sync: Resolved Count ({kpis.resolved_count}), Unacknowledged Count ({kpis.unacknowledged_count}), Transit Risks ({kpis.transit_risks_count})")

    # ---------------------------------------------------------
    # 6. FastAPI Route Endpoints Integration
    # ---------------------------------------------------------
    print("\n[STEP 6] Validating FastAPI REST Endpoints Integration...")
    client = TestClient(app)

    # 6.1: GET /api/v1/alerts
    res_list = client.get("/api/v1/alerts?pageSize=5&severity=all")
    assert res_list.status_code == 200
    assert res_list.json()["success"] is True
    assert len(res_list.json()["data"]["items"]) <= 5
    print("  ✓ GET /api/v1/alerts: Returned paginated alert records and KPI counters")

    # 6.2: GET /api/v1/alerts/summary
    res_sum = client.get("/api/v1/alerts/summary")
    assert res_sum.status_code == 200
    assert "total_active_alerts" in res_sum.json()["data"]
    print("  ✓ GET /api/v1/alerts/summary: Returned real-time KPI aggregates")

    # 6.3: GET /api/v1/alerts/{alert_id}
    res_detail = client.get(f"/api/v1/alerts/{target_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["data"]["alert_id"] == target_id
    print(f"  ✓ GET /api/v1/alerts/{target_id}: Retrieved telemetry detail and audit history")

    # 6.4: POST /api/v1/alerts/evaluate
    res_eval = client.post(
        "/api/v1/alerts/evaluate",
        json={"inventory_items": [item_low_stock], "auto_persist": True},
    )
    assert res_eval.status_code == 200
    print("  ✓ POST /api/v1/alerts/evaluate: Successfully evaluated dynamic telemetry payload")

    # 6.5: POST /api/v1/alerts/reset
    res_reset = client.post("/api/v1/alerts/reset")
    assert res_reset.status_code == 200
    assert res_reset.json()["data"]["reset"] is True
    print("  ✓ POST /api/v1/alerts/reset: Reset alerts store to pristine synthetic baseline")

    print("\n" + "=" * 80)
    print(" ALL PHASE 6.3 PREDICTIVE ALERT VALIDATION TESTS PASSED WITH 100% SUCCESS! ")
    print("=" * 80)
    return True


if __name__ == "__main__":
    success = run_phase6_3_validations()
    sys.exit(0 if success else 1)
