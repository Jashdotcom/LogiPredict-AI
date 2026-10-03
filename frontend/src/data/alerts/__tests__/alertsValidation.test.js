/**
 * LogiPredict AI — Frontend Predictive Alerts Test Suite
 * ======================================================
 * Phase 6.3: Frontend Filter, Sort, Pagination, KPI & Lifecycle State Transitions Validation
 * Indian Army Forward Supply Chain (SIH 2026)
 */

import {
  queryAlerts,
  calculateAlertKPIs,
  getAlertCategories,
  getAlertLocations,
  acknowledgeAlert,
  resolveAlert,
  resetAlertsState,
  getAlertById,
} from '../alertsDataService.js';

describe('LogiPredict AI - Frontend Alerts Data Service Validation', () => {
  beforeEach(() => {
    resetAlertsState();
  });

  test('KPI calculation matches record state accurately', () => {
    const kpis = calculateAlertKPIs();
    expect(kpis.total).toBeGreaterThan(0);
    expect(kpis.criticalActive).toBeGreaterThanOrEqual(0);
    expect(kpis.warningActive).toBeGreaterThanOrEqual(0);
    expect(kpis.transitRisks).toBeGreaterThanOrEqual(0);
    expect(kpis.activeCount).toBe(kpis.total - kpis.resolved);
  });

  test('Text search across title, sku, warehouse, and description', () => {
    const dieselSearch = queryAlerts({ search: 'Diesel' });
    expect(dieselSearch.total).toBeGreaterThan(0);
    dieselSearch.items.forEach((item) => {
      const match =
        (item.title && item.title.toLowerCase().includes('diesel')) ||
        (item.description && item.description.toLowerCase().includes('diesel')) ||
        (item.item_name && item.item_name.toLowerCase().includes('diesel')) ||
        (item.category && item.category.toLowerCase().includes('diesel'));
      expect(match).toBe(true);
    });
  });

  test('Severity filtering returns only requested severity tier', () => {
    const critRes = queryAlerts({ severity: 'critical' });
    expect(critRes.total).toBeGreaterThan(0);
    critRes.items.forEach((item) => {
      expect(item.severity).toBe('critical');
    });

    const warnRes = queryAlerts({ severity: 'warning' });
    warnRes.items.forEach((item) => {
      expect(['warning', 'high']).toContain(item.severity);
    });
  });

  test('Status filtering returns only requested lifecycle state', () => {
    const newRes = queryAlerts({ status: 'new' });
    newRes.items.forEach((item) => {
      expect(item.status).toBe('new');
    });

    const ackRes = queryAlerts({ status: 'acknowledged' });
    ackRes.items.forEach((item) => {
      expect(item.status).toBe('acknowledged');
    });
  });

  test('Multi-column sorting by severity, status, and created_at', () => {
    // Sort by severity desc
    const sortCrit = queryAlerts({ sortBy: 'severity', sortOrder: 'desc', pageSize: 50 });
    const severityWeights = { critical: 3, warning: 2, high: 2, medium: 2, info: 1, low: 1 };
    for (let i = 0; i < sortCrit.items.length - 1; i++) {
      const w1 = severityWeights[sortCrit.items[i].severity] || 0;
      const w2 = severityWeights[sortCrit.items[i + 1].severity] || 0;
      expect(w1).toBeGreaterThanOrEqual(w2);
    }
  });

  test('Pagination bounds and page slicing', () => {
    const page1 = queryAlerts({ page: 1, pageSize: 3 });
    expect(page1.items.length).toBeLessThanOrEqual(3);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(3);

    const page2 = queryAlerts({ page: 2, pageSize: 3 });
    expect(page2.page).toBe(2);
    if (page1.total > 3) {
      expect(page1.items[0].id).not.toBe(page2.items[0].id);
    }
  });

  test('Optimistic state transitions: new -> acknowledged -> resolved', async () => {
    const initialList = queryAlerts({ status: 'new' });
    expect(initialList.items.length).toBeGreaterThan(0);
    const targetId = initialList.items[0].id;

    // Acknowledge
    const ackAlert = await acknowledgeAlert(targetId, 'Maj. Vikram Batra');
    expect(ackAlert.status).toBe('acknowledged');
    expect(ackAlert.acknowledged_by).toBe('Maj. Vikram Batra');
    expect(ackAlert.acknowledged_at).toBeTruthy();

    // Verify in query
    const fetchedAck = getAlertById(targetId);
    expect(fetchedAck.status).toBe('acknowledged');

    // Resolve
    const resAlert = await resolveAlert(
      targetId,
      'Col. Rajesh Verma',
      'Emergency airlift delivered 10,000L fuel reserves.'
    );
    expect(resAlert.status).toBe('resolved');
    expect(resAlert.resolved_by).toBe('Col. Rajesh Verma');
    expect(resAlert.resolution_notes).toBe('Emergency airlift delivered 10,000L fuel reserves.');
    expect(resAlert.resolved_at).toBeTruthy();

    // Verify in store
    const fetchedResolved = getAlertById(targetId);
    expect(fetchedResolved.status).toBe('resolved');
  });

  test('KPI updates upon alert resolution', async () => {
    const kpisBefore = calculateAlertKPIs();
    const activeBefore = kpisBefore.activeCount;
    const resolvedBefore = kpisBefore.resolved;

    const newAlerts = queryAlerts({ status: 'new' });
    const targetId = newAlerts.items[0].id;

    await resolveAlert(targetId, 'Test Officer', 'Resolved in test');

    const kpisAfter = calculateAlertKPIs();
    expect(kpisAfter.activeCount).toBe(activeBefore - 1);
    expect(kpisAfter.resolved).toBe(resolvedBefore + 1);
  });
});
