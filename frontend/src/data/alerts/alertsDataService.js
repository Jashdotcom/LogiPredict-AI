/**
 * LogiPredict AI — Predictive Alerts Data Service
 * ===============================================
 * Centralized service managing alert records, multi-parameter filtering,
 * multi-column sorting, pagination, and optimistic lifecycle mutations (Acknowledge / Resolve).
 *
 * Fully integrated with fallback synthetic data and REST API sync capabilities.
 */

import { ALERT_RECORDS } from '../dashboard/alertData';
import { alertsApi } from '../../services/apiClient';

// Severity weight ranking for sorting
const SEVERITY_WEIGHT = {
  critical: 3,
  warning: 2,
  medium: 2,
  high: 2,
  info: 1,
  low: 1,
};

// Status weight ranking for sorting
const STATUS_WEIGHT = {
  new: 3,
  acknowledged: 2,
  resolved: 1,
};

// Internal in-memory store initialized with deep copy of synthetic records
let alertsStore = ALERT_RECORDS.map((a) => ({ ...a }));

/**
 * Get all categories available in the dataset
 */
export function getAlertCategories() {
  const categories = new Set(alertsStore.map((a) => a.category).filter(Boolean));
  return Array.from(categories).sort();
}

/**
 * Get all locations / warehouses available in the dataset
 */
export function getAlertLocations() {
  const locations = new Set(
    alertsStore.map((a) => a.location_name || a.warehouse).filter(Boolean)
  );
  return Array.from(locations).sort();
}

/**
 * Calculate dynamic KPI summaries from current state
 */
export function calculateAlertKPIs(records = alertsStore) {
  const total = records.length;
  const criticalActive = records.filter(
    (a) => a.severity === 'critical' && a.status !== 'resolved'
  ).length;
  const warningActive = records.filter(
    (a) => (a.severity === 'warning' || a.severity === 'high') && a.status !== 'resolved'
  ).length;
  const transitRisks = records.filter(
    (a) =>
      (a.alert_type === 'route_disruption' ||
        a.alert_type === 'delayed_supply' ||
        a.category === 'Transit & Route Logistics') &&
      a.status !== 'resolved'
  ).length;
  const resolved = records.filter((a) => a.status === 'resolved').length;
  const acknowledged = records.filter((a) => a.status === 'acknowledged').length;
  const activeCount = records.filter((a) => a.status !== 'resolved').length;

  return {
    total,
    criticalActive,
    warningActive,
    transitRisks,
    resolved,
    acknowledged,
    activeCount,
  };
}

/**
 * Filter, Sort, and Paginate alerts
 *
 * @param {Object} options
 * @param {string} [options.search='']
 * @param {string} [options.severity='all']
 * @param {string} [options.category='all']
 * @param {string} [options.status='all']
 * @param {string} [options.location='all']
 * @param {string} [options.dateRange='all'] - '24h', '7d', '30d', 'all'
 * @param {string} [options.sortBy='created_at'] - 'created_at', 'severity', 'title', 'category', 'warehouse', 'status', 'confidence_score'
 * @param {'asc'|'desc'} [options.sortOrder='desc']
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=10]
 * @returns {{ items: Array, total: number, page: number, pageSize: number, totalPages: number, kpis: Object }}
 */
