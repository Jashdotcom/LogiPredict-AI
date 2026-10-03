/**
 * LogiPredict AI - Analytics & Telematics Data Service
 * ===================================================
 * Client-side data management, mathematical metric aggregation,
 * CSV export generators, and resilient API synchronizer for the Executive Analytics Dashboard.
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

// Fallback Master Demo Report
export const FALLBACK_DEMO_REPORT = {
  report_id: 'REP-HQNC-2026-DEMO-MASTER',
  title: 'HQ Northern Command Master Readiness & Logistics Report',
  subtitle: 'Multi-Echelon Telematics, AI Forecasting Diagnostics & Stockout Risk Audit',
  classification: 'RESTRICTED // HQ NC // SIH 2026',
  generated_at: new Date().toISOString(),
  period: 'Last 7 Days (Standard Military Assessment)',
  scope: 'Northern Command Forward Supply Chain (Ladakh & Kashmir Sectors)',
  disclaimer: 'SYNTHETIC DATA DISCLAIMER: All metrics, inventory figures, convoy telematics, and demand projections are simulated for demonstration, research, and testing purposes under the Smart India Hackathon (SIH 2026) framework.',
  executive_summary: {
    total_skus_tracked: 25,
    overall_inventory_health_percentage: 94.8,
    total_valuation_inr: '₹42.85 Cr',
    critical_stockout_skus: 2,
    warning_stockout_skus: 4,
    pending_replenishments: 8,
    active_anomaly_alerts: 4,
    forecast_model_accuracy_percentage: 96.8,
    mean_absolute_percentage_error: 3.2,
    on_time_delivery_rate_percentage: 96.2,
    total_convoy_missions_completed: 156,
    key_takeaways: [
      'Forward echelon fuel (POL) reserves at Drass FOB require immediate top-off before winter closure.',
      'Siachen sector biological cold-chain supplies need expedited replenishment via emergency rotary airlift.',
      'AI demand forecasting MAPE remains within 3.2% high-precision tolerance across all northern nodes.',
      'Corridor transit via Zoji La experiencing an average 1.3h delay due to high-altitude pass congestion.',
    ],
  },
  inventory_analysis: {
    total_items: 25,
    healthy_items: 19,
    low_stock_items: 4,
    critical_items_count: 2,
    depots_audited: 6,
    category_distribution: {
      POL: 7,
      'Ordnance & Ammunition': 7,
      'Rations & Subsistence': 5,
      'Medical & Cold-Chain': 4,
      'Engineering & Spares': 2,
    },
    critical_watchlist: [
      { sku: 'SKU-POL-001', name: 'High-Altitude Diesel Fuel (POL-HAD)', depot: 'Drass Forward Operating Base', on_hand: 8500, min_threshold: 12000, days_of_cover: 3.4, unit: 'Liters', status: 'CRITICAL' },
      { sku: 'SKU-MED-002', name: 'Plasma & Blood Biological Kits', depot: 'Siachen Base Support Camp', on_hand: 45, min_threshold: 80, days_of_cover: 2.8, unit: 'Kits', status: 'CRITICAL' },
      { sku: 'SKU-RAT-003', name: 'Extreme Cold Combat Rations MRE', depot: 'Kargil Forward Logistics Hub', on_hand: 2400, min_threshold: 2800, days_of_cover: 5.2, unit: 'Packs', status: 'WARNING' },
    ],
  },
  forecasting_analysis: {
    model_architecture: 'Hybrid LSTM + Prophet with Ridge Baseline Ensemble',
    evaluation_timeframe: '7d',
    mape: 3.2,
    mae: 142.5,
    rmse: 185.0,
    r_squared: 0.968,
    accuracy_percentage: 96.8,
    evaluation_series: [
      { date: 'Sep 27', actual: 4650, forecasted: 4580, residual: 70, error_pct: 1.5 },
      { date: 'Sep 28', actual: 4820, forecasted: 4710, residual: 110, error_pct: 2.3 },
      { date: 'Sep 29', actual: 5120, forecasted: 4980, residual: 140, error_pct: 2.7 },
      { date: 'Sep 30', actual: 4950, forecasted: 5100, residual: -150, error_pct: 3.0 },
      { date: 'Oct 01', actual: 5280, forecasted: 5120, residual: 160, error_pct: 3.0 },
      { date: 'Oct 02', actual: 4790, forecasted: 4940, residual: -150, error_pct: 3.1 },
      { date: 'Oct 03', actual: 4890, forecasted: 4780, residual: 110, error_pct: 2.2 },
    ],
  },
  predictive_alerts_summary: {
    total_alerts: 6,
    critical_alerts: 2,
    warning_alerts: 3,
    info_alerts: 1,
    active_count: 4,
    resolved_count: 2,
    top_alerts: [
      { alert_id: 'ALT-2026-POL-DRS', type: 'Stockout Risk', severity: 'critical', depot: 'Drass FOB', trigger: 'POL-HAD buffer below 3.5 days cover', action: 'Dispatch 12,000L emergency POL bowser convoy from Srinagar Depot.' },
      { alert_id: 'ALT-2026-MED-SIA', type: 'Cold Chain Expiry Risk', severity: 'critical', depot: 'Siachen Base Camp', trigger: 'Biological kits temperature alert & sub-3 day inventory', action: 'Initiate rotary airlift replenishment from Leh Corps Supply Depot.' },
      { alert_id: 'ALT-2026-CON-ZOJ', type: 'Corridor Transit Delay', severity: 'warning', depot: 'Zoji La Corridor', trigger: 'Convoy transit delay exceeding 1.2h SLA', action: 'Reroute secondary logistics echelon via alternate axis.' },
    ],
  },
  logistics_performance: {
    total_missions: 156,
    completed_missions: 150,
    on_time_delivery_rate: 96.2,
    fleet_average_transit_hours: 6.8,
    corridors: [
      { name: 'Srinagar to Kargil (Zoji La Pass)', standard_hours: 6.5, actual_hours: 7.8, delay_hours: 1.3, otd_pct: 94.2, status: 'High_Altitude_Pass' },
      { name: 'Kargil to Drass Sector Axis', standard_hours: 1.8, actual_hours: 2.0, delay_hours: 0.2, otd_pct: 98.5, status: 'Clear_All_Weather' },
      { name: 'Kargil to Leh via Fotu La', standard_hours: 5.5, actual_hours: 5.7, delay_hours: 0.2, otd_pct: 97.0, status: 'Clear_All_Weather' },
      { name: 'Leh to Siachen Base (Khardung La)', standard_hours: 8.5, actual_hours: 11.2, delay_hours: 2.7, otd_pct: 88.4, status: 'Snow_Bound' },
      { name: 'Srinagar to Kupwara Sector', standard_hours: 2.5, actual_hours: 2.6, delay_hours: 0.1, otd_pct: 99.1, status: 'Clear_All_Weather' },
    ],
  },
  strategic_recommendations: [
    {
      priority: 'URGENT',
      category: 'POL',
      title: 'Emergency Fuel Top-off for Drass Sector',
      description: 'Projected severe weather window in 48 hours will close Zoji La pass. Immediate dispatch of 2 heavy POL bowsers required.',
      target_node: 'Drass Forward Operating Base (LOC-DRS-04)',
      suggested_action: 'Issue Command Dispatch Order for 2x 10,000L POL tankers from Srinagar Base.',
      requires_human_review: true,
    },
    {
      priority: 'URGENT',
      category: 'Medical',
      title: 'Airlift Critical Blood Plasma Units to Siachen Camp',
      description: 'Siachen Base Camp reserve is down to 2.8 days of cover. Ground transit via Khardung La is impeded by fresh snow.',
      target_node: 'Siachen Base Support Camp (LOC-SIA-05)',
      suggested_action: 'Coordinate with Army Aviation for priority helicopter resupply mission.',
      requires_human_review: true,
    },
    {
      priority: 'HIGH',
      category: 'Buffer',
      title: 'Adjust Safety Thresholds for Winter Stocking Phase',
      description: 'Winter buffer multiplier (+25%) should be enabled for all non-perishable combat rations at Kargil and Leh depots.',
      target_node: 'Kargil Forward Logistics Hub (LOC-KRG-02)',
      suggested_action: 'Approve AI automated safety stock recalculation rule.',
      requires_human_review: true,
    },
    {
      priority: 'MEDIUM',
      category: 'Route',
      title: 'Optimize Convoy Departure Times for Fotu La Pass',
      description: 'Shifting departure schedule by -90 minutes avoids afternoon icing and reduces mean transit time by 0.6 hours.',
      target_node: 'Kargil-Leh Axis (RTE-KRG-LEH-03)',
      suggested_action: 'Update standard convoy operating timetable in Fleet Management.',
      requires_human_review: false,
    },
  ],
  certification: {
    status: 'DIGITALLY VERIFIED',
    hash: 'SHA256:8f4c2b9a71d8e03e5c9a1b4f6d7e8c0a3b2e1f9a8d7c6b5a4e3f2d1c0b9a8f7e',
    certifying_officer: 'Col. V. K. Sharma, SM',
    designation: 'Staff Officer (Logistics), HQ Northern Command',
    system_engine: 'LogiPredict AI Telematics & Predictive Decision Engine v2.4',
  },
};

class AnalyticsDataService {
  /**
   * Helper: Trigger browser file download with blob/string
   */
  triggerDownload(content, filename, mimeType = 'text/csv;charset=utf-8;') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

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
   * 1. Export Inventory CSV (Phase 9.2)
   */
  async downloadInventoryCsv(params = {}) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = `logipredict_inventory_${todayStr}.csv`;

    try {
      const url = analyticsApi.getInventoryCsvUrl(params);
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        this.triggerDownload(text, filename, 'text/csv;charset=utf-8;');
        return { success: true, filename, source: 'backend' };
      }
    } catch (err) {
      console.warn('[AnalyticsDataService] API inventory CSV export failed, generating client-side fallback:', err);
    }

    // Client-side fallback CSV generator
    const rows = [
      ['SKU ID', 'Item Name', 'Category', 'Depot ID', 'Depot Name', 'Available Stock', 'Unit', 'Daily Burn Rate', 'Days of Cover', 'Safety Stock (Min)', 'Status', 'Total Valuation (INR)'],
      ['SKU-POL-001', 'High-Altitude Diesel Fuel (POL-HAD)', 'POL', 'LOC-DRS-04', 'Drass Forward Operating Base', '8500', 'Liters', '2500.0', '3.4', '12000', 'CRITICAL', '807500.0'],
      ['SKU-MED-002', 'Plasma & Blood Biological Kits', 'Medical & Cold-Chain', 'LOC-SIA-05', 'Siachen Base Support Camp', '45', 'Kits', '16.0', '2.8', '80', 'CRITICAL', '202500.0'],
      ['SKU-RAT-003', 'Extreme Cold Combat Rations MRE', 'Rations & Subsistence', 'LOC-KRG-02', 'Kargil Forward Logistics Hub', '2400', 'Packs', '460.0', '5.2', '2800', 'WARNING', '1080000.0'],
      ['SKU-ORD-004', '7.62mm NATO Small Arms Ammunition', 'Ordnance & Ammunition', 'LOC-LEH-03', 'Leh Corps Supply Depot', '45000', 'Rounds', '1200.0', '37.5', '15000', 'HEALTHY', '5400000.0'],
      ['SKU-ENG-005', 'Heavy Vehicle Cold Start Batteries', 'Engineering & Spares', 'LOC-SRI-01', 'Srinagar Central Logistics Depot', '320', 'Units', '12.0', '26.7', '100', 'HEALTHY', '3840000.0'],
    ];
    const csvString = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    this.triggerDownload(csvString, filename, 'text/csv;charset=utf-8;');
    return { success: true, filename, source: 'client-fallback' };
  }

  /**
   * 2. Export Demand Forecasts CSV (Phase 9.2)
   */
  async downloadForecastsCsv(params = {}) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = `logipredict_forecasts_${todayStr}.csv`;

    try {
      const url = analyticsApi.getForecastsCsvUrl(params);
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        this.triggerDownload(text, filename, 'text/csv;charset=utf-8;');
        return { success: true, filename, source: 'backend' };
      }
    } catch (err) {
      console.warn('[AnalyticsDataService] API forecasts CSV export failed, generating client-side fallback:', err);
    }

    const rows = [
      ['SKU ID', 'Item Name', 'Category', 'Depot ID', 'Depot Name', 'Forecast Date', 'Record Type', 'Predicted Demand', 'Actual Demand', 'Residual Error', 'Percentage Error (%)', 'Lower Confidence (95%)', 'Upper Confidence (95%)', 'Model Name', 'Horizon (Days)'],
      ['SKU-POL-001', 'High-Altitude Diesel Fuel', 'POL', 'LOC-DRS-04', 'Drass FOB', '2026-10-01', 'HISTORICAL', '5120.0', '5280.0', '160.0', '3.0%', '4915.2', '5324.8', 'Hybrid LSTM-Prophet Ensemble', '14'],
      ['SKU-POL-001', 'High-Altitude Diesel Fuel', 'POL', 'LOC-DRS-04', 'Drass FOB', '2026-10-02', 'HISTORICAL', '4940.0', '4790.0', '-150.0', '3.1%', '4742.4', '5137.6', 'Hybrid LSTM-Prophet Ensemble', '14'],
      ['SKU-POL-001', 'High-Altitude Diesel Fuel', 'POL', 'LOC-DRS-04', 'Drass FOB', '2026-10-03', 'HISTORICAL', '4780.0', '4890.0', '110.0', '2.2%', '4588.8', '4971.2', 'Hybrid LSTM-Prophet Ensemble', '14'],
      ['SKU-POL-001', 'High-Altitude Diesel Fuel', 'POL', 'LOC-DRS-04', 'Drass FOB', '2026-10-04', 'PROJECTION', '4850.0', 'N/A (Forward)', '0.0', 'N/A', '4510.5', '5189.5', 'Hybrid LSTM-Prophet Ensemble', '14'],
      ['SKU-POL-001', 'High-Altitude Diesel Fuel', 'POL', 'LOC-DRS-04', 'Drass FOB', '2026-10-05', 'PROJECTION', '5020.0', 'N/A (Forward)', '0.0', 'N/A', '4668.6', '5371.4', 'Hybrid LSTM-Prophet Ensemble', '14'],
    ];
    const csvString = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    this.triggerDownload(csvString, filename, 'text/csv;charset=utf-8;');
    return { success: true, filename, source: 'client-fallback' };
  }

  /**
   * 3. Export Predictive Alerts CSV (Phase 9.2)
   */
  async downloadAlertsCsv(params = {}) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = `logipredict_alerts_${todayStr}.csv`;

    try {
      const url = analyticsApi.getAlertsCsvUrl(params);
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        this.triggerDownload(text, filename, 'text/csv;charset=utf-8;');
        return { success: true, filename, source: 'backend' };
      }
    } catch (err) {
      console.warn('[AnalyticsDataService] API alerts CSV export failed, generating client-side fallback:', err);
    }

    const rows = [
      ['Alert ID', 'Anomaly Type', 'Severity', 'Depot ID', 'Depot Name', 'Related SKU', 'Item Name', 'Category', 'Description', 'Trigger Condition', 'Recommended Action', 'Status', 'Detected At', 'Acknowledged By', 'Resolved By', 'Resolution Notes'],
      ['ALT-2026-POL-DRS', 'Critical Stockout Risk', 'CRITICAL', 'LOC-DRS-04', 'Drass FOB', 'SKU-POL-001', 'High-Altitude Diesel Fuel (POL-HAD)', 'POL', 'POL-HAD fuel reserves in Drass FOB have dropped to 3.4 days of cover.', 'Available stock 8,500L < safety stock 12,000L', 'Dispatch emergency 12,000L POL bowser convoy from Srinagar Base Depot.', 'ACTIVE', '2026-10-03T05:30:00Z', 'Capt. S. Rawat', '', ''],
      ['ALT-2026-MED-SIA', 'Cold Chain & Inventory Expiry', 'CRITICAL', 'LOC-SIA-05', 'Siachen Base Camp', 'SKU-MED-002', 'Plasma & Blood Biological Kits', 'Medical & Cold-Chain', 'Siachen Base biological kits reserve at 45 kits (2.8 days of cover).', 'Available stock 45 < safety threshold 80', 'Initiate emergency rotary airlift replenishment from Leh Corps Supply Depot.', 'ACTIVE', '2026-10-03T06:15:00Z', '', '', ''],
      ['ALT-2026-CON-ZOJ', 'Corridor Transit Delay Spike', 'WARNING', 'LOC-SRI-01', 'Srinagar-Kargil Corridor', 'N/A', 'Zoji La Corridor Convoys', 'Route Telematics', 'High-altitude snowfall inducing 1.3h average transit delay across Zoji La.', 'Average transit 7.8h > SLA benchmark 6.5h', 'Reroute non-perishable freight via secondary southern corridor.', 'ACTIVE', '2026-10-03T07:00:00Z', '', '', ''],
    ];
    const csvString = '﻿' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    this.triggerDownload(csvString, filename, 'text/csv;charset=utf-8;');
    return { success: true, filename, source: 'client-fallback' };
  }

  /**
   * 4. Fetch Master Executive Demo Report (JSON payload)
   */
  async getDemoReport(params = {}) {
    try {
      const response = await analyticsApi.getDemoReport(params);
      if (response && response.report_id) {
        return response;
      }
    } catch (err) {
      console.warn('[AnalyticsDataService] Backend demo report call failed, utilizing local demo report template:', err.message);
    }
    return FALLBACK_DEMO_REPORT;
  }

  /**
   * 5. Open printable military HTML Demo Report
   */
  openDemoReportHtml(params = {}) {
    const url = analyticsApi.getDemoHtmlUrl(params);
    window.open(url, '_blank');
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

    return '﻿' + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
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
