/**
 * LogiPredict AI — Centralized Dashboard Mock Data Aggregation Layer
 * ==================================================================
 * SYNTHETIC DATASET: Exclusively calibrated for SIH 2026 demonstration.
 * Contains NO actual military inventory, classified logistics data, or real personnel.
 *
 * This file acts as the single import point for all dashboard data modules.
 * It re-exports the dedicated datasets and derives summary metrics dynamically
 * via dashboardCalculations.js rather than hardcoding summary values.
 */

// == Dedicated Data Modules ==
import { INVENTORY_ITEMS } from './inventoryData';
import { OVERVIEW_DEMAND_SERIES, DEMAND_HISTORY } from './demandHistory';
import { FORECAST_RECORDS } from './forecastData';
import { ALERT_RECORDS } from './alertData';
import { ACTIVITY_RECORDS } from './activityData';

// == Calculation Utilities ==
import {
  calculateInventoryMetrics,
  calculateAlertMetrics,
  generateDashboardKPIs,
} from '../../utils/dashboardCalculations';

// ──────────────────────────────────────────────────────────────────────
// 1. KPI Cards — Derived from source datasets, NOT hardcoded
// ──────────────────────────────────────────────────────────────────────
export const DASHBOARD_KPIS = generateDashboardKPIs(INVENTORY_ITEMS, ALERT_RECORDS, FORECAST_RECORDS);

// ──────────────────────────────────────────────────────────────────────
// 2. Inventory Health Charts — Category aggregation from inventory data
// ──────────────────────────────────────────────────────────────────────

/**
 * Aggregate inventory health by supply category.
 * Each entry: { category, optimal, current, safetyStock, reorderLevel, status }
 */
function aggregateInventoryHealth(items) {
  const categoryMap = {};

  items.forEach((item) => {
    const cat = item.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { totalCurrent: 0, totalMax: 0, totalSafety: 0, totalReorder: 0, count: 0 };
    }
    categoryMap[cat].totalCurrent += item.current_stock;
    categoryMap[cat].totalMax += item.maximum_capacity;
    categoryMap[cat].totalSafety += item.minimum_stock;
    categoryMap[cat].totalReorder += item.reorder_level;
    categoryMap[cat].count += 1;
  });

  return Object.entries(categoryMap).map(([category, agg]) => {
    const currentPct = agg.totalMax > 0 ? Math.round((agg.totalCurrent / agg.totalMax) * 100) : 100;
    const optimalPct = Math.min(100, currentPct + Math.round(Math.random() * 6 + 2)); // slight optimal buffer
    const safetyPct = agg.totalMax > 0 ? Math.round((agg.totalSafety / agg.totalMax) * 100) : 30;
    const reorderPct = agg.totalMax > 0 ? Math.round((agg.totalReorder / agg.totalMax) * 100) : 40;

    let status = 'Healthy';
    if (currentPct < safetyPct) status = 'Critical Stock';
    else if (currentPct < reorderPct) status = 'Low Stock';

    return {
      category,
      optimal: optimalPct,
      current: currentPct,
      safetyStock: safetyPct,
      reorderLevel: reorderPct,
      status,
    };
  });
}

/**
 * Calculate stock distribution buckets for the donut/pie chart.
 */
function calculateInventoryDistribution(items) {
  let healthy = 0;
  let low = 0;
  let critical = 0;
  let outOfStock = 0;

  items.forEach((item) => {
    const ratio = item.maximum_capacity > 0 ? (item.current_stock / item.maximum_capacity) * 100 : 100;
    if (item.current_stock === 0) outOfStock++;
    else if (ratio < 40 || item.current_stock < item.minimum_stock) critical++;
    else if (ratio < 80 || item.current_stock < item.reorder_level) low++;
    else healthy++;
  });

  const total = items.length;
  return [
    {
      name: 'Healthy Stock (80–100%)',
      value: total > 0 ? Math.round((healthy / total) * 100) : 0,
      count: `${healthy} SKUs`,
      color: '#10b981',
    },
    {
      name: 'Low Stock (40–79%)',
      value: total > 0 ? Math.round((low / total) * 100) : 0,
      count: `${low} SKUs`,
      color: '#f59e0b',
    },
    {
      name: 'Critical Stock (<40%)',
      value: total > 0 ? Math.round((critical / total) * 100) : 0,
      count: `${critical} SKUs`,
      color: '#ef4444',
    },
    {
      name: 'Out of Stock (0%)',
      value: total > 0 ? Math.round((outOfStock / total) * 100) : 0,
      count: `${outOfStock} SKUs`,
      color: '#64748b',
    },
  ];
}

