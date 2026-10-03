/**
 * LogiPredict AI - Analytics & Telematics Data Service
 * ===================================================
 * Client-side data management, mathematical metric aggregation,
 * and resilient API synchronizer for the Executive Analytics Dashboard.
 *
 * Indian Army Forward Supply Chain (SIH 2026)
 */

import { analyticsApi } from '../../services/apiClient';

export const DEPOT_OPTIONS = [
  { id: 'all', name: 'All Command Depots' },
  { id: 'LOC-SRI-01', name: 'Srinagar Central Logistics Depot' },
  { id: 'LOC-KRG-02', name: 'Kargil Forward Logistics Hub' },
  { id: 'LOC-LEH-03', name: 'Leh Corps Supply Depot' },
  { id: 'LOC-DRS-04', name: 'Drass Forward Operating Base' },
  { id: 'LOC-SIA-05', name: 'Siachen Base Support Camp' },
  { id: 'LOC-KUP-06', name: 'Kupwara Forward Support Hub' },
];

export const CATEGORY_OPTIONS = [
  { id: 'all', name: 'All Supply Categories' },
  { id: 'POL', name: 'POL Fuel & Lubricants' },
  { id: 'Ordnance & Ammunition', name: 'Ordnance & Ammunition' },
  { id: 'Rations & Subsistence', name: 'Rations & Subsistence' },
  { id: 'Medical & Cold-Chain', name: 'Medical & Cold-Chain' },
  { id: 'Engineering & Spares', name: 'Engineering & Spares' },
];

export const TIMEFRAME_OPTIONS = [
  { id: '24h', label: 'Last 24 Hours', resolution: 'hourly' },
  { id: '7d', label: 'Last 7 Days', resolution: 'daily' },
  { id: '30d', label: 'Last 30 Days', resolution: 'daily' },
  { id: 'custom', label: 'Custom Range', resolution: 'daily' },
];

// Fallback KPIs
export const FALLBACK_KPIS = [
  {
    id: 'total-inventory-value',
    title: 'Total Inventory Value',
    value: '₹42.85 Cr',
    raw_number: 42.85,
    rawNumber: 42.85,
    unit: 'INR',
    change: '+3.4%',
    trend: 'up',
    is_positive: true,
    isPositive: true,
    timeframe: 'vs last week',
    description: '142,850 units total on-hand across forward nodes',
    status: 'Audited',
    status_variant: 'brand',
    statusVariant: 'brand',
    icon_name: 'Boxes',
    iconName: 'Boxes',
    color_scheme: 'indigo',
    colorScheme: 'indigo',
  },
  {
    id: 'avg-inventory-health',
    title: 'Average Inventory Health',
    value: '94.8%',
    raw_number: 94.8,
    rawNumber: 94.8,
    unit: 'Readiness',
    change: '+2.1%',
    trend: 'up',
    is_positive: true,
    isPositive: true,
    timeframe: 'vs last week',
    description: 'Composite multi-echelon stock readiness index',
    status: 'Optimal',
    status_variant: 'success',
    statusVariant: 'success',
    icon_name: 'PackageCheck',
    iconName: 'PackageCheck',
    color_scheme: 'emerald',
    colorScheme: 'emerald',
  },
  {
    id: 'forecast-accuracy',
    title: 'Forecast Accuracy',
    value: '96.8%',
    raw_number: 96.8,
    rawNumber: 96.8,
    unit: 'Accuracy',
    change: '-0.8% MAPE (3.2%)',
    trend: 'up',
    is_positive: true,
    isPositive: true,
    timeframe: 'vs last week',
    description: 'Neural model MAPE 3.2% across forward demands',
    status: 'High Precision',
    status_variant: 'success',
    statusVariant: 'success',
    icon_name: 'TrendingUp',
    iconName: 'TrendingUp',
    color_scheme: 'purple',
    colorScheme: 'purple',
  },
  {
    id: 'critical-stockout-risks',
    title: 'Critical Stockout Risks',
    value: '2',
    raw_number: 2.0,
    rawNumber: 2.0,
    unit: 'SKUs At Risk',
    change: '-1 vs yesterday',
    trend: 'down',
    is_positive: true,
    isPositive: true,
    timeframe: 'vs last week',
    description: '4 warning items nearing reorder trigger',
    status: 'Action Needed',
    status_variant: 'warning',
    statusVariant: 'warning',
    icon_name: 'AlertOctagon',
    iconName: 'AlertOctagon',
    color_scheme: 'rose',
    colorScheme: 'rose',
  },
  {
    id: 'pending-replenishments',
    title: 'Pending Replenishments',
    value: '8',
    raw_number: 8.0,
    rawNumber: 8.0,
    unit: 'Active Orders',
    change: '+2 new orders',
    trend: 'up',
    is_positive: true,
    isPositive: true,
    timeframe: 'vs last week',
    description: '3 in transit, 5 approved at Base Depot',
    status: 'Active Pipeline',
    status_variant: 'info',
    statusVariant: 'info',
    icon_name: 'FileSpreadsheet',
    iconName: 'FileSpreadsheet',
    color_scheme: 'blue',
    colorScheme: 'blue',
  },
  {
    id: 'on-time-delivery-rate',
    title: 'On-Time Delivery Rate',
    value: '96.2%',
    raw_number: 96.2,
    rawNumber: 96.2,
    unit: 'OTD Rate',
    change: '+1.4%',
    trend: 'up',
    is_positive: true,
    isPositive: true,
    timeframe: 'vs last week',
    description: 'Mean convoy transit 6.8h across strategic passes',
    status: 'Optimal',
    status_variant: 'success',
    statusVariant: 'success',
    icon_name: 'Truck',
    iconName: 'Truck',
    color_scheme: 'amber',
    colorScheme: 'amber',
  },
];

