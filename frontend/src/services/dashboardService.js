/**
 * LogiPredict AI — Dashboard Service Layer
 * =======================================================
 * Manages data fetching for the Command Center Overview dashboard.
 * Interacts with FastAPI backend endpoints (`/api/v1/dashboard/...`)
 * and falls back seamlessly to calibrated synthetic data for offline/demo reliability.
 */

import { apiRequest } from './apiClient';
import {
  DASHBOARD_KPIS,
  INVENTORY_HEALTH_DATA,
  INVENTORY_DISTRIBUTION_DATA,
  DEMAND_FORECAST_DATA,
  PRIORITY_ALERTS,
  RECENT_ACTIVITIES,
  QUICK_ACTIONS,
  INVENTORY_ITEMS,
} from '../data/dashboard/dashboardMockData';
import { generateDashboardKPIs } from '../utils/dashboardCalculations';

export const dashboardService = {
  /**
   * Fetch complete aggregated dashboard overview data
   * @param {Object} [params] - Optional query parameters (e.g., dateRange, sector)
   * @returns {Promise<Object>} Aggregated dashboard state
   */
  async getDashboardSummary(params = {}) {
    try {
      const response = await apiRequest('dashboard/summary', { method: 'GET', params });
      return {
        kpis: response.kpis || generateDashboardKPIs(INVENTORY_ITEMS, PRIORITY_ALERTS),
        inventoryHealth: response.inventoryHealth || INVENTORY_HEALTH_DATA,
        inventoryDistribution: response.inventoryDistribution || INVENTORY_DISTRIBUTION_DATA,
        demandForecast: response.demandForecast || DEMAND_FORECAST_DATA,
        priorityAlerts: response.priorityAlerts || PRIORITY_ALERTS,
        recentActivities: response.recentActivities || RECENT_ACTIVITIES,
        quickActions: response.quickActions || QUICK_ACTIONS,
        isLive: true,
      };
    } catch (error) {
      console.info(
        '[dashboardService] Backend service offline or endpoint unavailable. Falling back to centralized synthetic military telemetry data.',
        error?.message
      );
      // Fallback to centralized synthetic dataset with calculated KPIs
      const calculatedKPIs = generateDashboardKPIs(INVENTORY_ITEMS, PRIORITY_ALERTS);
      return {
        kpis: calculatedKPIs,
        inventoryHealth: INVENTORY_HEALTH_DATA,
        inventoryDistribution: INVENTORY_DISTRIBUTION_DATA,
        demandForecast: DEMAND_FORECAST_DATA,
        priorityAlerts: PRIORITY_ALERTS,
        recentActivities: RECENT_ACTIVITIES,
        quickActions: QUICK_ACTIONS,
        isLive: false,
      };
    }
  },

  /**
   * Fetch top 6 KPI metric cards
   */
  async getKPIs() {
    try {
      const response = await apiRequest('dashboard/kpis', { method: 'GET' });
      return response || generateDashboardKPIs(INVENTORY_ITEMS, PRIORITY_ALERTS);
    } catch {
      return generateDashboardKPIs(INVENTORY_ITEMS, PRIORITY_ALERTS);
    }
  },

  /**
   * Fetch inventory health and category status data
   */
  async getInventoryHealth() {
    try {
      const response = await apiRequest('dashboard/inventory-health', { method: 'GET' });
      return {
        categories: response.categories || INVENTORY_HEALTH_DATA,
        distribution: response.distribution || INVENTORY_DISTRIBUTION_DATA,
      };
    } catch {
      return {
        categories: INVENTORY_HEALTH_DATA,
        distribution: INVENTORY_DISTRIBUTION_DATA,
      };
    }
  },

  /**
   * Fetch demand forecast data (historical vs predicted)
   * @param {string} [timeframe='14d']
   */
  async getDemandForecast(timeframe = '14d') {
    try {
      const response = await apiRequest('dashboard/demand-forecast', {
        method: 'GET',
        params: { timeframe },
      });
      return response || DEMAND_FORECAST_DATA;
    } catch {
      return DEMAND_FORECAST_DATA;
    }
  },

  /**
   * Fetch critical priority alerts
   */
  async getPriorityAlerts() {
    try {
      const response = await apiRequest('dashboard/alerts', { method: 'GET' });
      return response || PRIORITY_ALERTS;
    } catch {
      return PRIORITY_ALERTS;
    }
  },

  /**
   * Fetch recent audit and logistics activities
   * @param {number} [limit=10]
   */
  async getRecentActivities(limit = 10) {
    try {
      const response = await apiRequest('dashboard/activities', {
        method: 'GET',
        params: { limit },
      });
      return response || RECENT_ACTIVITIES;
    } catch {
      return RECENT_ACTIVITIES;
    }
  },

  /**
   * Trigger an automated mitigation or dispatch action from an alert card
   * @param {string} alertId
   * @param {string} actionType
   * @param {Object} [payload]
   */
  async triggerMitigationAction(alertId, actionType, payload = {}) {
    try {
      return await apiRequest(`alerts/${alertId}/mitigate`, {
        method: 'POST',
        body: JSON.stringify({ actionType, ...payload }),
      });
    } catch {
      // Return simulated success confirmation for prototype flow
      return {
        success: true,
        alertId,
        actionType,
        timestamp: new Date().toISOString(),
        message: `Mitigation protocol "${actionType}" dispatched successfully.`,
      };
    }
  },
};

export default dashboardService;
