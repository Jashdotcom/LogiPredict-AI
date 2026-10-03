"""
LogiPredict AI - Logistics Simulation Service
=============================================
Discrete-event & stochastic simulation engine for forward military logistics.
Evaluates supply chain resilience under weather disruptions, mountain pass closures,
operational surges, supplier lead time dilations, and corridor blockades.

Indian Army Forward Supply Chain (SIH 2026)
"""

import copy
import math
import time
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from app.schemas.simulation import (
    DisruptionScenarioType,
    DisruptionScenario,
    InitialStockOverride,
    SimulationRequest,
    ProjectedStockPoint,
    StockoutEvent,
    ReplenishmentRecommendation,
    MetricComparisonPoint,
    BeforeVsAfterComparison,
    DailyTrajectoryPoint,
    SkuSimulationSummary,
    RouteImpactSummary,
    SimulationSummaryMetrics,
    PresetScenarioInfo,
    SimulationBaselineResponse,
    SimulationResultResponse,
)
from app.services.forecast_data import SKU_CATALOG, BASE_SIMULATION_DATE
from app.services.route_service import DEFAULT_LOCATIONS, DEFAULT_ROUTES, route_service
from app.utils.exceptions import NotFoundError, ValidationError


# ==============================================================================
# Pre-Configured Military Disruption Scenarios
# ==============================================================================

PRESET_SCENARIOS: List[PresetScenarioInfo] = [
    PresetScenarioInfo(
        id="SCN-WINTER-01",
        name="Severe Winter Blizzard (Zoji La Pass Closure)",
        category="Weather Disruption",
        description="Heavy snowfall and avalanche warnings sever NH-1D at Zoji La Pass (3,528m). Convoy transit halts, requiring bypass corridors and dilating supply delivery to Kargil and Leh by 6-10 days while winter POL fuel heating demands surge by +35%.",
        demand_surge_percentage=35.0,
        lead_time_dilation_days=8,
        inventory_change_percentage=0.0,
        route_disruption_preset="zoji_la_blizzard",
        severity="critical",
        lead_time_label="+8 Days (Zoji La Blocked)",
        demand_surge_label="+35% Winter POL Fuel",
        stockout_risk_label="High (Kargil & Drass)",
    ),
    PresetScenarioInfo(
        id="SCN-SURGE-02",
        name="High-Altitude Forward Reinforcement Surge",
        category="Operational Surge",
        description="Immediate brigade-level forward troop movement into eastern Ladakh and Siachen sectors. Ammunition consumption accelerates by +75%, combat rations by +60%, with emergency high-altitude medical demands up +40%.",
        demand_surge_percentage=65.0,
        lead_time_dilation_days=2,
        inventory_change_percentage=-15.0,
        route_disruption_preset=None,
        severity="warning",
        lead_time_label="+2 Days (Convoy Prioritization)",
        demand_surge_label="+65% Rations & Ammo",
        stockout_risk_label="Medium (Siachen & Pangong)",
    ),
    PresetScenarioInfo(
        id="SCN-LANDSLIDE-03",
        name="Khardung La Axis Avalanche & Rockfall Blockade",
        category="Corridor Cutoff",
        description="Catastrophic rockfall closes the direct Khardung La Pass (5,359m) corridor into Nubra Valley and Siachen Base Camp. Convoys must reroute via the unpaved Shyok canyon track, tripling transit times and risking supply exhaustion.",
        demand_surge_percentage=15.0,
        lead_time_dilation_days=12,
        inventory_change_percentage=-10.0,
        route_disruption_preset="khardung_la_landslide",
        severity="critical",
        lead_time_label="+12 Days (Corridor Cutoff)",
        demand_surge_label="+15% Safety Buffer",
        stockout_risk_label="Critical (Nubra & Siachen)",
    ),
    PresetScenarioInfo(
        id="SCN-DELAY-04",
        name="Rear Strategic Depot Supply Line Dilation",
        category="Supply Chain Bottleneck",
        description="National rail freight congestion and supplier bottlenecks delay manufacturer shipments from central ordnance factories to Udhampur Base Depot by 14 days, straining downstream forward FOB inventories.",
        demand_surge_percentage=10.0,
        lead_time_dilation_days=14,
        inventory_change_percentage=-25.0,
        route_disruption_preset=None,
        severity="warning",
        lead_time_label="+14 Days (Rear Rail Delay)",
        demand_surge_label="+10% Demand",
        stockout_risk_label="High (Depot Level)",
    ),
    PresetScenarioInfo(
        id="SCN-COLDCHAIN-05",
        name="High-Altitude Cold-Chain Generator Failure",
        category="Equipment Breakdown",
        description="Sub-zero generator power failure at forward medical bunkers impairs cold-chain storage for freeze-dried plasma, blood reserves, and temperature-sensitive biologicals, causing immediate 50% stock loss and emergency airlift demand.",
        demand_surge_percentage=45.0,
        lead_time_dilation_days=4,
        inventory_change_percentage=-50.0,
        route_disruption_preset=None,
        severity="critical",
        lead_time_label="+4 Days (Airlift Mobilization)",
        demand_surge_label="+45% Emergency Medical",
        stockout_risk_label="Critical (Medical FOBs)",
    ),
    PresetScenarioInfo(
        id="SCN-PEACETIME-00",
        name="Peacetime Nominal Operational Baseline",
        category="Peacetime Baseline",
        description="Routine peacetime operational conditions with all mountain passes open, standard lead times (3-5 days), nominal fuel consumption, and full convoy corridor availability.",
        demand_surge_percentage=0.0,
        lead_time_dilation_days=0,
        inventory_change_percentage=0.0,
        route_disruption_preset=None,
        severity="info",
        lead_time_label="Standard (0 Delay)",
        demand_surge_label="Nominal (+0%)",
        stockout_risk_label="Zero Risk",
    ),
]