// Fallback Inventory Trends Data (7 Days)
export const FALLBACK_INVENTORY_TRENDS = {
  timeframe: '7d',
  resolution: 'daily',
  depot_id: null,
  category: null,
  data: [
    { timestamp: '2026-09-27', date: 'Sep 27', total_stock: 138500, stock_in: 12500, stock_out: 4720, safety_threshold: 35000, net_velocity: 7780 },
    { timestamp: '2026-09-28', date: 'Sep 28', total_stock: 141200, stock_in: 7500, stock_out: 4800, safety_threshold: 35000, net_velocity: 2700 },
    { timestamp: '2026-09-29', date: 'Sep 29', total_stock: 139900, stock_in: 3500, stock_out: 4950, safety_threshold: 35000, net_velocity: -1450 },
    { timestamp: '2026-09-30', date: 'Sep 30', total_stock: 137800, stock_in: 2800, stock_out: 4900, safety_threshold: 35000, net_velocity: -2100 },
    { timestamp: '2026-10-01', date: 'Oct 01', total_stock: 144200, stock_in: 11200, stock_out: 4800, safety_threshold: 35000, net_velocity: 6400 },
    { timestamp: '2026-10-02', date: 'Oct 02', total_stock: 142100, stock_in: 2600, stock_out: 4700, safety_threshold: 35000, net_velocity: -2100 },
    { timestamp: '2026-10-03', date: 'Oct 03', total_stock: 142850, stock_in: 5500, stock_out: 4750, safety_threshold: 35000, net_velocity: 750 },
  ],
  summary: {
    current_stock: 142850,
    total_inflow: 45600,
    total_outflow: 33620,
    net_change: 11980,
    turnover_rate: 0.235,
  },
};