export function queryAlerts({
  search = '',
  severity = 'all',
  category = 'all',
  status = 'all',
  location = 'all',
  dateRange = 'all',
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 1,
  pageSize = 10,
} = {}) {
  let filtered = [...alertsStore];

  // 1. Text Search Filter
  if (search && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter((alert) => {
      const matchId = (alert.id || alert.alert_id || '').toLowerCase().includes(q);
      const matchTitle = (alert.title || '').toLowerCase().includes(q);
      const matchDesc = (alert.description || '').toLowerCase().includes(q);
      const matchItem = (alert.item_name || alert.sku || '').toLowerCase().includes(q);
      const matchWarehouse = (alert.warehouse || alert.location_name || '').toLowerCase().includes(q);
      const matchCategory = (alert.category || '').toLowerCase().includes(q);
      const matchAction = (alert.recommendedAction || alert.recommended_action || '').toLowerCase().includes(q);

      return matchId || matchTitle || matchDesc || matchItem || matchWarehouse || matchCategory || matchAction;
    });
  }

  // 2. Severity Filter
  if (severity !== 'all') {
    filtered = filtered.filter((alert) => {
      if (severity === 'warning') return alert.severity === 'warning' || alert.severity === 'high';
      return alert.severity === severity;
    });
  }

  // 3. Category Filter
  if (category !== 'all') {
    filtered = filtered.filter((alert) => alert.category === category);
  }

  // 4. Status Filter
  if (status !== 'all') {
    filtered = filtered.filter((alert) => alert.status === status);
  }

  // 5. Location Filter
  if (location !== 'all') {
    filtered = filtered.filter(
      (alert) => (alert.location_name === location || alert.warehouse === location)
    );
  }

  // 6. Date Range Filter
  if (dateRange !== 'all') {
    const now = new Date('2026-10-02T12:00:00Z').getTime(); // Reference synthetic current date
    const hoursMap = {
      '24h': 24,
      '7d': 7 * 24,
      '30d': 30 * 24,
    };
    const maxHours = hoursMap[dateRange] || 24 * 30;
    const cutoff = now - maxHours * 60 * 60 * 1000;

    filtered = filtered.filter((alert) => {
      const alertTime = new Date(alert.created_at || alert.timestamp).getTime();
      return isNaN(alertTime) || alertTime >= cutoff;
    });
  }

  // 7. Multi-column Sorting
  filtered.sort((a, b) => {
    let comp = 0;

    switch (sortBy) {
      case 'severity': {
        const weightA = SEVERITY_WEIGHT[a.severity] || 0;
        const weightB = SEVERITY_WEIGHT[b.severity] || 0;
        comp = weightA - weightB;
        break;
      }
      case 'status': {
        const weightA = STATUS_WEIGHT[a.status] || 0;
        const weightB = STATUS_WEIGHT[b.status] || 0;
        comp = weightA - weightB;
        break;
      }
      case 'title':
        comp = (a.title || '').localeCompare(b.title || '');
        break;
      case 'category':
        comp = (a.category || '').localeCompare(b.category || '');
        break;
      case 'warehouse':
      case 'location_name': {
        const locA = a.warehouse || a.location_name || '';
        const locB = b.warehouse || b.location_name || '';
        comp = locA.localeCompare(locB);
        break;
      }
      case 'confidence_score':
        comp = (a.confidence_score || 0) - (b.confidence_score || 0);
        break;
      case 'created_at':
      default: {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        comp = timeA - timeB;
        break;
      }
    }

    return sortOrder === 'asc' ? comp : -comp;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page: safePage,
    pageSize,
    totalPages,
    kpis: calculateAlertKPIs(alertsStore),
  };
}

/**
 * Optimistically Acknowledge an Alert
 *
 * @param {string} alertId
 * @param {string} [operatorCallsign='Operations Officer']
 * @returns {Promise<Object>} Updated alert object
 */
export async function acknowledgeAlert(alertId, operatorCallsign = 'Col. Rajesh Verma') {
  const index = alertsStore.findIndex((a) => (a.id || a.alert_id) === alertId);
  if (index === -1) {
    throw new Error(`Alert ${alertId} not found`);
  }

  const now = new Date().toISOString();
  alertsStore[index] = {
    ...alertsStore[index],
    status: 'acknowledged',
    acknowledged_at: now,
    acknowledged_by: operatorCallsign,
  };

  // Attempt backend API update in background if configured
  try {
    if (alertsApi?.acknowledge) {
      await alertsApi.acknowledge(alertId, operatorCallsign);
    }
  } catch (err) {
    console.warn(`[alertsDataService] Backend API acknowledge fallback to mock state: ${err.message}`);
  }

  return { ...alertsStore[index] };
}

/**
 * Optimistically Resolve an Alert with Mitigation Notes
 *
 * @param {string} alertId
 * @param {string} [operatorCallsign='Logistics Commander']
 * @param {string} [resolutionNotes='Mitigation protocol executed successfully.']
 * @returns {Promise<Object>} Updated alert object
 */
export async function resolveAlert(
  alertId,
  operatorCallsign = 'Col. Rajesh Verma',
  resolutionNotes = 'Mitigation protocol executed successfully.'
) {
  const index = alertsStore.findIndex((a) => (a.id || a.alert_id) === alertId);
  if (index === -1) {
    throw new Error(`Alert ${alertId} not found`);
  }

  const now = new Date().toISOString();
  alertsStore[index] = {
    ...alertsStore[index],
    status: 'resolved',
    resolved_at: now,
    resolved_by: operatorCallsign,
    resolution_notes: resolutionNotes,
  };

  // Attempt backend API update in background if configured
  try {
    if (alertsApi?.resolve) {
      await alertsApi.resolve(alertId, resolutionNotes, operatorCallsign);
    }
  } catch (err) {
    console.warn(`[alertsDataService] Backend API resolve fallback to mock state: ${err.message}`);
  }

  return { ...alertsStore[index] };
}

/**
 * Reset all alerts to pristine synthetic state
 */
export function resetAlertsState() {
  alertsStore = ALERT_RECORDS.map((a) => ({ ...a }));
  return queryAlerts();
}

/**
 * Get a single alert by ID
 */
export function getAlertById(alertId) {
  return alertsStore.find((a) => (a.id || a.alert_id) === alertId) || null;
}