export const INVENTORY_HEALTH_DATA = aggregateInventoryHealth(INVENTORY_ITEMS);
export const INVENTORY_DISTRIBUTION_DATA = calculateInventoryDistribution(INVENTORY_ITEMS);

// ──────────────────────────────────────────────────────────────────────
// 3. Demand Forecast Chart Data — 14-day window (7 actual + 7 forecast)
// ──────────────────────────────────────────────────────────────────────
export const DEMAND_FORECAST_DATA = OVERVIEW_DEMAND_SERIES;

// ──────────────────────────────────────────────────────────────────────
// 4. Priority Alerts — Sorted by severity (critical first), then recency
// ──────────────────────────────────────────────────────────────────────
const SEVERITY_ORDER = { critical: 0, high: 1, warning: 2, medium: 3, info: 4 };

export const PRIORITY_ALERTS = [...ALERT_RECORDS].sort((a, b) => {
  const sevA = SEVERITY_ORDER[a.severity] ?? 5;
  const sevB = SEVERITY_ORDER[b.severity] ?? 5;
  if (sevA !== sevB) return sevA - sevB;
  // More recent first (descending)
  const dateA = new Date(a.created_at || 0).getTime();
  const dateB = new Date(b.created_at || 0).getTime();
  return dateB - dateA;
});

// ──────────────────────────────────────────────────────────────────────
// 5. Recent Activities — Latest first
// ──────────────────────────────────────────────────────────────────────
export const RECENT_ACTIVITIES = [...ACTIVITY_RECORDS].sort((a, b) => {
  const dateA = new Date(a.created_at || 0).getTime();
  const dateB = new Date(b.created_at || 0).getTime();
  return dateB - dateA;
});

// ──────────────────────────────────────────────────────────────────────
// 6. Quick Actions — Unchanged, UI-only navigation shortcuts
// ──────────────────────────────────────────────────────────────────────
export const QUICK_ACTIONS = [
  {
    id: 'action-inventory',
    label: 'View Inventory',
    description: 'Inspect multi-echelon stock levels, SKUs, and buffer margins',
    icon: 'Boxes',
    path: '/inventory',
    variant: 'secondary',
  },
  {
    id: 'action-forecast',
    label: 'Generate Forecast',
    description: 'Run 14-day neural demand predictions across all distribution nodes',
    icon: 'Sparkles',
    path: '/forecasting',
    variant: 'primary',
  },
  {
    id: 'action-routes',
    label: 'Plan Supply Route',
    description: 'Optimize GIS fleet transit and resolve corridor bottlenecks',
    icon: 'Route',
    path: '/routes',
    variant: 'secondary',
  },
  {
    id: 'action-simulations',
    label: 'Run Simulation',
    description: 'Stress-test forward logistics against extreme weather and surges',
    icon: 'Sliders',
    path: '/simulations',
    variant: 'secondary',
  },
  {
    id: 'action-alerts',
    label: 'View All Alerts',
    description: 'Inspect actionable stockout risks and automated mitigations',
    icon: 'BellRing',
    path: '/alerts',
    variant: 'secondary',
  },
];

// ──────────────────────────────────────────────────────────────────────
// Re-export source data for cross-referencing by other modules
// ──────────────────────────────────────────────────────────────────────
export {
  INVENTORY_ITEMS,
  OVERVIEW_DEMAND_SERIES,
  DEMAND_HISTORY,
  FORECAST_RECORDS,
  ALERT_RECORDS,
  ACTIVITY_RECORDS,
};

// ──────────────────────────────────────────────────────────────────────
// Default export for backward compatibility
// ──────────────────────────────────────────────────────────────────────
export default {
  DASHBOARD_KPIS,
  INVENTORY_HEALTH_DATA,
  INVENTORY_DISTRIBUTION_DATA,
  DEMAND_FORECAST_DATA,
  PRIORITY_ALERTS,
  RECENT_ACTIVITIES,
  QUICK_ACTIONS,
  INVENTORY_ITEMS,
  FORECAST_RECORDS,
  ALERT_RECORDS,
  ACTIVITY_RECORDS,
};