// Fallback Forecast Accuracy Data
export const FALLBACK_FORECAST_ACCURACY = {
  timeframe: '7d',
  mape: 3.2,
  mae: 142.5,
  rmse: 185.0,
  accuracy_percentage: 96.8,
  r_squared: 0.968,
  data: [
    { date: 'Sep 27', actual_demand: 4650, forecasted_demand: 4580, residual_error: 70, absolute_error: 70, percentage_error: 1.5 },
    { date: 'Sep 28', actual_demand: 4820, forecasted_demand: 4710, residual_error: 110, absolute_error: 110, percentage_error: 2.3 },
    { date: 'Sep 29', actual_demand: 5120, forecasted_demand: 4980, residual_error: 140, absolute_error: 140, percentage_error: 2.7 },
    { date: 'Sep 30', actual_demand: 4950, forecasted_demand: 5100, residual_error: -150, absolute_error: 150, percentage_error: 3.0 },
    { date: 'Oct 01', actual_demand: 5280, forecasted_demand: 5120, residual_error: 160, absolute_error: 160, percentage_error: 3.0 },
    { date: 'Oct 02', actual_demand: 4790, forecasted_demand: 4940, residual_error: -150, absolute_error: 150, percentage_error: 3.1 },
    { date: 'Oct 03', actual_demand: 4890, forecasted_demand: 4780, residual_error: 110, absolute_error: 110, percentage_error: 2.2 },
  ],
};

// Fallback Stockout Risk Distribution
export const FALLBACK_STOCKOUT_RISKS = {
  healthy_count: 19,
  low_stock_count: 4,
  critical_count: 2,
  predicted_stockout_count: 3,
  total_items: 25,
  healthy_percentage: 76.0,
  by_depot: [
    { depot_id: 'LOC-SRI-01', depot_name: 'Srinagar Central Depot', healthy: 6, low_stock: 0, critical: 0, predicted_stockout: 0 },
    { depot_id: 'LOC-KRG-02', depot_name: 'Kargil Forward Hub', healthy: 4, low_stock: 1, critical: 0, predicted_stockout: 1 },
    { depot_id: 'LOC-LEH-03', depot_name: 'Leh Corps Depot', healthy: 5, low_stock: 1, critical: 0, predicted_stockout: 0 },
    { depot_id: 'LOC-DRS-04', depot_name: 'Drass Forward Base', healthy: 2, low_stock: 1, critical: 1, predicted_stockout: 1 },
    { depot_id: 'LOC-SIA-05', depot_name: 'Siachen Base Camp', healthy: 1, low_stock: 1, critical: 1, predicted_stockout: 1 },
    { depot_id: 'LOC-KUP-06', depot_name: 'Kupwara Support Hub', healthy: 1, low_stock: 0, critical: 0, predicted_stockout: 0 },
  ],
  by_category: [
    { category: 'POL', healthy: 5, low_stock: 1, critical: 1, predicted_stockout: 1 },
    { category: 'Ordnance & Ammunition', healthy: 6, low_stock: 1, critical: 0, predicted_stockout: 0 },
    { category: 'Rations & Subsistence', healthy: 4, low_stock: 1, critical: 0, predicted_stockout: 1 },
    { category: 'Medical & Cold-Chain', healthy: 2, low_stock: 1, critical: 1, predicted_stockout: 1 },
    { category: 'Engineering & Spares', healthy: 2, low_stock: 0, critical: 0, predicted_stockout: 0 },
  ],
  critical_items: [
    { item_id: 'SKU-POL-001', item_name: 'High-Altitude Diesel Fuel (POL-HAD)', category: 'POL', location_name: 'Drass Forward Operating Base', current_stock: 8500, min_threshold: 12000, days_coverage: 3.4, unit: 'Liters', risk_level: 'Critical' },
    { item_id: 'SKU-MED-002', item_name: 'Plasma & Blood Biological Kits', category: 'Medical & Cold-Chain', location_name: 'Siachen Base Support Camp', current_stock: 45, min_threshold: 80, days_coverage: 2.8, unit: 'Kits', risk_level: 'Critical' },
    { item_id: 'SKU-RAT-003', item_name: 'Extreme Cold Combat Rations MRE', category: 'Rations & Subsistence', location_name: 'Kargil Forward Logistics Hub', current_stock: 2400, min_threshold: 2800, days_coverage: 5.2, unit: 'Packs', risk_level: 'Warning' },
  ],
};

