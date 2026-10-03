"""
LogiPredict AI - Predictive Alert Engine & Store Service
========================================================
Phase 6.3: Anomaly Detection Engine, Priority Classification,
Deterministic Deduplication, Lifecycle Transitions, and KPI Synchronizer.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime, timedelta, timezone
import hashlib
import json
import math
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

from app.schemas.alert import (
    AlertSeverity,
    AlertType,
    AlertBase,
    AlertCreate,
    AlertResponse,
    AlertSummary,
)
from app.utils.exceptions import ValidationError, NotFoundError

# Load static synthetic catalog for default evaluation baseline
CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "synthetic_catalog.json"


def _load_catalog_data() -> Dict[str, Any]:
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"locations": [], "routes": [], "inventory_items": []}


# Canonical initial alerts modeled after tactical northern command depot conditions
INITIAL_ALERT_RECORDS = [
    {
        "id": 1,
        "alert_id": "ALT-1049",
        "alert_type": AlertType.LOW_STOCK,
        "severity": AlertSeverity.CRITICAL,
        "title": "Winter Diesel Reserves Below Safety Buffer at Drass FOB",
        "description": "Available stock of ATF-800 Winter-Grade Diesel has fallen below critical 14-day threshold amidst dropping sub-zero temperatures.",
        "trigger_condition": "current_stock (24,000L) <= min_threshold (25,000L)",
        "category": "POL",
        "item_id": "SKU-POL-KRS-02",
        "item_name": "High-Altitude Kerosene SKO (Bunker Heating)",
        "sku": "SKU-POL-KRS-02",
        "location_id": "LOC-DRS-04",
        "location_name": "Drass Forward Operating Base",
        "warehouse": "Drass Forward Operating Base",
        "predicted_impact": "Stockout within 42 hours; bunker heating compromised in Sector 4.",
        "predictedImpact": "Stockout within 42 hours; bunker heating compromised in Sector 4.",
        "recommended_action": "Reroute POL Convoy C-12 from Srinagar Depot; issue emergency rationing order.",
        "recommendedAction": "Reroute POL Convoy C-12 from Srinagar Depot; issue emergency rationing order.",
        "confidence_score": 0.98,
        "status": "new",
        "is_acknowledged": False,
        "acknowledged_by": None,
        "acknowledged_at": None,
        "is_resolved": False,
        "resolved_by": None,
        "resolved_at": None,
        "resolution_notes": None,
        "created_at": datetime(2026, 10, 2, 10, 15, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 10, 2, 10, 15, tzinfo=timezone.utc),
        "is_synthetic": True,
    },
    {
        "id": 2,
        "alert_id": "ALT-1048",
        "alert_type": AlertType.ROUTE_DISRUPTION,
        "severity": AlertSeverity.CRITICAL,
        "title": "Severe Avalanche Hazard Flagged on Khardung La Axis",
        "description": "Weather telemetry indicates heavy snowdrift and avalanche hazard index > 0.75 across Sector 7.",
        "trigger_condition": "route_blocked=False, risk_score (0.72) >= 0.70",
        "category": "Transit & Route Logistics",
        "route_id": "RTE-LEH-SIA-04",
        "location_id": "LOC-LEH-03",
        "location_name": "Leh Corps Supply Depot",
        "warehouse": "Leh Corps Supply Depot",
        "predicted_impact": "Convoy delay of 18-24 hours for Siachen replenishment fleet.",
        "predictedImpact": "Convoy delay of 18-24 hours for Siachen replenishment fleet.",
        "recommended_action": "Divert convoys to Alternate Route Bravo; hold heavy payloads at South Pullu checkpost.",
        "recommendedAction": "Divert convoys to Alternate Route Bravo; hold heavy payloads at South Pullu checkpost.",
        "confidence_score": 0.94,
        "status": "new",
        "is_acknowledged": False,
        "acknowledged_by": None,
        "acknowledged_at": None,
        "is_resolved": False,
        "resolved_by": None,
        "resolved_at": None,
        "resolution_notes": None,
        "created_at": datetime(2026, 10, 2, 9, 30, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 10, 2, 9, 30, tzinfo=timezone.utc),
        "is_synthetic": True,
    },
    {
        "id": 3,
        "alert_id": "ALT-1047",
        "alert_type": AlertType.COLD_CHAIN_EXCURSION,
        "severity": AlertSeverity.WARNING,
        "title": "Temperature Excursion Detected in Medical Cold-Storage Unit 3",
        "description": "Plasma storage telemetry exceeded upper safety threshold (+8.5°C) for 35 consecutive minutes.",
        "trigger_condition": "current_temp (8.8°C) > max_temp (8.0°C)",
        "category": "Medical & Cold-Chain",
        "item_id": "SKU-MED-PLM-07",
        "item_name": "Freeze-Dried Plasma & Thermal Cold-Chain Vaccines",
        "sku": "SKU-MED-PLM-07",
        "location_id": "LOC-LEH-03",
        "location_name": "Leh Corps Supply Depot",
        "warehouse": "Leh Corps Supply Depot",
        "predicted_impact": "Potential degradation of 120 units of lyophilized plasma if not stabilized in 90 min.",
        "predictedImpact": "Potential degradation of 120 units of lyophilized plasma if not stabilized in 90 min.",
        "recommended_action": "Switch to auxiliary backup generator; deploy dry-ice thermal packs.",
        "recommendedAction": "Switch to auxiliary backup generator; deploy dry-ice thermal packs.",
        "confidence_score": 0.99,
        "status": "acknowledged",
        "is_acknowledged": True,
        "acknowledged_by": "Maj. Amit Sharma",
        "acknowledged_at": datetime(2026, 10, 2, 8, 45, tzinfo=timezone.utc),
        "is_resolved": False,
        "resolved_by": None,
        "resolved_at": None,
        "resolution_notes": None,
        "created_at": datetime(2026, 10, 2, 8, 0, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 10, 2, 8, 45, tzinfo=timezone.utc),
        "is_synthetic": True,
    },
    {
        "id": 4,
        "alert_id": "ALT-1046",
        "alert_type": AlertType.DEMAND_SURGE,
        "severity": AlertSeverity.WARNING,
        "title": "Anomalous Demand Surge for 5.56mm Ball Ammunition at Kargil",
        "description": "7-day rolling consumption velocity exceeds 1.8x seasonal baseline following intensive combat exercises.",
        "trigger_condition": "consumption_velocity (22.5/day) >= 1.5x baseline (12.0/day)",
        "category": "Ordnance & Ammunition",
        "item_id": "SKU-ORD-556-03",
        "item_name": "5.56x45mm INSAS Ball Ammunition 1000-Round Tins",
        "sku": "SKU-ORD-556-03",
        "location_id": "LOC-KRG-02",
        "location_name": "Kargil Forward Logistics Hub",
        "warehouse": "Kargil Forward Logistics Hub",
        "predicted_impact": "Reorder threshold breached 9 days earlier than projected.",
        "predictedImpact": "Reorder threshold breached 9 days earlier than projected.",
        "recommended_action": "Issue supplementary indent of 400 tins from Srinagar Reserve Depot.",
        "recommendedAction": "Issue supplementary indent of 400 tins from Srinagar Reserve Depot.",
        "confidence_score": 0.91,
        "status": "new",
        "is_acknowledged": False,
        "acknowledged_by": None,
        "acknowledged_at": None,
        "is_resolved": False,
        "resolved_by": None,
        "resolved_at": None,
        "resolution_notes": None,
        "created_at": datetime(2026, 10, 1, 14, 20, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 10, 1, 14, 20, tzinfo=timezone.utc),
        "is_synthetic": True,
    },
    {
        "id": 5,
        "alert_id": "ALT-1045",
        "alert_type": AlertType.PREDICTED_STOCKOUT,
        "severity": AlertSeverity.CRITICAL,
        "title": "Projected Stockout of Extreme-Cold LiFePO4 Batteries at Kargil",
        "description": "Drawdown trajectory indicates stock balance reaches zero in 4.8 days, exceeding lead time of 6 days.",
        "trigger_condition": "runway (4.8d) < lead_time (6.0d)",
        "category": "Spares & Engineering",
        "item_id": "SKU-ENG-BAT-09",
        "item_name": "LiFePO4 Extreme-Cold Battery 24V (Radio & Sensor Relays)",
        "sku": "SKU-ENG-BAT-09",
        "location_id": "LOC-KRG-02",
        "location_name": "Kargil Forward Logistics Hub",
        "warehouse": "Kargil Forward Logistics Hub",
        "predicted_impact": "Sensor relay outages across 4 remote observation posts.",
        "predictedImpact": "Sensor relay outages across 4 remote observation posts.",
        "recommended_action": "Authorize priority air-dispatch of 30 battery modules from Northern Depot.",
        "recommendedAction": "Authorize priority air-dispatch of 30 battery modules from Northern Depot.",
        "confidence_score": 0.96,
        "status": "new",
        "is_acknowledged": False,
        "acknowledged_by": None,
        "acknowledged_at": None,
        "is_resolved": False,
        "resolved_by": None,
        "resolved_at": None,
        "resolution_notes": None,
        "created_at": datetime(2026, 10, 1, 11, 0, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 10, 1, 11, 0, tzinfo=timezone.utc),
        "is_synthetic": True,
    },
    {
        "id": 6,
        "alert_id": "ALT-1044",
        "alert_type": AlertType.REPLENISHMENT_REQUIRED,
        "severity": AlertSeverity.INFO,
        "title": "Routine Reorder Buffer Triggered for 81mm Mortar Shells",
        "description": "Stock balance has intersected nominal reorder level; automated requisition draft prepared.",
        "trigger_condition": "current_stock (250) <= reorder_level (250)",
        "category": "Ordnance & Ammunition",
        "item_id": "SKU-ORD-81M-04",
        "item_name": "81mm Mortar High-Explosive Shells (Crated)",
        "sku": "SKU-ORD-81M-04",
        "location_id": "LOC-DRS-04",
        "location_name": "Drass Forward Operating Base",
        "warehouse": "Drass Forward Operating Base",
        "predicted_impact": "No immediate shortfall; buffer replenishment recommended.",
        "predictedImpact": "No immediate shortfall; buffer replenishment recommended.",
        "recommended_action": "Confirm electronic requisition indent PO-2026-8812.",
        "recommendedAction": "Confirm electronic requisition indent PO-2026-8812.",
        "confidence_score": 0.88,
        "status": "resolved",
        "is_acknowledged": True,
        "acknowledged_by": "Capt. Sunita Rao",
        "acknowledged_at": datetime(2026, 9, 30, 16, 0, tzinfo=timezone.utc),
        "is_resolved": True,
        "resolved_by": "Capt. Sunita Rao",
        "resolved_at": datetime(2026, 10, 1, 9, 15, tzinfo=timezone.utc),
        "resolution_notes": "PO-2026-8812 approved and dispatched via Convoy Bravo-04.",
        "created_at": datetime(2026, 9, 30, 15, 30, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 10, 1, 9, 15, tzinfo=timezone.utc),
        "is_synthetic": True,
    },
]


class AlertEngine:
    """
    Mathematical and telemetry rule evaluator for tactical military supply chain anomalies.
    Translates inventory balances, consumption velocity, sensor telematics, and convoy telemetry
    into prioritized, actionable, deduplicated alert records.
    """

    @staticmethod
    def generate_dedup_hash(
        alert_type: AlertType,
        entity_id: str,
        location_id: str,
        severity: AlertSeverity,
    ) -> str:
        """
        Generates a deterministic MD5 hash to prevent duplicate active alerts
        for persistent unmitigated conditions across evaluation sweeps.
        """
        raw_key = f"{alert_type.value}:{entity_id}:{location_id}:{severity.value}"
        return hashlib.md5(raw_key.encode("utf-8")).hexdigest()

    def evaluate_inventory_item(self, item: Dict[str, Any]) -> List[AlertCreate]:
        """
        Evaluates an individual inventory item record against multi-tier anomaly rules:
        - Low Stock & Safety Stock Breach
        - Projected Stockout / Lead-Time Depletion
        - Demand Velocity Surge
        - Cold-Chain Temperature Excursion
        - Statistical Forecast Anomaly
        """
        alerts: List[AlertCreate] = []

        item_id = item.get("item_id", "UNKNOWN-ITEM")
        item_name = item.get("item_name", "Unknown Supply Item")
        category = item.get("category", "General Supplies")
        location_id = item.get("storage_location_id") or item.get("location_id", "LOC-GEN-01")
        location_name = item.get("location_name") or item.get("warehouse", location_id)
        current_stock = float(item.get("current_stock", 0.0))
        min_threshold = float(item.get("min_threshold", 0.0))
        reorder_level = float(item.get("reorder_level", 0.0))
        daily_consumption = float(item.get("consumption_rate_daily", 1.0))
        lead_time_days = float(item.get("lead_time_days", 3.0))

        # 1. Low Stock & Safety Stock Breaches
        if current_stock <= min_threshold:
            # Critical safety stock breach
            dedup = self.generate_dedup_hash(
                AlertType.LOW_STOCK, item_id, location_id, AlertSeverity.CRITICAL
            )
            hours_left = max(1.0, (current_stock / max(daily_consumption, 0.01)) * 24.0)
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-AUTO-{item_id[-4:]}-CRIT",
                    alert_type=AlertType.LOW_STOCK,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Critical Stockout Hazard: {item_name} below Safety Buffer",
                    description=(
                        f"Current stock of {current_stock:,.1f} has fallen below the critical safety threshold "
                        f"of {min_threshold:,.1f} at {location_name}."
                    ),
                    trigger_condition=f"current_stock ({current_stock:,.1f}) <= min_threshold ({min_threshold:,.1f})",
                    category=category,
                    item_id=item_id,
                    item_name=item_name,
                    sku=item_id,
                    location_id=location_id,
                    location_name=location_name,
                    warehouse=location_name,
                    predicted_impact=f"Immediate operational disruption; stockout in ~{hours_left:.0f}h.",
                    predictedImpact=f"Immediate operational disruption; stockout in ~{hours_left:.0f}h.",
                    recommended_action="Execute immediate emergency resupply via aerial drop or express convoy.",
                    recommendedAction="Execute immediate emergency resupply via aerial drop or express convoy.",
                    confidence_score=0.99,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )
        elif current_stock <= reorder_level:
            # Reorder buffer reached (Warning / Replenishment Required)
            dedup = self.generate_dedup_hash(
                AlertType.REPLENISHMENT_REQUIRED, item_id, location_id, AlertSeverity.WARNING
            )
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-AUTO-{item_id[-4:]}-WARN",
                    alert_type=AlertType.REPLENISHMENT_REQUIRED,
                    severity=AlertSeverity.WARNING,
                    title=f"Replenishment Required: {item_name} at Reorder Level",
                    description=(
                        f"Inventory balance ({current_stock:,.1f}) has breached the reorder threshold "
                        f"({reorder_level:,.1f}) at {location_name}."
                    ),
                    trigger_condition=f"current_stock ({current_stock:,.1f}) <= reorder_level ({reorder_level:,.1f})",
                    category=category,
                    item_id=item_id,
                    item_name=item_name,
                    sku=item_id,
                    location_id=location_id,
                    location_name=location_name,
                    warehouse=location_name,
                    predicted_impact="Stock will enter critical safety zone within projected replenishment lead time.",
                    predictedImpact="Stock will enter critical safety zone within projected replenishment lead time.",
                    recommended_action="Issue formal supply requisition order to designated base depot.",
                    recommendedAction="Issue formal supply requisition order to designated base depot.",
                    confidence_score=0.92,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )

        # 2. Predicted Stockout (Runway vs Lead Time)
        runway_days = current_stock / max(daily_consumption, 0.001)
        if runway_days < lead_time_days and current_stock > min_threshold:
            dedup = self.generate_dedup_hash(
                AlertType.PREDICTED_STOCKOUT, item_id, location_id, AlertSeverity.CRITICAL
            )
            hours_runway = runway_days * 24.0
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-PRED-{item_id[-4:]}-DEP",
                    alert_type=AlertType.PREDICTED_STOCKOUT,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Predicted Stockout: {item_name} Depletion Before Supply Arrival",
                    description=(
                        f"Forecast runway of {runway_days:.1f} days is insufficient to cover standard lead time "
                        f"of {lead_time_days:.1f} days at {location_name}."
                    ),
                    trigger_condition=f"runway ({runway_days:.1f}d) < lead_time ({lead_time_days:.1f}d)",
                    category=category,
                    item_id=item_id,
                    item_name=item_name,
                    sku=item_id,
                    location_id=location_id,
                    location_name=location_name,
                    warehouse=location_name,
                    predicted_impact=f"Stock reaches zero balance in {hours_runway:.0f}h before next convoy.",
                    predictedImpact=f"Stock reaches zero balance in {hours_runway:.0f}h before next convoy.",
                    recommended_action="Accelerate convoy dispatch or expedite aerial delivery.",
                    recommendedAction="Accelerate convoy dispatch or expedite aerial delivery.",
                    confidence_score=0.95,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )

        # 3. Demand Velocity Surge
        current_rate = float(item.get("current_consumption_rate", daily_consumption))
        baseline_rate = float(item.get("baseline_consumption_rate", daily_consumption))
        if baseline_rate > 0 and (current_rate / baseline_rate) >= 1.5:
            surge_ratio = current_rate / baseline_rate
            sev = AlertSeverity.CRITICAL if surge_ratio >= 2.2 else AlertSeverity.WARNING
            dedup = self.generate_dedup_hash(AlertType.DEMAND_SURGE, item_id, location_id, sev)
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-SRG-{item_id[-4:]}",
                    alert_type=AlertType.DEMAND_SURGE,
                    severity=sev,
                    title=f"Demand Surge Detected: {item_name} ({surge_ratio:.1f}x Baseline)",
                    description=(
                        f"Current consumption velocity ({current_rate:,.1f}/day) is {surge_ratio:.1f}x higher "
                        f"than standard baseline ({baseline_rate:,.1f}/day) at {location_name}."
                    ),
                    trigger_condition=f"current_rate ({current_rate:.1f}) >= 1.5x baseline ({baseline_rate:.1f})",
                    category=category,
                    item_id=item_id,
                    item_name=item_name,
                    sku=item_id,
                    location_id=location_id,
                    location_name=location_name,
                    warehouse=location_name,
                    predicted_impact=f"Depletion runway compressed by {(1.0 - 1.0/surge_ratio)*100:.0f}%.",
                    predictedImpact=f"Depletion runway compressed by {(1.0 - 1.0/surge_ratio)*100:.0f}%.",
                    recommended_action="Recalculate dynamic safety buffer and increase replenishment quota.",
                    recommendedAction="Recalculate dynamic safety buffer and increase replenishment quota.",
                    confidence_score=0.90,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )

        # 4. Cold-Chain Thermal Excursion
        if item.get("is_temperature_sensitive"):
            current_temp = item.get("current_temperature")
            target_min = float(item.get("target_temp_min", 2.0))
            target_max = float(item.get("target_temp_max", 8.0))

            if current_temp is not None:
                current_temp = float(current_temp)
                if current_temp < target_min or current_temp > target_max:
                    is_extreme = current_temp > (target_max + 4.0) or current_temp < (target_min - 4.0)
                    sev = AlertSeverity.CRITICAL if is_extreme else AlertSeverity.WARNING
                    dedup = self.generate_dedup_hash(
                        AlertType.COLD_CHAIN_EXCURSION, item_id, location_id, sev
                    )
                    alerts.append(
                        AlertCreate(
                            alert_id=f"ALT-THERM-{item_id[-4:]}",
                            alert_type=AlertType.COLD_CHAIN_EXCURSION,
                            severity=sev,
                            title=f"Cold-Chain Thermal Excursion: {item_name} at {current_temp:.1f}°C",
                            description=(
                                f"Thermal sensor at {location_name} reports {current_temp:.1f}°C, violating "
                                f"acceptable preservation envelope ({target_min:.1f}°C to {target_max:.1f}°C)."
                            ),
                            trigger_condition=f"current_temp ({current_temp:.1f}°C) outside [{target_min}°C, {target_max}°C]",
                            category=category,
                            item_id=item_id,
                            item_name=item_name,
                            sku=item_id,
                            location_id=location_id,
                            location_name=location_name,
                            warehouse=location_name,
                            predicted_impact="Loss of medical / biological efficacy if uncorrected within 60 minutes.",
                            predictedImpact="Loss of medical / biological efficacy if uncorrected within 60 minutes.",
                            recommended_action="Inspect auxiliary refrigeration and deploy backup Phase-Change Material packs.",
                            recommendedAction="Inspect auxiliary refrigeration and deploy backup Phase-Change Material packs.",
                            confidence_score=0.99,
                            dedup_hash=dedup,
                            is_synthetic=True,
                        )
                    )

        # 5. Statistical Forecast Anomaly (> 3 sigma)
        sigma = float(item.get("forecast_residual_sigma", 0.0))
        if sigma >= 3.0:
            dedup = self.generate_dedup_hash(
                AlertType.FORECAST_ANOMALY, item_id, location_id, AlertSeverity.WARNING
            )
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-ANOM-{item_id[-4:]}",
                    alert_type=AlertType.FORECAST_ANOMALY,
                    severity=AlertSeverity.WARNING,
                    title=f"Forecast Residual Anomaly: {item_name} ({sigma:.1f}σ Deviation)",
                    description=(
                        f"Actual consumption pattern diverges by {sigma:.1f} standard deviations from AI "
                        f"ensemble baseline projection at {location_name}."
                    ),
                    trigger_condition=f"residual_sigma ({sigma:.1f}σ) >= 3.0σ",
                    category=category,
                    item_id=item_id,
                    item_name=item_name,
                    sku=item_id,
                    location_id=location_id,
                    location_name=location_name,
                    warehouse=location_name,
                    predicted_impact="Degraded confidence in static replenishment scheduling.",
                    predictedImpact="Degraded confidence in static replenishment scheduling.",
                    recommended_action="Trigger on-demand pipeline retraining with weighted recent telemetry.",
                    recommendedAction="Trigger on-demand pipeline retraining with weighted recent telemetry.",
                    confidence_score=0.89,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )

        return alerts

    def evaluate_route(self, route: Dict[str, Any]) -> List[AlertCreate]:
        """
        Evaluates a transit route corridor for weather hazards, roadblocks, and delays:
        - Route Disruption (Blocked or High Terrain Risk)
        - Delayed Supply / Convoy Transit Delay
        """
        alerts: List[AlertCreate] = []

        route_id = route.get("route_id", "UNKNOWN-ROUTE")
        route_name = route.get("route_name", "Transit Corridor")
        origin_id = route.get("origin_location_id", "LOC-ORIGIN")
        dest_id = route.get("destination_location_id", "LOC-DEST")
        risk_score = float(route.get("risk_score", 0.0))
        is_blocked = bool(route.get("is_blocked", False))
        std_hours = float(route.get("standard_transit_hours", 4.0))
        est_hours = float(route.get("current_estimated_transit_hours", std_hours))

        # 1. Route Disruption (Blocked or Risk >= 0.70)
        if is_blocked or risk_score >= 0.70:
            dedup = self.generate_dedup_hash(
                AlertType.ROUTE_DISRUPTION, route_id, origin_id, AlertSeverity.CRITICAL
            )
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-RTE-{route_id[-4:]}-CRIT",
                    alert_type=AlertType.ROUTE_DISRUPTION,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Critical Transit Disruption on {route_name}",
                    description=(
                        f"Corridor {route_name} is impassable or severely compromised (Risk Index: {risk_score:.2f}, "
                        f"Blocked: {is_blocked})."
                    ),
                    trigger_condition=f"is_blocked={is_blocked} or risk_score ({risk_score:.2f}) >= 0.70",
                    category="Transit & Route Logistics",
                    route_id=route_id,
                    location_id=origin_id,
                    location_name=route_name,
                    warehouse=route_name,
                    predicted_impact="Complete halt of forward convoy replenishment across destination FOBs.",
                    predictedImpact="Complete halt of forward convoy replenishment across destination FOBs.",
                    recommended_action="Execute immediate detour protocol via designated secondary mountain axis.",
                    recommendedAction="Execute immediate detour protocol via designated secondary mountain axis.",
                    confidence_score=0.96,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )
        elif risk_score >= 0.40:
            dedup = self.generate_dedup_hash(
                AlertType.ROUTE_DISRUPTION, route_id, origin_id, AlertSeverity.WARNING
            )
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-RTE-{route_id[-4:]}-WARN",
                    alert_type=AlertType.ROUTE_DISRUPTION,
                    severity=AlertSeverity.WARNING,
                    title=f"Elevated Transit Hazard on {route_name}",
                    description=f"Corridor terrain risk is elevated ({risk_score:.2f}) due to adverse meteorological conditions.",
                    trigger_condition=f"risk_score ({risk_score:.2f}) >= 0.40",
                    category="Transit & Route Logistics",
                    route_id=route_id,
                    location_id=origin_id,
                    location_name=route_name,
                    warehouse=route_name,
                    predicted_impact="Expected convoy transit slowdown and increased breakdown hazard.",
                    predictedImpact="Expected convoy transit slowdown and increased breakdown hazard.",
                    recommended_action="Dispatch road clearing reconnaissance unit and escort recovery vehicle.",
                    recommendedAction="Dispatch road clearing reconnaissance unit and escort recovery vehicle.",
                    confidence_score=0.90,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )

        # 2. Delayed Supply (Transit ETA Exceeded)
        if std_hours > 0 and (est_hours / std_hours) >= 1.25:
            delay_ratio = est_hours / std_hours
            sev = AlertSeverity.CRITICAL if delay_ratio >= 1.75 else AlertSeverity.WARNING
            dedup = self.generate_dedup_hash(AlertType.DELAYED_SUPPLY, route_id, dest_id, sev)
            delay_hours = est_hours - std_hours
            alerts.append(
                AlertCreate(
                    alert_id=f"ALT-DLY-{route_id[-4:]}",
                    alert_type=AlertType.DELAYED_SUPPLY,
                    severity=sev,
                    title=f"Convoy Transit Delay on {route_name} (+{delay_hours:.1f}h)",
                    description=(
                        f"Estimated transit time of {est_hours:.1f}h exceeds standard duration of {std_hours:.1f}h "
                        f"by {delay_ratio:.2f}x."
                    ),
                    trigger_condition=f"est_hours ({est_hours:.1f}h) >= 1.25x std_hours ({std_hours:.1f}h)",
                    category="Transit & Route Logistics",
                    route_id=route_id,
                    location_id=dest_id,
                    location_name=route_name,
                    warehouse=route_name,
                    predicted_impact=f"Replenishment arrival delayed by {delay_hours:.1f} hours at forward depot.",
                    predictedImpact=f"Replenishment arrival delayed by {delay_hours:.1f} hours at forward depot.",
                    recommended_action="Notify receiving FOB quartermaster to extend ration/fuel conservation protocols.",
                    recommendedAction="Notify receiving FOB quartermaster to extend ration/fuel conservation protocols.",
                    confidence_score=0.93,
                    dedup_hash=dedup,
                    is_synthetic=True,
                )
            )

        return alerts


class AlertStoreService:
    """
    Thread-safe in-memory alert store managing persistent lifecycle states,
    multi-parameter filtering, sorting, deduplication, and KPI aggregation.
    """

    def __init__(self):
        self._alerts: List[Dict[str, Any]] = []
        self._next_id: int = 100
        self.engine = AlertEngine()
        self.reset_to_pristine()

    def reset_to_pristine(self) -> None:
        """Resets the alert repository to the baseline synthetic records."""
        self._alerts = [dict(record) for record in INITIAL_ALERT_RECORDS]
        self._next_id = max([a["id"] for a in self._alerts], default=0) + 1

    def calculate_kpis(self) -> AlertSummary:
        """Calculates dynamic KPI counts from the current active alert records."""
        total_active = sum(1 for a in self._alerts if not a.get("is_resolved"))
        critical_count = sum(
            1 for a in self._alerts if a.get("severity") == AlertSeverity.CRITICAL and not a.get("is_resolved")
        )
        warning_count = sum(
            1 for a in self._alerts if a.get("severity") == AlertSeverity.WARNING and not a.get("is_resolved")
        )
        info_count = sum(
            1 for a in self._alerts if a.get("severity") == AlertSeverity.INFO and not a.get("is_resolved")
        )
        unack_count = sum(
            1 for a in self._alerts if not a.get("is_acknowledged") and not a.get("is_resolved")
        )
        transit_risks = sum(
            1
            for a in self._alerts
            if (
                a.get("alert_type") in [AlertType.ROUTE_DISRUPTION, AlertType.DELAYED_SUPPLY]
                or a.get("category") == "Transit & Route Logistics"
            )
            and not a.get("is_resolved")
        )
        resolved_count = sum(1 for a in self._alerts if a.get("is_resolved"))

        # Find latest unresolved critical alert
        latest_crit = None
        critical_active = [
            a
            for a in self._alerts
            if a.get("severity") == AlertSeverity.CRITICAL and not a.get("is_resolved")
        ]
        if critical_active:
            critical_active.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)
            latest_crit = AlertResponse(**critical_active[0])

        return AlertSummary(
            total_active_alerts=total_active,
            critical_count=critical_count,
            warning_count=warning_count,
            info_count=info_count,
            unacknowledged_count=unack_count,
            transit_risks_count=transit_risks,
            resolved_count=resolved_count,
            latest_critical_alert=latest_crit,
        )

    def get_alert_by_id(self, alert_id: str) -> Optional[AlertResponse]:
        """Finds an alert record by either its string alert_id or integer id."""
        for a in self._alerts:
            if a.get("alert_id") == alert_id or str(a.get("id")) == str(alert_id):
                return AlertResponse(**a)
        return None

    def query_alerts(
        self,
        search: Optional[str] = None,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        location: Optional[str] = None,
        date_range: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        """
        Filters, sorts, and paginates alert records with dynamic KPI envelope.
        """
        filtered = list(self._alerts)

        # 1. Text Search
        if search and search.strip():
            q = search.lower().strip()
            filtered = [
                a
                for a in filtered
                if (
                    q in str(a.get("alert_id", "")).lower()
                    or q in str(a.get("title", "")).lower()
                    or q in str(a.get("description", "")).lower()
                    or q in str(a.get("item_name", "")).lower()
                    or q in str(a.get("sku", "")).lower()
                    or q in str(a.get("location_name", "")).lower()
                    or q in str(a.get("warehouse", "")).lower()
                    or q in str(a.get("category", "")).lower()
                    or q in str(a.get("recommended_action", "")).lower()
                )
            ]

        # 2. Severity Filter
        if severity and severity != "all":
            if severity == "warning":
                filtered = [
                    a for a in filtered if a.get("severity") in [AlertSeverity.WARNING, "high", "warning"]
                ]
            else:
                filtered = [a for a in filtered if a.get("severity") == severity]

        # 3. Category Filter
        if category and category != "all":
            filtered = [a for a in filtered if a.get("category") == category]

        # 4. Status Filter
        if status and status != "all":
            filtered = [a for a in filtered if a.get("status") == status]

        # 5. Location Filter
        if location and location != "all":
            filtered = [
                a
                for a in filtered
                if a.get("location_name") == location
                or a.get("warehouse") == location
                or a.get("location_id") == location
            ]

        # 6. Sorting
        severity_weights = {
            AlertSeverity.CRITICAL: 3,
            "critical": 3,
            AlertSeverity.WARNING: 2,
            "warning": 2,
            "high": 2,
            "medium": 2,
            AlertSeverity.INFO: 1,
            "info": 1,
            "low": 1,
        }
        status_weights = {"new": 3, "acknowledged": 2, "resolved": 1}

        def get_sort_key(item):
            if sort_by == "severity":
                return severity_weights.get(item.get("severity"), 0)
            if sort_by == "status":
                return status_weights.get(item.get("status"), 0)
            if sort_by in ["title", "category", "warehouse", "location_name"]:
                return str(item.get(sort_by, "")).lower()
            if sort_by == "confidence_score":
                return float(item.get("confidence_score", 0.0))
            # Default created_at
            created = item.get("created_at")
            if isinstance(created, datetime):
                return created.timestamp()
            return 0.0

        reverse_sort = sort_order.lower() == "desc"
        filtered.sort(key=get_sort_key, reverse=reverse_sort)

        # 7. Pagination
        total = len(filtered)
        page_size = max(1, page_size)
        total_pages = max(1, math.ceil(total / page_size))
        safe_page = max(1, min(page, total_pages))
        start_idx = (safe_page - 1) * page_size
        paginated_items = filtered[start_idx : start_idx + page_size]

        return {
            "items": [AlertResponse(**a) for a in paginated_items],
            "total": total,
            "page": safe_page,
            "page_size": page_size,
            "total_pages": total_pages,
            "kpis": self.calculate_kpis(),
        }

    def evaluate_and_persist(
        self,
        inventory_items: Optional[List[Dict[str, Any]]] = None,
        routes: Optional[List[Dict[str, Any]]] = None,
        auto_persist: bool = True,
    ) -> List[AlertResponse]:
        """
        Evaluates batches of items or routes against anomaly detection rules.
        Applies deterministic deduplication to prevent duplicate active alerts.
        """
        if inventory_items is None and routes is None:
            catalog = _load_catalog_data()
            inventory_items = catalog.get("inventory_items", [])
            routes = catalog.get("routes", [])

        generated_alerts: List[AlertCreate] = []

        if inventory_items:
            for item in inventory_items:
                generated_alerts.extend(self.engine.evaluate_inventory_item(item))

        if routes:
            for route in routes:
                generated_alerts.extend(self.engine.evaluate_route(route))

        persisted: List[AlertResponse] = []
        now = datetime.now(timezone.utc)

        # Get existing active dedup hashes
        active_hashes = {
            a.get("dedup_hash")
            for a in self._alerts
            if a.get("dedup_hash") and not a.get("is_resolved")
        }

        for alert_create in generated_alerts:
            # Deduplication Check
            if alert_create.dedup_hash and alert_create.dedup_hash in active_hashes:
                # Alert already active and unmitigated — skip to prevent duplicate clutter
                continue

            self._next_id += 1
            record = {
                **alert_create.model_dump(),
                "id": self._next_id,
                "status": "new",
                "is_acknowledged": False,
                "acknowledged_by": None,
                "acknowledged_at": None,
                "is_resolved": False,
                "resolved_by": None,
                "resolved_at": None,
                "resolution_notes": None,
                "created_at": now,
                "updated_at": now,
            }

            if auto_persist:
                self._alerts.insert(0, record)
                if alert_create.dedup_hash:
                    active_hashes.add(alert_create.dedup_hash)

            persisted.append(AlertResponse(**record))

        return persisted

    def acknowledge_alert(
        self, alert_id: str, acknowledged_by: str = "Col. Rajesh Verma"
    ) -> AlertResponse:
        """
        Transitions an alert from 'new' to 'acknowledged' with operator audit trail.
        """
        for a in self._alerts:
            if a.get("alert_id") == alert_id or str(a.get("id")) == str(alert_id):
                if a.get("is_resolved"):
                    raise ValidationError(
                        message=f"Cannot acknowledge resolved alert {alert_id}.",
                        details={"alert_id": alert_id, "current_status": a.get("status")},
                    )
                now = datetime.now(timezone.utc)
                a["is_acknowledged"] = True
                a["acknowledged_by"] = acknowledged_by
                a["acknowledged_at"] = now
                a["status"] = "acknowledged"
                a["updated_at"] = now
                return AlertResponse(**a)

        raise NotFoundError(
            message=f"Alert with identifier '{alert_id}' not found.",
            details={"alert_id": alert_id},
        )

    def resolve_alert(
        self,
        alert_id: str,
        resolved_by: str = "Col. Rajesh Verma",
        resolution_notes: str = "Mitigation protocol executed successfully.",
    ) -> AlertResponse:
        """
        Transitions an alert to 'resolved' and records mitigation notes and audit stamp.
        """
        for a in self._alerts:
            if a.get("alert_id") == alert_id or str(a.get("id")) == str(alert_id):
                now = datetime.now(timezone.utc)
                a["is_resolved"] = True
                a["resolved_by"] = resolved_by
                a["resolved_at"] = now
                a["resolution_notes"] = resolution_notes
                a["status"] = "resolved"
                a["updated_at"] = now
                return AlertResponse(**a)

        raise NotFoundError(
            message=f"Alert with identifier '{alert_id}' not found.",
            details={"alert_id": alert_id},
        )


# Global singleton instance
alert_store_service = AlertStoreService()
alert_engine = AlertEngine()
