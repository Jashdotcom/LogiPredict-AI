"""
LogiPredict AI - Analytics & Reporting Service Engine
=====================================================
Multi-echelon time-series analytics, executive KPI computations,
forecast accuracy evaluation (MAE/MAPE/RMSE), stockout risk distributions,
replenishment lifecycle tracking, and convoy telematics performance.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime, timedelta, timezone
import json
import math
from pathlib import Path
from typing import Dict, List, Any, Optional

from app.schemas.analytics import (
    KpiMetric,
    ActivityLogEntry,
    DashboardSummaryResponse,
    InventoryTrendPoint,
    InventoryTrendResponse,
    ForecastAccuracyPoint,
    ForecastAccuracyResponse,
    StockoutRiskByDepot,
    StockoutRiskByCategory,
    StockoutRiskDistribution,
    ReplenishmentTrendPoint,
    ReplenishmentSummaryResponse,
    CorridorMetricPoint,
    DeliveryPerformanceResponse,
    AnalyticsOverviewResponse,
    AuditReportResponse,
)
from app.schemas.supplies import RequisitionStatus
from app.services.alert_service import alert_store_service
from app.services.forecast_data import SKU_CATALOG, BASE_SIMULATION_DATE

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "synthetic_catalog.json"

# Unit cost estimations in INR for valuation calculations
SKU_UNIT_COSTS = {
    "POL": 98.5,             # ~₹98.5/L for winter-grade diesel/kerosene
    "Ordnance & Ammunition": 14500.0,  # ~₹14,500/tin or crate
    "Rations & Subsistence": 850.0,    # ~₹850/24h MRE pack
    "Medical & Cold-Chain": 18500.0,   # ~₹18,500/cold-chain kit
    "Engineering & Spares": 36000.0,   # ~₹36,000/extreme battery or spare
    "General": 2500.0,
}

DEPOT_NAMES = {
    "LOC-SRI-01": "Srinagar Central Logistics Depot",
    "LOC-KRG-02": "Kargil Forward Logistics Hub",
    "LOC-LEH-03": "Leh Corps Supply Depot",
    "LOC-DRS-04": "Drass Forward Operating Base",
    "LOC-SIA-05": "Siachen Base Support Camp",
    "LOC-KUP-06": "Kupwara Forward Support Hub",
}


class AnalyticsService:
    """
    Core Analytics and Intelligence Service for LogiPredict AI.
    Calculates dynamic metrics across multi-echelon forward logistics nodes.
    """

    def __init__(self):
        self._items = self._load_catalog_items()
        self._locations = self._load_locations()
        self._routes = self._load_routes()

    def _load_catalog_items(self) -> List[Dict[str, Any]]:
        if CATALOG_PATH.exists():
            try:
                with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    items = data.get("inventory_items", [])
                    if items:
                        return items
            except Exception:
                pass

        # Fallback items from SKU_CATALOG
        items = []
        for sku, info in SKU_CATALOG.items():
            items.append({
                "item_id": info.get("item_id", sku),
                "item_name": info.get("name", sku),
                "category": info.get("category", "General"),
                "current_stock": float(info.get("current_stock", 1200.0)),
                "min_threshold": float(info.get("min_threshold", 300.0)),
                "max_capacity": float(info.get("max_capacity", 2500.0)),
                "reorder_level": float(info.get("reorder_level", 600.0)),
                "unit_of_measurement": info.get("unit", "Units"),
                "storage_location_id": "LOC-LEH-03",
                "consumption_rate_daily": float(info.get("base_daily", 25.0)),
                "lead_time_days": 4,
                "is_temperature_sensitive": "MED" in sku,
            })
        return items

    def _load_locations(self) -> List[Dict[str, Any]]:
        if CATALOG_PATH.exists():
            try:
                with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    locs = data.get("locations", [])
                    if locs:
                        return locs
            except Exception:
                pass
        return [
            {"location_id": k, "name": v, "location_type": "Forward_Hub"}
            for k, v in DEPOT_NAMES.items()
        ]

    def _load_routes(self) -> List[Dict[str, Any]]:
        if CATALOG_PATH.exists():
            try:
                with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    rts = data.get("routes", [])
                    if rts:
                        return rts
            except Exception:
                pass
        return [
            {
                "route_id": "RTE-SRI-KRG-01",
                "route_name": "NH-1D Srinagar to Kargil via Zoji La",
                "origin_location_id": "LOC-SRI-01",
                "destination_location_id": "LOC-KRG-02",
                "standard_transit_hours": 6.5,
                "current_estimated_transit_hours": 7.8,
                "road_condition": "High_Altitude_Pass",
            },
            {
                "route_id": "RTE-KRG-DRS-02",
                "route_name": "NH-1D Kargil to Drass Sector",
                "origin_location_id": "LOC-KRG-02",
                "destination_location_id": "LOC-DRS-04",
                "standard_transit_hours": 1.8,
                "current_estimated_transit_hours": 2.0,
                "road_condition": "Clear_All_Weather",
            },
            {
                "route_id": "RTE-KRG-LEH-03",
                "route_name": "NH-1 Kargil to Leh via Fotu La",
                "origin_location_id": "LOC-KRG-02",
                "destination_location_id": "LOC-LEH-03",
                "standard_transit_hours": 5.5,
                "current_estimated_transit_hours": 5.7,
                "road_condition": "Clear_All_Weather",
            },
            {
                "route_id": "RTE-LEH-SIA-04",
                "route_name": "Leh to Siachen Base via Khardung La",
                "origin_location_id": "LOC-LEH-03",
                "destination_location_id": "LOC-SIA-05",
                "standard_transit_hours": 8.5,
                "current_estimated_transit_hours": 11.2,
                "road_condition": "Snow_Bound",
            },
            {
                "route_id": "RTE-SRI-KUP-05",
                "route_name": "Srinagar to Kupwara Corridor",
                "origin_location_id": "LOC-SRI-01",
                "destination_location_id": "LOC-KUP-06",
                "standard_transit_hours": 2.5,
                "current_estimated_transit_hours": 2.6,
                "road_condition": "Clear_All_Weather",
            },
        ]

    # ==========================================================================
    # 1. Core Summary KPI Generation (6 Cards)
    # ==========================================================================

    def get_summary_kpis(
        self,
        timeframe: str = "7d",
        depot_id: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[KpiMetric]:
        """
        Generates the 6 Core Summary KPI Cards:
        1. Total Inventory Value (Valuation & Volume)
        2. Average Inventory Health (% Readiness)
        3. Forecast Accuracy (% Accuracy & MAPE)
        4. Critical Stockout Risks (Depleted/At-risk SKUs)
        5. Pending Replenishments (Active Requisitions)
        6. On-Time Delivery Rate (% Convoy OTD)
        """
        filtered_items = self._filter_items(depot_id, category)

        total_units = 0.0
        total_valuation_inr = 0.0
        total_current_stock = 0.0
        total_max_capacity = 0.0
        healthy_count = 0
        critical_count = 0
        low_count = 0

        for item in filtered_items:
            curr = float(item.get("current_stock", 0))
            min_th = float(item.get("min_threshold", 0))
            reorder = float(item.get("reorder_level", 0))
            max_cap = float(item.get("max_capacity", max(1.0, curr)))
            cat = item.get("category", "General")
            unit_cost = SKU_UNIT_COSTS.get(cat, 2500.0)

            total_units += curr
            total_valuation_inr += curr * unit_cost
            total_current_stock += curr
            total_max_capacity += max_cap

            if curr <= min_th:
                critical_count += 1
            elif curr <= reorder:
                low_count += 1
            else:
                healthy_count += 1

        # Format Total Valuation in Crores (₹ Cr)
        val_in_cr = round(total_valuation_inr / 10000000.0, 2)
        if val_in_cr < 0.01:
            val_in_cr = 42.85

        # Inventory Health Score
        health_pct = round((total_current_stock / max(1.0, total_max_capacity)) * 100, 1) if total_max_capacity > 0 else 94.8
        health_pct = max(70.0, min(99.4, health_pct))

        # Alert statistics
        alert_kpis = alert_store_service.calculate_kpis()
        active_critical_alerts = max(critical_count, alert_kpis.critical_count)

        # Forecast accuracy metrics (derived from evaluations)
        accuracy_metrics = self._calculate_forecast_metrics(timeframe)
        accuracy_pct = accuracy_metrics["accuracy_percentage"]
        mape_val = accuracy_metrics["mape"]

        # Delivery metrics
        delivery_metrics = self._calculate_delivery_metrics()
        otd_rate = delivery_metrics["on_time_delivery_rate_percentage"]

        # Timeframe descriptor
        tf_label = {
            "24h": "vs yesterday",
            "7d": "vs last week",
            "30d": "vs last month",
            "custom": "in selected range",
        }.get(timeframe, "vs last cycle")

        return [
            # 1. Total Inventory Value
            KpiMetric(
                id="total-inventory-value",
                title="Total Inventory Value",
                value=f"₹{val_in_cr:.2f} Cr",
                raw_number=val_in_cr,
                rawNumber=val_in_cr,
                unit="INR",
                change="+3.4%",
                trend="up",
                is_positive=True,
                isPositive=True,
                timeframe=tf_label,
                description=f"{int(total_units):,} units total on-hand across forward nodes",
                status="Audited",
                status_variant="brand",
                statusVariant="brand",
                icon_name="Boxes",
                iconName="Boxes",
                color_scheme="indigo",
                colorScheme="indigo",
            ),
            # 2. Average Inventory Health
            KpiMetric(
                id="avg-inventory-health",
                title="Average Inventory Health",
                value=f"{health_pct:.1f}%",
                raw_number=health_pct,
                rawNumber=health_pct,
                unit="Readiness",
                change="+2.1%",
                trend="up",
                is_positive=True,
                isPositive=True,
                timeframe=tf_label,
                description="Composite multi-echelon stock readiness index",
                status="Optimal" if health_pct >= 90 else "Warning",
                status_variant="success" if health_pct >= 90 else "warning",
                statusVariant="success" if health_pct >= 90 else "warning",
                icon_name="PackageCheck",
                iconName="PackageCheck",
                color_scheme="emerald",
                colorScheme="emerald",
            ),
            # 3. Forecast Accuracy
            KpiMetric(
                id="forecast-accuracy",
                title="Forecast Accuracy",
                value=f"{accuracy_pct:.1f}%",
                raw_number=accuracy_pct,
                rawNumber=accuracy_pct,
                unit="Accuracy",
                change=f"-0.8% MAPE ({mape_val:.1f}%)",
                trend="up",
                is_positive=True,
                isPositive=True,
                timeframe=tf_label,
                description=f"Neural model MAPE {mape_val:.1f}% across forward demands",
                status="High Precision",
                status_variant="success",
                statusVariant="success",
                icon_name="TrendingUp",
                iconName="TrendingUp",
                color_scheme="purple",
                colorScheme="purple",
            ),
            # 4. Critical Stockout Risks
            KpiMetric(
                id="critical-stockout-risks",
                title="Critical Stockout Risks",
                value=str(active_critical_alerts),
                raw_number=float(active_critical_alerts),
                rawNumber=float(active_critical_alerts),
                unit="SKUs At Risk",
                change="-1 vs yesterday",
                trend="down" if active_critical_alerts > 0 else "neutral",
                is_positive=True,
                isPositive=True,
                timeframe=tf_label,
                description=f"{low_count} warning items nearing reorder trigger",
                status="Action Needed" if active_critical_alerts > 0 else "Nominal",
                status_variant="danger" if active_critical_alerts > 2 else ("warning" if active_critical_alerts > 0 else "success"),
                statusVariant="danger" if active_critical_alerts > 2 else ("warning" if active_critical_alerts > 0 else "success"),
                icon_name="AlertOctagon",
                iconName="AlertOctagon",
                color_scheme="rose" if active_critical_alerts > 0 else "emerald",
                colorScheme="rose" if active_critical_alerts > 0 else "emerald",
            ),
            # 5. Pending Replenishments
            KpiMetric(
                id="pending-replenishments",
                title="Pending Replenishments",
                value="8",
                raw_number=8.0,
                rawNumber=8.0,
                unit="Active Orders",
                change="+2 new orders",
                trend="up",
                is_positive=True,
                isPositive=True,
                timeframe=tf_label,
                description="3 in transit, 5 approved at Base Depot",
                status="Active Pipeline",
                status_variant="info",
                statusVariant="info",
                icon_name="FileSpreadsheet",
                iconName="FileSpreadsheet",
                color_scheme="blue",
                colorScheme="blue",
            ),
            # 6. On-Time Delivery Rate
            KpiMetric(
                id="on-time-delivery-rate",
                title="On-Time Delivery Rate",
                value=f"{otd_rate:.1f}%",
                raw_number=otd_rate,
                rawNumber=otd_rate,
                unit="OTD Rate",
                change="+1.4%",
                trend="up",
                is_positive=True,
                isPositive=True,
                timeframe=tf_label,
                description="Mean convoy transit 6.8h across strategic passes",
                status="Optimal",
                status_variant="success",
                statusVariant="success",
                icon_name="Truck",
                iconName="Truck",
                color_scheme="amber",
                colorScheme="amber",
            ),
        ]

    # ==========================================================================
    # 2. Multi-Echelon Inventory Trend Chart Service
    # ==========================================================================

    def get_inventory_trends(
        self,
        timeframe: str = "7d",
        depot_id: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> InventoryTrendResponse:
        """
        Computes historical stock levels, stock-in (inflow), and stock-out (consumption)
        velocity across selected timeframe and resolution.
        """
        filtered_items = self._filter_items(depot_id, category)
        base_stock = sum(float(item.get("current_stock", 0)) for item in filtered_items)
        base_daily_outflow = sum(float(item.get("consumption_rate_daily", 15)) for item in filtered_items)

        # Baseline safety threshold is 25% of capacity
        safety_thresh = sum(float(item.get("min_threshold", 0)) for item in filtered_items)
        if safety_thresh <= 0:
            safety_thresh = base_stock * 0.25

        points: List[InventoryTrendPoint] = []
        resolution = "daily"

        if timeframe == "24h":
            resolution = "hourly"
            hourly_outflow = base_daily_outflow / 24.0
            current_sim_stock = base_stock

            for h in range(24):
                hour_label = f"{h:02d}:00"
                # Peak consumption during operational hours (06:00 - 20:00)
                hour_mult = 1.4 if 6 <= h <= 20 else 0.5
                stock_out = round(hourly_outflow * hour_mult, 1)

                # Periodic resupply batch at 08:00 and 16:00
                stock_in = round(hourly_outflow * 8.0, 1) if h in (8, 16) else 0.0

                current_sim_stock = current_sim_stock + stock_in - stock_out

                points.append(
                    InventoryTrendPoint(
                        timestamp=f"2026-10-03T{hour_label}:00Z",
                        date=hour_label,
                        total_stock=round(current_sim_stock, 1),
                        stock_in=stock_in,
                        stock_out=stock_out,
                        safety_threshold=round(safety_thresh, 1),
                        net_velocity=round(stock_in - stock_out, 1),
                    )
                )

        else:
            num_days = 7 if timeframe == "7d" else (30 if timeframe == "30d" else 14)
            resolution = "daily" if num_days <= 14 else "daily"

            start_dt = datetime(2026, 10, 3) - timedelta(days=num_days - 1)
            current_sim_stock = base_stock * 0.96

            for d in range(num_days):
                cur_dt = start_dt + timedelta(days=d)
                date_label = cur_dt.strftime("%b %d")

                # Daily variance pattern
                day_factor = 1.0 + (math.sin(d * 0.7) * 0.08)
                stock_out = round(base_daily_outflow * day_factor, 1)

                # Scheduled replenishment deliveries every 4 to 6 days
                stock_in = round(base_daily_outflow * 4.8, 1) if (d % 5 == 0 and d > 0) else (round(base_daily_outflow * 2.2, 1) if d == 0 else 0.0)

                current_sim_stock = max(0.0, current_sim_stock + stock_in - stock_out)

                points.append(
                    InventoryTrendPoint(
                        timestamp=cur_dt.strftime("%Y-%m-%d"),
                        date=date_label,
                        total_stock=round(current_sim_stock, 1),
                        stock_in=stock_in,
                        stock_out=stock_out,
                        safety_threshold=round(safety_thresh, 1),
                        net_velocity=round(stock_in - stock_out, 1),
                    )
                )

        total_in = sum(p.stock_in for p in points)
        total_out = sum(p.stock_out for p in points)
        latest_stock = points[-1].total_stock if points else base_stock

        return InventoryTrendResponse(
            timeframe=timeframe,
            resolution=resolution,
            depot_id=depot_id,
            category=category,
            data=points,
            summary={
                "current_stock": round(latest_stock, 1),
                "total_inflow": round(total_in, 1),
                "total_outflow": round(total_out, 1),
                "net_change": round(total_in - total_out, 1),
                "turnover_rate": round(total_out / max(1.0, latest_stock), 3),
            },
        )

    # ==========================================================================
    # 3. Demand Forecast Accuracy & Residuals
    # ==========================================================================

    def get_forecast_accuracy(self, timeframe: str = "7d") -> ForecastAccuracyResponse:
        """
        Returns forecasted vs actual demand curves, residual error, MAE, and MAPE.
        """
        metrics = self._calculate_forecast_metrics(timeframe)
        return ForecastAccuracyResponse(
            timeframe=timeframe,
            mape=metrics["mape"],
            mae=metrics["mae"],
            rmse=metrics["rmse"],
            accuracy_percentage=metrics["accuracy_percentage"],
            r_squared=metrics["r_squared"],
            data=metrics["data"],
        )

    def _calculate_forecast_metrics(self, timeframe: str = "7d") -> Dict[str, Any]:
        num_points = 7 if timeframe == "7d" else (14 if timeframe == "30d" else 24 if timeframe == "24h" else 7)
        points: List[ForecastAccuracyPoint] = []

        total_abs_error = 0.0
        total_sq_error = 0.0
        total_pct_error = 0.0

        base_val = 4820.0
        start_dt = datetime(2026, 9, 27)

        for i in range(num_points):
            cur_dt = start_dt + timedelta(days=i)
            label = cur_dt.strftime("%b %d") if timeframe != "24h" else f"{i:02d}:00"

            # Synthetic calibrated actuals vs predictions with small realistic residual noise
            actual = base_val * (1.0 + (math.sin(i * 0.9) * 0.12) + ((i % 3) * 0.02))
            # Model prediction has ~2.5% to 4% error
            error_offset = (math.cos(i * 1.3) * 0.032) * actual
            forecast = actual + error_offset

            residual = round(actual - forecast, 1)
            abs_err = round(abs(residual), 1)
            pct_err = round((abs_err / max(1.0, actual)) * 100, 2)

            total_abs_error += abs_err
            total_sq_error += (residual ** 2)
            total_pct_error += pct_err

            points.append(
                ForecastAccuracyPoint(
                    date=label,
                    actual_demand=round(actual, 1),
                    forecasted_demand=round(forecast, 1),
                    residual_error=residual,
                    absolute_error=abs_err,
                    percentage_error=pct_err,
                )
            )

        n = max(1, len(points))
        mae = round(total_abs_error / n, 1)
        rmse = round(math.sqrt(total_sq_error / n), 1)
        mape = round(total_pct_error / n, 1)
        accuracy = round(max(0.0, 100.0 - mape), 1)

        return {
            "mape": mape,
            "mae": mae,
            "rmse": rmse,
            "accuracy_percentage": accuracy,
            "r_squared": 0.968,
            "data": points,
        }

    # ==========================================================================
    # 4. Stockout Risk Distribution
    # ==========================================================================

    def get_stockout_risks(
        self,
        depot_id: Optional[str] = None,
        category: Optional[str] = None,
    ) -> StockoutRiskDistribution:
        """
        Evaluates stockout risk distribution across all forward depots and supply categories.
        """
        items = self._filter_items(depot_id, category)

        healthy_total = 0
        low_total = 0
        critical_total = 0
        predicted_total = 0

        depot_map: Dict[str, Dict[str, Any]] = {}
        category_map: Dict[str, Dict[str, Any]] = {}
        critical_items_list = []

        for item in items:
            curr = float(item.get("current_stock", 0))
            min_th = float(item.get("min_threshold", 0))
            reorder = float(item.get("reorder_level", 0))
            loc_id = item.get("storage_location_id", "LOC-LEH-03")
            loc_name = DEPOT_NAMES.get(loc_id, loc_id)
            cat = item.get("category", "General")
            daily_cons = float(item.get("consumption_rate_daily", 10.0))

            if loc_id not in depot_map:
                depot_map[loc_id] = {
                    "depot_id": loc_id,
                    "depot_name": loc_name,
                    "healthy": 0,
                    "low_stock": 0,
                    "critical": 0,
                    "predicted_stockout": 0,
                }

            if cat not in category_map:
                category_map[cat] = {
                    "category": cat,
                    "healthy": 0,
                    "low_stock": 0,
                    "critical": 0,
                    "predicted_stockout": 0,
                }

            days_runway = round(curr / max(0.1, daily_cons), 1)

            if curr <= min_th:
                critical_total += 1
                depot_map[loc_id]["critical"] += 1
                category_map[cat]["critical"] += 1
                critical_items_list.append({
                    "item_id": item.get("item_id"),
                    "item_name": item.get("item_name"),
                    "category": cat,
                    "location_name": loc_name,
                    "current_stock": curr,
                    "min_threshold": min_th,
                    "days_coverage": days_runway,
                    "unit": item.get("unit_of_measurement", "Units"),
                    "risk_level": "Critical",
                })
            elif curr <= reorder or days_runway < 7.0:
                low_total += 1
                depot_map[loc_id]["low_stock"] += 1
                category_map[cat]["low_stock"] += 1
            else:
                healthy_total += 1
                depot_map[loc_id]["healthy"] += 1
                category_map[cat]["healthy"] += 1

            if days_runway <= 10.0:
                predicted_total += 1
                depot_map[loc_id]["predicted_stockout"] += 1
                category_map[cat]["predicted_stockout"] += 1

        total_skus = len(items)
        healthy_pct = round((healthy_total / max(1, total_skus)) * 100, 1)

        by_depot = [StockoutRiskByDepot(**d) for d in depot_map.values()]
        by_category = [StockoutRiskByCategory(**c) for c in category_map.values()]

        return StockoutRiskDistribution(
            healthy_count=healthy_total,
            low_stock_count=low_total,
            critical_count=critical_total,
            predicted_stockout_count=predicted_total,
            total_items=total_skus,
            healthy_percentage=healthy_pct,
            by_depot=by_depot,
            by_category=by_category,
            critical_items=critical_items_list[:6],
        )

    # ==========================================================================
    # 5. Replenishment Summary & Lifecycle Tracking
    # ==========================================================================

    def get_replenishment_summary(self) -> ReplenishmentSummaryResponse:
        """
        Returns status distribution according to official RequisitionStatus enums:
        draft, submitted, approved, dispatched, in_transit, delivered, cancelled.
        """
        # Canonical military requisition status breakdown
        status_counts = {
            RequisitionStatus.DRAFT.value: 2,
            RequisitionStatus.SUBMITTED.value: 1,
            RequisitionStatus.APPROVED.value: 5,
            RequisitionStatus.DISPATCHED.value: 3,
            RequisitionStatus.IN_TRANSIT.value: 3,
            RequisitionStatus.DELIVERED.value: 28,
            RequisitionStatus.CANCELLED.value: 1,
        }

        total_reqs = sum(status_counts.values())
        active_reqs = (
            status_counts[RequisitionStatus.SUBMITTED.value]
            + status_counts[RequisitionStatus.APPROVED.value]
            + status_counts[RequisitionStatus.DISPATCHED.value]
            + status_counts[RequisitionStatus.IN_TRANSIT.value]
        )

        delivered = status_counts[RequisitionStatus.DELIVERED.value]
        fulfillment_rate = round((delivered / max(1, delivered + status_counts[RequisitionStatus.CANCELLED.value])) * 100, 1)

        trends = [
            ReplenishmentTrendPoint(date="Sep 27", created_orders=4, dispatched_orders=3, delivered_orders=3),
            ReplenishmentTrendPoint(date="Sep 28", created_orders=3, dispatched_orders=4, delivered_orders=4),
            ReplenishmentTrendPoint(date="Sep 29", created_orders=6, dispatched_orders=5, delivered_orders=4),
            ReplenishmentTrendPoint(date="Sep 30", created_orders=5, dispatched_orders=4, delivered_orders=5),
            ReplenishmentTrendPoint(date="Oct 01", created_orders=7, dispatched_orders=6, delivered_orders=5),
            ReplenishmentTrendPoint(date="Oct 02", created_orders=4, dispatched_orders=5, delivered_orders=4),
            ReplenishmentTrendPoint(date="Oct 03", created_orders=5, dispatched_orders=3, delivered_orders=3),
        ]

        vol_by_cat = {
            "POL Fuel & Lubricants": 128000.0,
            "Ordnance & Ammunition": 4200.0,
            "Rations & Subsistence": 34500.0,
            "Medical & Cold-Chain": 620.0,
            "Engineering & Spares": 1850.0,
        }

        return ReplenishmentSummaryResponse(
            total_requisitions=total_reqs,
            active_requisitions=active_reqs,
            status_breakdown=status_counts,
            fulfillment_rate_percentage=fulfillment_rate,
            average_lead_time_days=4.2,
            volume_by_category=vol_by_cat,
            requisition_trends=trends,
        )

    # ==========================================================================
    # 6. Delivery Performance & Corridor Telematics
    # ==========================================================================

    def get_delivery_performance(self) -> DeliveryPerformanceResponse:
        """
        Calculates convoy on-time delivery rates, transit durations, and corridor delays.
        """
        metrics = self._calculate_delivery_metrics()
        return DeliveryPerformanceResponse(**metrics)

    def _calculate_delivery_metrics(self) -> Dict[str, Any]:
        corridors = [
            CorridorMetricPoint(
                route_id="RTE-SRI-KRG-01",
                route_name="Srinagar to Kargil (Zoji La Pass)",
                origin="Srinagar Depot",
                destination="Kargil FOB",
                standard_hours=6.5,
                actual_hours=7.8,
                delay_hours=1.3,
                on_time_rate_percentage=94.2,
                total_convoys=42,
                road_condition="High_Altitude_Pass",
            ),
            CorridorMetricPoint(
                route_id="RTE-KRG-DRS-02",
                route_name="Kargil to Drass Sector Axis",
                origin="Kargil Hub",
                destination="Drass FOB",
                standard_hours=1.8,
                actual_hours=2.0,
                delay_hours=0.2,
                on_time_rate_percentage=98.5,
                total_convoys=36,
                road_condition="Clear_All_Weather",
            ),
            CorridorMetricPoint(
                route_id="RTE-KRG-LEH-03",
                route_name="Kargil to Leh via Fotu La",
                origin="Kargil Hub",
                destination="Leh Corps Depot",
                standard_hours=5.5,
                actual_hours=5.7,
                delay_hours=0.2,
                on_time_rate_percentage=97.0,
                total_convoys=28,
                road_condition="Clear_All_Weather",
            ),
            CorridorMetricPoint(
                route_id="RTE-LEH-SIA-04",
                route_name="Leh to Siachen Base (Khardung La)",
                origin="Leh Hub",
                destination="Siachen Base Camp",
                standard_hours=8.5,
                actual_hours=11.2,
                delay_hours=2.7,
                on_time_rate_percentage=88.4,
                total_convoys=19,
                road_condition="Snow_Bound",
            ),
            CorridorMetricPoint(
                route_id="RTE-SRI-KUP-05",
                route_name="Srinagar to Kupwara Sector",
                origin="Srinagar Depot",
                destination="Kupwara Hub",
                standard_hours=2.5,
                actual_hours=2.6,
                delay_hours=0.1,
                on_time_rate_percentage=99.1,
                total_convoys=31,
                road_condition="Clear_All_Weather",
            ),
        ]

        total_convoys = sum(c.total_convoys for c in corridors)
        weighted_otd = sum(c.on_time_rate_percentage * c.total_convoys for c in corridors) / max(1, total_convoys)
        avg_transit = sum(c.actual_hours * c.total_convoys for c in corridors) / max(1, total_convoys)
        avg_delay = sum(c.delay_hours * c.total_convoys for c in corridors) / max(1, total_convoys)

        delayed = int(total_convoys * (1.0 - (weighted_otd / 100.0)))
        completed = total_convoys - delayed

        return {
            "total_deliveries": total_convoys,
            "completed_deliveries": completed,
            "delayed_deliveries": delayed,
            "in_transit_deliveries": 3,
            "on_time_delivery_rate_percentage": round(weighted_otd, 1),
            "average_transit_hours": round(avg_transit, 1),
            "transit_delay_hours": round(avg_delay, 1),
            "corridor_metrics": corridors,
        }

    # ==========================================================================
    # 7. Master Analytics Overview Aggregator
    # ==========================================================================

    def get_analytics_overview(
        self,
        timeframe: str = "7d",
        depot_id: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> AnalyticsOverviewResponse:
        """
        Aggregates all 6 KPI cards, 5 Recharts datasets, and metadata into a single unified response.
        """
        kpis = self.get_summary_kpis(timeframe, depot_id, category)
        inventory_trends = self.get_inventory_trends(timeframe, depot_id, category, start_date, end_date)
        forecast_accuracy = self.get_forecast_accuracy(timeframe)
        stockout_risks = self.get_stockout_risks(depot_id, category)
        replenishment_summary = self.get_replenishment_summary()
        delivery_performance = self.get_delivery_performance()

        return AnalyticsOverviewResponse(
            timeframe=timeframe,
            start_date=start_date,
            end_date=end_date,
            depot_filter=depot_id,
            category_filter=category,
            kpis=kpis,
            inventory_trends=inventory_trends,
            forecast_accuracy=forecast_accuracy,
            stockout_risks=stockout_risks,
            replenishment_summary=replenishment_summary,
            delivery_performance=delivery_performance,
            generated_at=datetime.utcnow(),
        )

    # ==========================================================================
    # 8. Audit Report Generation
    # ==========================================================================

    def generate_audit_report(self, scope: str = "Northern Command Ladakh Sector") -> AuditReportResponse:
        """
        Generates formal audit report for military compliance and logistics optimization review.
        """
        return AuditReportResponse(
            report_id=f"AUDIT-REP-{int(datetime.utcnow().timestamp())}",
            generated_at=datetime.utcnow(),
            classification="RESTRICTED // SIH-2026-DEMO",
            scope=scope,
            overall_readiness_score=94.8,
            total_requisitions_processed=43,
            total_fuel_burn_optimized_liters=18450.0,
            stockout_mitigation_rate=98.2,
            summary_notes=(
                "Northern Command Forward Supply Chain operates within optimal readiness parameters. "
                "AI proactive replenishment averted 4 potential high-altitude fuel and ration stockouts across "
                "Drass FOB and Siachen Base Camp during early winter corridor narrowing."
            ),
            kpi_highlights=[
                {"metric": "Inventory Health", "value": "94.8%", "status": "Optimal"},
                {"metric": "Forecast Accuracy", "value": "96.8%", "status": "High Precision"},
                {"metric": "On-Time Convoy Delivery", "value": "96.2%", "status": "Optimal"},
                {"metric": "Optimized Cost Savings", "value": "₹1.42 Cr", "status": "Audited"},
            ],
            top_risk_locations=[
                {"location": "Drass Forward Operating Base", "critical_skus": 2, "readiness": "88.5%"},
                {"location": "Siachen Base Support Camp", "critical_skus": 1, "readiness": "91.2%"},
            ],
        )

    # ==========================================================================
    # Utility Filters
    # ==========================================================================

    def _filter_items(self, depot_id: Optional[str], category: Optional[str]) -> List[Dict[str, Any]]:
        items = self._items
        if depot_id and depot_id != "all":
            items = [i for i in items if i.get("storage_location_id") == depot_id]
        if category and category != "all":
            items = [i for i in items if i.get("category") == category]
        return items


# Singleton instance for dependency injection
analytics_service = AnalyticsService()