// Fallback Replenishment Summary
export const FALLBACK_REPLENISHMENT_SUMMARY = {
  total_requisitions: 43,
  active_requisitions: 8,
  status_breakdown: {
    draft: 2,
    submitted: 1,
    approved: 5,
    dispatched: 3,
    in_transit: 3,
    delivered: 28,
    cancelled: 1,
  },
  fulfillment_rate_percentage: 96.5,
  average_lead_time_days: 4.2,
  volume_by_category: {
    'POL Fuel & Lubricants': 128000.0,
    'Ordnance & Ammunition': 4200.0,
    'Rations & Subsistence': 34500.0,
    'Medical & Cold-Chain': 620.0,
    'Engineering & Spares': 1850.0,
  },
  requisition_trends: [
    { date: 'Sep 27', created_orders: 4, dispatched_orders: 3, delivered_orders: 3 },
    { date: 'Sep 28', created_orders: 3, dispatched_orders: 4, delivered_orders: 4 },
    { date: 'Sep 29', created_orders: 6, dispatched_orders: 5, delivered_orders: 4 },
    { date: 'Sep 30', created_orders: 5, dispatched_orders: 4, delivered_orders: 5 },
    { date: 'Oct 01', created_orders: 7, dispatched_orders: 6, delivered_orders: 5 },
    { date: 'Oct 02', created_orders: 4, dispatched_orders: 5, delivered_orders: 4 },
    { date: 'Oct 03', created_orders: 5, dispatched_orders: 3, delivered_orders: 3 },
  ],
};

// Fallback Delivery Performance
export const FALLBACK_DELIVERY_PERFORMANCE = {
  total_deliveries: 156,
  completed_deliveries: 150,
  delayed_deliveries: 6,
  in_transit_deliveries: 3,
  on_time_delivery_rate_percentage: 96.2,
  average_transit_hours: 6.8,
  transit_delay_hours: 0.9,
  corridor_metrics: [
    { route_id: 'RTE-SRI-KRG-01', route_name: 'Srinagar to Kargil (Zoji La Pass)', origin: 'Srinagar Depot', destination: 'Kargil FOB', standard_hours: 6.5, actual_hours: 7.8, delay_hours: 1.3, on_time_rate_percentage: 94.2, total_convoys: 42, road_condition: 'High_Altitude_Pass' },
    { route_id: 'RTE-KRG-DRS-02', route_name: 'Kargil to Drass Sector Axis', origin: 'Kargil Hub', destination: 'Drass FOB', standard_hours: 1.8, actual_hours: 2.0, delay_hours: 0.2, on_time_rate_percentage: 98.5, total_convoys: 36, road_condition: 'Clear_All_Weather' },
    { route_id: 'RTE-KRG-LEH-03', route_name: 'Kargil to Leh via Fotu La', origin: 'Kargil Hub', destination: 'Leh Corps Depot', standard_hours: 5.5, actual_hours: 5.7, delay_hours: 0.2, on_time_rate_percentage: 97.0, total_convoys: 28, road_condition: 'Clear_All_Weather' },
    { route_id: 'RTE-LEH-SIA-04', route_name: 'Leh to Siachen Base (Khardung La)', origin: 'Leh Hub', destination: 'Siachen Base Camp', standard_hours: 8.5, actual_hours: 11.2, delay_hours: 2.7, on_time_rate_percentage: 88.4, total_convoys: 19, road_condition: 'Snow_Bound' },
    { route_id: 'RTE-SRI-KUP-05', route_name: 'Srinagar to Kupwara Sector', origin: 'Srinagar Depot', destination: 'Kupwara Hub', standard_hours: 2.5, actual_hours: 2.6, delay_hours: 0.1, on_time_rate_percentage: 99.1, total_convoys: 31, road_condition: 'Clear_All_Weather' },
  ],
};