class SimulationService:
    """
    Core Simulation Service managing baseline initialization, parameter validation,
    discrete-event inventory simulation, and before-versus-after comparative metrics.
    """

    def __init__(self):
        self._preset_scenarios: Dict[str, PresetScenarioInfo] = {
            s.id: s for s in PRESET_SCENARIOS
        }
        self._simulations_history: Dict[str, SimulationResultResponse] = {}

    # --------------------------------------------------------------------------
    # Baseline & Presets Accessors
    # --------------------------------------------------------------------------

    def get_preset_scenarios(self) -> List[PresetScenarioInfo]:
        """Return list of all pre-configured military disruption scenarios."""
        return list(self._preset_scenarios.values())

    def get_preset_scenario_by_id(self, scenario_id: str) -> PresetScenarioInfo:
        """Fetch a specific preset scenario by its ID."""
        preset = self._preset_scenarios.get(scenario_id)
        if not preset:
            raise NotFoundError(f"Preset scenario '{scenario_id}' not found.")
        return preset

    def get_baseline_info(self) -> SimulationBaselineResponse:
        """
        Calculate and return standard operational baseline metrics and defaults
        for the Simulation Workspace UI.
        """
        total_items = len(SKU_CATALOG)
        total_stock = sum(item["current_stock"] for item in SKU_CATALOG.values())
        total_daily_demand = sum(item["base_daily"] for item in SKU_CATALOG.values())
        avg_coverage_days = (
            round(total_stock / total_daily_demand, 1) if total_daily_demand > 0 else 0.0
        )

        sku_list = [
            {
                "item_id": sku["item_id"],
                "name": sku["name"],
                "category": sku["category"],
                "unit": sku["unit"],
                "current_stock": sku["current_stock"],
                "base_daily_demand": sku["base_daily"],
                "reorder_level": sku["reorder_level"],
                "min_threshold": sku["min_threshold"],
                "max_capacity": sku["max_capacity"],
            }
            for sku in SKU_CATALOG.values()
        ]

        loc_list = [
            {
                "location_id": loc["location_id"],
                "name": loc["name"],
                "location_type": loc["location_type"].value if hasattr(loc["location_type"], "value") else str(loc["location_type"]),
                "altitude_meters": loc["altitude_meters"],
                "total_capacity_metric_tonnes": loc["total_capacity_metric_tonnes"],
                "current_utilization_percentage": loc["current_utilization_percentage"],
            }
            for loc in DEFAULT_LOCATIONS
        ]

        route_list = [
            {
                "route_id": r["route_id"],
                "route_name": r["route_name"],
                "origin_location_id": r["origin_location_id"],
                "destination_location_id": r["destination_location_id"],
                "origin_name": r["origin_name"],
                "destination_name": r["destination_name"],
                "distance_km": r["distance_km"],
                "standard_transit_hours": r["standard_transit_hours"],
                "road_condition": r["road_condition"].value if hasattr(r["road_condition"], "value") else str(r["road_condition"]),
                "risk_score": r["risk_score"],
                "is_primary": r["is_primary"],
            }
            for r in DEFAULT_ROUTES
        ]

        baseline_metrics = {
            "total_skus": total_items,
            "total_initial_inventory": round(total_stock, 1),
            "total_daily_demand": round(total_daily_demand, 1),
            "average_coverage_days": avg_coverage_days,
            "standard_replenishment_lead_time_days": 4.0,
            "nominal_stockouts": 0,
            "active_routes_count": len(DEFAULT_ROUTES),
            "average_corridor_transit_hours": round(
                sum(r["standard_transit_hours"] for r in DEFAULT_ROUTES) / len(DEFAULT_ROUTES), 1
            ) if DEFAULT_ROUTES else 0.0,
        }

        default_parameters = {
            "simulation_name": "Tactical Forward Logistics Scenario",
            "duration_days": 30,
            "demand_surge_percentage": 0.0,
            "lead_time_dilation_days": 0,
            "inventory_change_percentage": 0.0,
            "selected_category": "All",
            "random_seed": 42,
        }

        return SimulationBaselineResponse(
            baseline_metrics=baseline_metrics,
            sku_catalog_summary=sku_list,
            locations_summary=loc_list,
            routes_summary=route_list,
            preset_scenarios=list(self._preset_scenarios.values()),
            default_parameters=default_parameters,
        )

    def get_simulation_by_id(self, simulation_id: str) -> SimulationResultResponse:
        """Retrieve a previous simulation execution record."""
        sim = self._simulations_history.get(simulation_id)
        if not sim:
            raise NotFoundError(f"Simulation run '{simulation_id}' not found.")
        return sim

    # --------------------------------------------------------------------------
    # Main Simulation Execution Engine
    # --------------------------------------------------------------------------

    def run_simulation(self, request: SimulationRequest) -> SimulationResultResponse:
        """
        Executes a deterministic, multi-factor forward logistics simulation:
        1. Applies demand shifts, supply delays, initial stock modifiers, and route disruptions.
        2. Simulates daily inventory drawdown, inflow replenishment, and buffer thresholds.
        3. Computes 7-dimension Before-Versus-After comparison matrices with zero-division protection.
        4. Synthesizes dynamic rule-based impact summaries and actionable AI recommendations.
        5. Preserves all master synthetic data intact without side-effects.
        """
        start_time = time.time()
        sim_id = f"SIM-{int(datetime.now(timezone.utc).timestamp())}"

        # 1. Resolve Scenario Preset overrides if preset specified
        if request.scenario_preset and request.scenario_preset in self._preset_scenarios:
            preset = self._preset_scenarios[request.scenario_preset]
            if request.demand_surge_percentage == 0.0 and preset.demand_surge_percentage != 0.0:
                request.demand_surge_percentage = preset.demand_surge_percentage
            if request.lead_time_dilation_days == 0 and preset.lead_time_dilation_days != 0:
                request.lead_time_dilation_days = preset.lead_time_dilation_days
            if request.inventory_change_percentage == 0.0 and preset.inventory_change_percentage != 0.0:
                request.inventory_change_percentage = preset.inventory_change_percentage
            if not request.route_disruption_preset and preset.route_disruption_preset:
                request.route_disruption_preset = preset.route_disruption_preset

        # 2. Filter target SKUs
        target_skus = self._filter_target_skus(request)
        if not target_skus:
            raise ValidationError("No matching SKUs found for the specified category or item IDs.")

        duration = max(7, min(180, request.duration_days))
        demand_mult = 1.0 + (request.demand_surge_percentage / 100.0)
        stock_init_mult = max(0.1, 1.0 + (request.inventory_change_percentage / 100.0))
        lead_time_dilation = max(0, request.lead_time_dilation_days)
        base_lead_time = 4  # Standard peacetime resupply lead time in days

        # Stock overrides map
        stock_overrides = {
            o.item_id: o.initial_stock for o in (request.initial_stock_overrides or [])
        }

        # 3. Simulate Daily Trajectories for each SKU
        sku_sim_results: Dict[str, Dict[str, Any]] = {}
        daily_baseline_demand_total = [0.0] * duration
        daily_simulated_demand_total = [0.0] * duration
        daily_baseline_stock_total = [0.0] * duration
        daily_simulated_stock_total = [0.0] * duration
        daily_safety_threshold_total = [0.0] * duration
        daily_unmet_demand_total = [0.0] * duration

        item_trajectories: Dict[str, List[ProjectedStockPoint]] = {}
        stockout_events: List[StockoutEvent] = []
        recommendations: List[ReplenishmentRecommendation] = []

        total_simulated_demand_vol = 0.0
        total_baseline_demand_vol = 0.0
        total_unmet_demand_vol = 0.0
        replenishment_orders_needed = 0
        baseline_orders_needed = 0

        # Pseudo-random generator for reproducible deterministic noise
        seed = request.random_seed
        prng = self._create_deterministic_prng(seed)

        for sku_id, sku in target_skus.items():
            base_daily = sku["base_daily"]
            nominal_init_stock = sku["current_stock"]
            safety_stock = sku["min_threshold"]
            reorder_level = sku["reorder_level"]
            category = sku["category"]
            unit = sku["unit"]

            # Initial stock for simulation
            if sku_id in stock_overrides:
                sim_init_stock = stock_overrides[sku_id]
            else:
                sim_init_stock = nominal_init_stock * stock_init_mult

            # Simulation State trackers
            base_stock = nominal_init_stock
            sim_stock = sim_init_stock
            trajectories: List[ProjectedStockPoint] = []

            # Inflow pipeline schedules: list of tuples (arrival_day, quantity)
            base_inflow_pipeline: List[Dict[str, Any]] = []
            sim_inflow_pipeline: List[Dict[str, Any]] = []

            # Pending orders cooldown
            base_last_order_day = -100
            sim_last_order_day = -100

            is_currently_in_stockout = False
            stockout_start_day = 0
            stockout_unmet_sum = 0.0

            first_stockout_day: Optional[int] = None

            for day_idx in range(duration):
                day_num = day_idx + 1
                curr_date = BASE_SIMULATION_DATE + timedelta(days=day_idx)
                date_str = curr_date.strftime("%b %d")

                # Daily demand with minor day-of-week & noise variation
                noise_factor = 1.0 + (prng() - 0.5) * (sku.get("std_dev_ratio", 0.1) * 0.5)
                b_demand = base_daily * noise_factor
                s_demand = base_daily * demand_mult * noise_factor

                # Check disruption scenario multipliers for this specific day
                for dis in request.disruptions:
                    if dis.start_day <= day_num < (dis.start_day + dis.duration_days):
                        if not dis.affected_categories or category in dis.affected_categories:
                            s_demand *= dis.severity_multiplier

                # 1. Process Inflows for baseline
                b_inflow = sum(
                    order["qty"] for order in base_inflow_pipeline if order["arrival_day"] == day_num
                )
                base_stock += b_inflow

                # 2. Process Inflows for simulated
                s_inflow = sum(
                    order["qty"] for order in sim_inflow_pipeline if order["arrival_day"] == day_num
                )
                sim_stock += s_inflow

                # 3. Check Replenishment Reorder Trigger
                # Baseline trigger
                if base_stock <= reorder_level and (day_num - base_last_order_day) >= base_lead_time:
                    order_qty = max(sku["max_capacity"] - base_stock, base_daily * 7)
                    base_inflow_pipeline.append({
                        "arrival_day": day_num + base_lead_time,
                        "qty": order_qty,
                    })
                    base_last_order_day = day_num
                    baseline_orders_needed += 1

                # Simulated trigger (with lead time dilation)
                effective_lead_time = base_lead_time + lead_time_dilation
                if sim_stock <= reorder_level and (day_num - sim_last_order_day) >= effective_lead_time:
                    order_qty = max(sku["max_capacity"] - sim_stock, s_demand * 10)
                    sim_inflow_pipeline.append({
                        "arrival_day": day_num + effective_lead_time,
                        "qty": order_qty,
                    })
                    sim_last_order_day = day_num
                    replenishment_orders_needed += 1

                    # Generate Actionable Recommendation if stock is at risk
                    if day_num <= 10 or sim_stock < safety_stock:
                        rec_id = f"REC-ORD-{sku_id[:7]}-{day_num:02d}"
                        urgency = "Critical" if sim_stock < safety_stock else "High"
                        rec = ReplenishmentRecommendation(
                            recommendation_id=rec_id,
                            item_id=sku_id,
                            item_name=sku["name"],
                            category=category,
                            source_location_id="LOC-UDH-02",
                            source_location_name="Udhampur Base Depot",
                            target_location_id="LOC-LEH-01",
                            target_location_name="Leh Base Logistics Hub",
                            recommended_order_day=max(1, day_num - 1),
                            recommended_quantity=round(order_qty, 1),
                            unit_of_measurement=unit,
                            estimated_arrival_day=day_num + effective_lead_time,
                            urgency=urgency,
                            rationale=(
                                f"Preemptive dispatch of {round(order_qty, 1)} {unit} required at Day {max(1, day_num - 1)} "
                                f"to prevent forward stockout at Day {day_num + min(3, effective_lead_time)} "
                                f"under +{int(request.demand_surge_percentage)}% consumption surge and +{lead_time_dilation}d corridor lag."
                            ),
                        )
                        # Add if not duplicate
                        if not any(r.item_id == sku_id and r.recommended_order_day == rec.recommended_order_day for r in recommendations):
                            recommendations.append(rec)

                # 4. Stock Drawdown & Unmet Demand
                # Baseline
                base_consumed = min(base_stock, b_demand)
                base_stock = max(0.0, base_stock - b_demand)

                # Simulated
                if sim_stock >= s_demand:
                    sim_consumed = s_demand
                    unmet = 0.0
                    sim_stock -= s_demand
                    if is_currently_in_stockout:
                        # Close stockout event
                        stockout_events.append(
                            StockoutEvent(
                                event_id=f"EVT-SO-{sku_id[:7]}-{stockout_start_day}",
                                item_id=sku_id,
                                item_name=sku["name"],
                                category=category,
                                location_id="LOC-LEH-01",
                                location_name="Leh Base Logistics Hub",
                                start_day=stockout_start_day,
                                duration_days=day_num - stockout_start_day,
                                total_unmet_units=round(stockout_unmet_sum, 1),
                                unit=unit,
                                severity="Critical" if stockout_unmet_sum > (base_daily * 3) else "High",
                            )
                        )
                        is_currently_in_stockout = False
                        stockout_unmet_sum = 0.0
                else:
                    sim_consumed = sim_stock
                    unmet = s_demand - sim_stock
                    sim_stock = 0.0
                    if not is_currently_in_stockout:
                        is_currently_in_stockout = True
                        stockout_start_day = day_num
                        stockout_unmet_sum = unmet
                        if first_stockout_day is None:
                            first_stockout_day = day_num
                    else:
                        stockout_unmet_sum += unmet

                # Record daily aggregate metrics
                daily_baseline_demand_total[day_idx] += b_demand
                daily_simulated_demand_total[day_idx] += s_demand
                daily_baseline_stock_total[day_idx] += base_stock
                daily_simulated_stock_total[day_idx] += sim_stock
                daily_safety_threshold_total[day_idx] += safety_stock
                daily_unmet_demand_total[day_idx] += unmet

                total_baseline_demand_vol += b_demand
                total_simulated_demand_vol += s_demand
                total_unmet_demand_vol += unmet

                # Append SKU daily point
                trajectories.append(
                    ProjectedStockPoint(
                        day=day_num,
                        date_offset=f"Day {day_num} ({date_str})",
                        projected_stock=round(sim_stock, 1),
                        inflow_received=round(s_inflow, 1),
                        demand_consumed=round(sim_consumed, 1),
                        unmet_demand=round(unmet, 1),
                        safety_stock_threshold=round(safety_stock, 1),
                        is_stockout=(sim_stock <= 0.0),
                    )
                )

            # Close dangling stockout event if still open at end of duration
            if is_currently_in_stockout:
                stockout_events.append(
                    StockoutEvent(
                        event_id=f"EVT-SO-{sku_id[:7]}-{stockout_start_day}",
                        item_id=sku_id,
                        item_name=sku["name"],
                        category=category,
                        location_id="LOC-LEH-01",
                        location_name="Leh Base Logistics Hub",
                        start_day=stockout_start_day,
                        duration_days=(duration - stockout_start_day) + 1,
                        total_unmet_units=round(stockout_unmet_sum, 1),
                        unit=unit,
                        severity="Critical",
                    )
                )

            item_trajectories[sku_id] = trajectories

            # Calculate SKU final stock coverage days
            avg_daily_sim = (s_demand / (duration or 1)) if duration > 0 else base_daily
            coverage_sim = round(sim_stock / (base_daily * demand_mult), 1) if (base_daily * demand_mult) > 0 else 0.0
            coverage_base = round(base_stock / base_daily, 1) if base_daily > 0 else 0.0

            status = "Nominal"
            if first_stockout_day is not None or sim_stock <= 0.0:
                status = "Critical Stockout"
            elif sim_stock < safety_stock:
                status = "Warning"

            sku_sim_results[sku_id] = {
                "item_id": sku_id,
                "item_name": sku["name"],
                "category": category,
                "unit": unit,
                "initial_stock": round(sim_init_stock, 1),
                "baseline_final_stock": round(base_stock, 1),
                "simulated_final_stock": round(sim_stock, 1),
                "stock_coverage_days_baseline": coverage_base,
                "stock_coverage_days_simulated": coverage_sim,
                "stockout_day": first_stockout_day,
                "status": status,
            }

        # 4. Route Disruption Analysis & Impact
        route_impacts = self._evaluate_route_disruptions(request)

        # 5. Assemble Daily Trajectory Points for Comparative Chart
        daily_trajectories: List[DailyTrajectoryPoint] = []
        for d_idx in range(duration):
            d_num = d_idx + 1
            c_date = BASE_SIMULATION_DATE + timedelta(days=d_idx)
            daily_trajectories.append(
                DailyTrajectoryPoint(
                    day=d_num,
                    date=c_date.strftime("%b %d"),
                    baseline_stock=round(daily_baseline_stock_total[d_idx], 1),
                    simulated_stock=round(daily_simulated_stock_total[d_idx], 1),
                    baseline_demand=round(daily_baseline_demand_total[d_idx], 1),
                    simulated_demand=round(daily_simulated_demand_total[d_idx], 1),
                    safety_threshold=round(daily_safety_threshold_total[d_idx], 1),
                    unmet_demand=round(daily_unmet_demand_total[d_idx], 1),
                )
            )

        # 6. Compute 7-Dimension Before-Versus-After Comparative Metrics
        comparison = self._compute_before_vs_after_comparison(
            daily_baseline_stock=daily_baseline_stock_total,
            daily_simulated_stock=daily_simulated_stock_total,
            total_baseline_demand=total_baseline_demand_vol,
            total_simulated_demand=total_simulated_demand_vol,
            target_skus=target_skus,
            stockout_events=stockout_events,
            baseline_orders=baseline_orders_needed,
            simulated_orders=replenishment_orders_needed,
            lead_time_dilation=lead_time_dilation,
            route_impacts=route_impacts,
        )

        # 7. Summary Performance Metrics & Resilience Score
        fulfilled_vol = max(0.0, total_simulated_demand_vol - total_unmet_demand_vol)
        service_level = (
            round((fulfilled_vol / total_simulated_demand_vol) * 100.0, 1)
            if total_simulated_demand_vol > 0
            else 100.0
        )

        # Resilience Score formula: weighted balance of service level, stockout penalty, and route availability
        stockout_penalty = min(40.0, len(stockout_events) * 8.0)
        route_penalty = sum(15.0 for r in route_impacts if r.is_blocked) + sum(
            5.0 for r in route_impacts if r.status == "Delayed"
        )
        resilience_score = max(
            15.0,
            round(
                (service_level * 0.65)
                - (stockout_penalty * 0.20)
                - (min(30.0, route_penalty) * 0.15),
                1,
            ),
        )

        # Bottleneck route
        critical_bottleneck = None
        blocked_routes = [r for r in route_impacts if r.is_blocked]
        if blocked_routes:
            critical_bottleneck = f"{blocked_routes[0].route_name} (BLOCKED)"
        elif route_impacts:
            worst_delayed = max(route_impacts, key=lambda x: x.delta_hours)
            if worst_delayed.delta_hours > 0:
                critical_bottleneck = f"{worst_delayed.route_name} (+{worst_delayed.delta_hours}h delay)"

        summary_metrics = SimulationSummaryMetrics(
            total_simulated_days=duration,
            overall_service_level_percentage=service_level,
            resilience_score=resilience_score,
            total_stockout_incidents=len(stockout_events),
            total_unmet_demand_volume=round(total_unmet_demand_vol, 1),
            total_replenishment_orders_needed=replenishment_orders_needed,
            average_fleet_capacity_utilization_percentage=round(
                min(98.5, 68.5 + (request.demand_surge_percentage * 0.25) + (lead_time_dilation * 1.5)), 1
            ),
            critical_bottleneck_route=critical_bottleneck,
        )

        # 8. Generate Dynamic Rule-Based Impact Summary
        impact_summary = self._generate_impact_summary(
            request=request,
            comparison=comparison,
            stockout_events=stockout_events,
            route_impacts=route_impacts,
            resilience_score=resilience_score,
            total_unmet_vol=total_unmet_demand_vol,
        )

        # 9. Format SKU summaries
        sku_summary_models = [
            SkuSimulationSummary(**item) for item in sku_sim_results.values()
        ]

        exec_duration = round(time.time() - start_time, 3)

        response = SimulationResultResponse(
            simulation_id=sim_id,
            simulation_name=request.simulation_name or "Logistics Stress Test",
            status="completed",
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            parameters=request,
            summary_metrics=summary_metrics,
            comparison=comparison,
            impact_summary=impact_summary,
            recommendations=recommendations,
            route_impacts=route_impacts,
            sku_summaries=sku_summary_models,
            daily_trajectories=daily_trajectories,
            stockout_events=stockout_events,
            item_trajectories=item_trajectories,
            resilience_score=resilience_score,
            execution_time_seconds=exec_duration,
        )

        # Cache in memory
        self._simulations_history[sim_id] = response
        return response

    # --------------------------------------------------------------------------
    # Helper Methods
    # --------------------------------------------------------------------------

    def _filter_target_skus(self, request: SimulationRequest) -> Dict[str, Dict[str, Any]]:
        """Filters catalog items based on request criteria."""
        items = copy.deepcopy(SKU_CATALOG)

        if request.selected_category and request.selected_category != "All":
            cat_lower = request.selected_category.lower()
            items = {
                k: v for k, v in items.items()
                if cat_lower in v.get("category", "").lower()
            }

        if request.selected_item_ids:
            target_ids = set(request.selected_item_ids)
            items = {k: v for k, v in items.items() if k in target_ids}

        return items

    def _evaluate_route_disruptions(
        self, request: SimulationRequest
    ) -> List[RouteImpactSummary]:
        """
        Evaluates corridor impacts, transit time increases, and detour alternatives
        reusing route planning domain heuristics.
        """
        results: List[RouteImpactSummary] = []
        preset = request.route_disruption_preset

        for r in DEFAULT_ROUTES:
            route_id = r["route_id"]
            name = r["route_name"]
            orig_name = r["origin_name"]
            dest_name = r["destination_name"]
            base_hours = r["standard_transit_hours"]

            sim_hours = base_hours
            status = "Operational"
            is_blocked = False
            detour_id = None
            detour_name = None

            # Apply disruption preset impacts
            if preset == "zoji_la_blizzard" and route_id == "RTE-SRI-KRG-01":
                sim_hours = round(base_hours * 2.4, 1)
                status = "Delayed"
            elif preset == "khardung_la_landslide" and route_id == "RTE-LEH-SIA-01":
                sim_hours = round(base_hours * 3.8, 1)
                status = "Disrupted"
                is_blocked = True
                detour_id = "RTE-LEH-SIA-02"
                detour_name = "Nubra River Valley Detour Track"
            elif preset == "drass_artillery_priority" and route_id == "RTE-KRG-DRS-01":
                sim_hours = round(base_hours + 3.5, 1)
                status = "Delayed"
            elif request.lead_time_dilation_days > 0:
                # Generalized congestion delay across mountain routes
                delay_factor = 1.0 + (min(request.lead_time_dilation_days, 15) * 0.05)
                sim_hours = round(base_hours * delay_factor, 1)
                if request.lead_time_dilation_days >= 8:
                    status = "Delayed"

            delta = round(sim_hours - base_hours, 1)
            pct = round(((sim_hours - base_hours) / base_hours) * 100.0, 1) if base_hours > 0 else 0.0

            results.append(
                RouteImpactSummary(
                    route_id=route_id,
                    route_name=name,
                    origin_name=orig_name,
                    destination_name=dest_name,
                    baseline_transit_hours=base_hours,
                    simulated_transit_hours=sim_hours,
                    delta_hours=delta,
                    percentage_change=pct,
                    status=status,
                    is_blocked=is_blocked,
                    recommended_detour_id=detour_id,
                    recommended_detour_name=detour_name,
                )
            )

        return results

    def _compute_before_vs_after_comparison(
        self,
        daily_baseline_stock: List[float],
        daily_simulated_stock: List[float],
        total_baseline_demand: float,
        total_simulated_demand: float,
        target_skus: Dict[str, Any],
        stockout_events: List[StockoutEvent],
        baseline_orders: int,
        simulated_orders: int,
        lead_time_dilation: int,
        route_impacts: List[RouteImpactSummary],
    ) -> BeforeVsAfterComparison:
        """
        Calculates mathematical difference and percentage change across 7 dimensions
        with zero-division protection and status labeling.
        """
        # 1. Inventory levels (Final ending stock)
        base_final_stock = daily_baseline_stock[-1] if daily_baseline_stock else 0.0
        sim_final_stock = daily_simulated_stock[-1] if daily_simulated_stock else 0.0
        inv_point = self._compute_metric_diff(
            base=base_final_stock,
            sim=sim_final_stock,
            unit="Units",
            higher_is_better=True,
        )

        # 2. Demand forecasts (Total volume consumed)
        dem_point = self._compute_metric_diff(
            base=total_baseline_demand,
            sim=total_simulated_demand,
            unit="Units",
            higher_is_better=False,  # Higher demand increases pressure
        )

        # 3. Stock coverage days
        daily_dem_base = total_baseline_demand / (len(daily_baseline_stock) or 1)
        daily_dem_sim = total_simulated_demand / (len(daily_simulated_stock) or 1)
        base_cov = round(base_final_stock / daily_dem_base, 1) if daily_dem_base > 0 else 0.0
        sim_cov = round(sim_final_stock / daily_dem_sim, 1) if daily_dem_sim > 0 else 0.0
        cov_point = self._compute_metric_diff(
            base=base_cov,
            sim=sim_cov,
            unit="Days",
            higher_is_better=True,
        )

        # 4. Predicted stockouts
        so_point = self._compute_metric_diff(
            base=0.0,
            sim=float(len(stockout_events)),
            unit="Incidents",
            higher_is_better=False,
        )

        # 5. Replenishment requisitions
        req_point = self._compute_metric_diff(
            base=float(baseline_orders),
            sim=float(simulated_orders),
            unit="Orders",
            higher_is_better=False,
        )

        # 6. Supply delays
        base_lead = 4.0
        sim_lead = base_lead + float(lead_time_dilation)
        delay_point = self._compute_metric_diff(
            base=base_lead,
            sim=sim_lead,
            unit="Days",
            higher_is_better=False,
        )

        # 7. Route travel times
        base_route_hrs = (
            sum(r.baseline_transit_hours for r in route_impacts) / (len(route_impacts) or 1)
            if route_impacts
            else 6.5
        )
        sim_route_hrs = (
            sum(r.simulated_transit_hours for r in route_impacts) / (len(route_impacts) or 1)
            if route_impacts
            else 6.5
        )
        route_point = self._compute_metric_diff(
            base=round(base_route_hrs, 1),
            sim=round(sim_route_hrs, 1),
            unit="Hours",
            higher_is_better=False,
        )

        return BeforeVsAfterComparison(
            inventory_levels=inv_point,
            demand_forecasts=dem_point,
            stock_coverage_days=cov_point,
            predicted_stockouts=so_point,
            replenishment_requisitions=req_point,
            supply_delays=delay_point,
            route_travel_times=route_point,
        )

    def _compute_metric_diff(
        self, base: float, sim: float, unit: str, higher_is_better: bool = True
    ) -> MetricComparisonPoint:
        """Helper to calculate delta and % change safely."""
        delta = round(sim - base, 2)
        if abs(base) < 1e-6:
            pct = 100.0 if sim > 0 else (0.0 if sim == 0 else -100.0)
        else:
            pct = round(((sim - base) / base) * 100.0, 2)

        # Status evaluation
        status = "neutral"
        if delta != 0:
            if higher_is_better:
                status = "improved" if delta > 0 else "degraded"
            else:
                status = "degraded" if delta > 0 else "improved"

        return MetricComparisonPoint(
            baseline_value=round(base, 2),
            simulated_value=round(sim, 2),
            delta=delta,
            percentage_change=pct,
            unit=unit,
            status=status,
        )

    def _generate_impact_summary(
        self,
        request: SimulationRequest,
        comparison: BeforeVsAfterComparison,
        stockout_events: List[StockoutEvent],
        route_impacts: List[RouteImpactSummary],
        resilience_score: float,
        total_unmet_vol: float,
    ) -> List[str]:
        """
        Synthesizes dynamic, rule-based plain-English insights from simulation differentials.
        """
        summary_bullets: List[str] = []

        # 1. Resilience Assessment
        if resilience_score >= 85.0:
            summary_bullets.append(
                f"Logistics Network Resilience is Robust at {resilience_score}% with manageable buffer drawdown across forward positions."
            )
        elif resilience_score >= 65.0:
            summary_bullets.append(
                f"Logistics Network Resilience is Moderately Strained at {resilience_score}%. Forward operating bases will experience severe buffer depletion within 14 days."
            )
        else:
            summary_bullets.append(
                f"CRITICAL: Logistics Network Resilience Compromised ({resilience_score}%). High risk of cascade supply failures under combined surge and supply delay conditions."
            )

        # 2. Demand Surge Impact
        if request.demand_surge_percentage > 0:
            surge_pct = int(request.demand_surge_percentage)
            summary_bullets.append(
                f"Demand Surge (+{surge_pct}%): Projected aggregate consumption increased by {comparison.demand_forecasts.delta:,.0f} units, reducing total forward stock coverage from {comparison.stock_coverage_days.baseline_value:.1f} days down to {comparison.stock_coverage_days.simulated_value:.1f} days."
            )

        # 3. Supply Lead Time Delay Impact
        if request.lead_time_dilation_days > 0:
            days = request.lead_time_dilation_days
            summary_bullets.append(
                f"Supply Chain Delay (+{days} days): Replenishment convoys from rear base depots experience transit lags, delaying scheduled pipeline inflows and creating an inventory deficit of {total_unmet_vol:,.0f} units."
            )

        # 4. Stockout Vulnerabilities
        if stockout_events:
            unique_skus = set(e.item_id for e in stockout_events)
            earliest_so = min(e.start_day for e in stockout_events)
            summary_bullets.append(
                f"Stockout Vulnerability: {len(stockout_events)} critical stockout incidents detected across {len(unique_skus)} critical SKUs, starting as early as Day {earliest_so}."
            )
        else:
            summary_bullets.append(
                "Zero Stockout Incidents: On-hand buffer inventory and scheduled convoys successfully satisfy all forward garrison requirements throughout the modeled window."
            )

        # 5. Route Disruption Bottlenecks
        blocked = [r for r in route_impacts if r.is_blocked]
        delayed = [r for r in route_impacts if r.status == "Delayed"]
        if blocked:
            names = ", ".join(f"'{r.route_name}'" for r in blocked)
            summary_bullets.append(
                f"Corridor Severance: Strategic corridor {names} is completely severed. Traffic must be redirected to tactical low-altitude bypass tracks."
            )
        elif delayed:
            summary_bullets.append(
                f"Convoy Transit Lag: {len(delayed)} strategic routes experience significant slowdowns (+{comparison.route_travel_times.delta:.1f} avg hours), increasing convoy round-trip cycle times."
            )

        # 6. Requisition Orders
        if comparison.replenishment_requisitions.simulated_value > comparison.replenishment_requisitions.baseline_value:
            extra = int(comparison.replenishment_requisitions.delta)
            summary_bullets.append(
                f"Requisition Pressure: {extra} emergency replenishment orders must be triggered preemptively to restore safety buffers at Leh and forward outposts."
            )

        return summary_bullets

    def _create_deterministic_prng(self, seed: int):
        """Creates a simple deterministic pseudo-random linear congruential generator."""
        state = abs(seed) or 42

        def next_val():
            nonlocal state
            state = (state * 1664525 + 1013904223) % (2**32)
            return state / (2**32)

        return next_val


# Singleton instance
simulation_service = SimulationService()