class AnalyticsDataService {
  /**
   * Fetch complete unified analytics overview with offline fallback
   */
  async getOverview(params = {}) {
    try {
      const response = await analyticsApi.getOverview(params);
      if (response && response.kpis) {
        return response;
      }
    } catch (err) {
      console.warn('[AnalyticsDataService] Backend overview call failed, utilizing local fallback engine:', err.message);
    }

    return {
      timeframe: params.timeframe || '7d',
      start_date: params.start_date || null,
      end_date: params.end_date || null,
      depot_filter: params.depot_id || null,
      category_filter: params.category || null,
      kpis: FALLBACK_KPIS,
      inventory_trends: FALLBACK_INVENTORY_TRENDS,
      forecast_accuracy: FALLBACK_FORECAST_ACCURACY,
      stockout_risks: FALLBACK_STOCKOUT_RISKS,
      replenishment_summary: FALLBACK_REPLENISHMENT_SUMMARY,
      delivery_performance: FALLBACK_DELIVERY_PERFORMANCE,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Generate CSV export content from overview metrics
   */
  exportToCsv(overview) {
    if (!overview) return '';
    const rows = [];

    // Header
    rows.push(['LogiPredict AI - Forward Logistics Executive Analytics Report']);
    rows.push([`Generated At: ${new Date().toISOString()}`]);
    rows.push([`Timeframe: ${overview.timeframe || '7d'}`]);
    rows.push([]);

    // 1. Executive KPIs
    rows.push(['--- 1. EXECUTIVE SUMMARY KPIS ---']);
    rows.push(['Metric ID', 'Title', 'Value', 'Unit', 'Change', 'Status', 'Description']);
    (overview.kpis || []).forEach(k => {
      rows.push([k.id, k.title, k.value, k.unit || '', k.change, k.status || '', k.description || '']);
    });
    rows.push([]);

    // 2. Inventory Trends
    rows.push(['--- 2. INVENTORY TRENDS ---']);
    rows.push(['Date', 'Total Stock', 'Stock In', 'Stock Out', 'Safety Threshold', 'Net Velocity']);
    (overview.inventory_trends?.data || []).forEach(p => {
      rows.push([p.date, p.total_stock, p.stock_in, p.stock_out, p.safety_threshold, p.net_velocity]);
    });
    rows.push([]);

    // 3. Forecast Accuracy
    rows.push(['--- 3. FORECAST ACCURACY & RESIDUALS ---']);
    rows.push([`MAPE: ${overview.forecast_accuracy?.mape}%`, `MAE: ${overview.forecast_accuracy?.mae}`, `Accuracy: ${overview.forecast_accuracy?.accuracy_percentage}%`]);
    rows.push(['Date', 'Actual Demand', 'Forecasted Demand', 'Residual Error', 'Percentage Error (%)']);
    (overview.forecast_accuracy?.data || []).forEach(p => {
      rows.push([p.date, p.actual_demand, p.forecasted_demand, p.residual_error, p.percentage_error]);
    });
    rows.push([]);

    // 4. Corridor Telematics
    rows.push(['--- 4. CONVOY CORRIDOR TELEMATICS ---']);
    rows.push(['Route ID', 'Corridor Name', 'Standard Hours', 'Actual Hours', 'Delay (Hours)', 'OTD Rate (%)', 'Road Condition']);
    (overview.delivery_performance?.corridor_metrics || []).forEach(c => {
      rows.push([c.route_id, c.route_name, c.standard_hours, c.actual_hours, c.delay_hours, c.on_time_rate_percentage, c.road_condition]);
    });

    return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  /**
   * Generate JSON export payload
   */
  exportToJson(overview) {
    return JSON.stringify(overview || {}, null, 2);
  }
}

export const analyticsDataService = new AnalyticsDataService();
export default analyticsDataService;
