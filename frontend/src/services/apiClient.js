/**
 * LogiPredict AI — Centralized Frontend API Client
 * ==================================================
 * Robust REST client with standard envelope handling, timeout management,
 * custom typed error wrapping, and domain service methods.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

/**
 * Custom application error class representing backend API errors
 */
export class ApiError extends Error {
  constructor(message, status, code = 'API_ERROR', details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Primary low-level HTTP client with timeout & envelope unpacking
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    headers = {},
    params = {},
    ...customConfig
  } = options;

  // Build query string if params provided
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  // Setup abort controller for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Optional: Attach Bearer token if present in session storage
  const authToken = sessionStorage.getItem('lp_auth_token');
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON payload
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Handle non-2xx HTTP responses
    if (!response.ok) {
      const errorCode = data?.error?.code || `HTTP_${response.status}`;
      const errorMessage = data?.error?.message || data?.message || response.statusText;
      const errorDetails = data?.error?.details || {};
      throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    // Unpack standard envelope: return `data` if present, else root
    return data && data.success !== undefined && data.data !== undefined ? data.data : data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        `Request to ${endpoint} timed out after ${timeout}ms`,
        408,
        'REQUEST_TIMEOUT',
        { endpoint, timeout }
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or fetch failure
    throw new ApiError(
      error.message || 'Network connection error or server unreachable',
      0,
      'NETWORK_ERROR',
      { originalError: error.message }
    );
  }
}

// ==============================================================================
// Domain-Specific API Service Modules
// ==============================================================================

/**
 * 1. Inventory API Service
 */
export const inventoryApi = {
  getAll: (params) => apiRequest('/inventory', { method: 'GET', params }),
  getById: (itemId) => apiRequest(`/inventory/${itemId}`, { method: 'GET' }),
  getHealthSummary: () => apiRequest('/inventory/health-summary', { method: 'GET' }),
  getTransactions: (params) => apiRequest('/inventory/transactions', { method: 'GET', params }),
  createItem: (data) => apiRequest('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (itemId, data) => apiRequest(`/inventory/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

/**
 * 2. Demand Forecasting API Service
 */
export const forecastingApi = {
  getForecastByItem: (itemId, params) => apiRequest(`/forecasting/item/${itemId}`, { method: 'GET', params }),
  generateForecast: (requestData) =>
    apiRequest('/forecasting/predict', {
      method: 'POST',
      body: JSON.stringify(requestData),
      timeout: 30000, // Extended timeout for ML inference
    }),
  getModelMetrics: () => apiRequest('/forecasting/metrics', { method: 'GET' }),
};

/**
 * 3. Route Planning & GIS Telematics API Service
 */
export const routesApi = {
  getAll: (params) => apiRequest('/routes', { method: 'GET', params }),
  getById: (routeId) => apiRequest(`/routes/${routeId}`, { method: 'GET' }),
  getLocations: () => apiRequest('/locations', { method: 'GET' }),
  getKpis: () => apiRequest('/routes/kpis', { method: 'GET' }),
  optimizeRoute: (requestData) =>
    apiRequest('/routes/optimize', {
      method: 'POST',
      body: JSON.stringify(requestData),
      timeout: 20000,
    }),
  simulateDisruption: (requestData) =>
    apiRequest('/routes/simulate-disruption', {
      method: 'POST',
      body: JSON.stringify(requestData),
      timeout: 20000,
    }),
  reset: () => apiRequest('/routes/reset', { method: 'POST' }),
};

/**
 * 4. Supply Requisitions API Service
 */
export const suppliesApi = {
  getAll: (params) => apiRequest('/supplies', { method: 'GET', params }),
  getById: (reqId) => apiRequest(`/supplies/${reqId}`, { method: 'GET' }),
  createRequisition: (data) => apiRequest('/supplies', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (reqId, data) => apiRequest(`/supplies/${reqId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
};

/**
 * 5. Anomaly Alerts API Service
 */
export const alertsApi = {
  getAll: (params) => apiRequest('/alerts', { method: 'GET', params }),
  getSummary: () => apiRequest('/alerts/summary', { method: 'GET' }),
  acknowledge: (alertId, callsign) =>
    apiRequest(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledged_by: callsign }),
    }),
  resolve: (alertId, resolutionNotes, resolvedBy) => {
    let body = {};
    if (typeof resolutionNotes === 'object' && resolutionNotes !== null) {
      body = resolutionNotes;
    } else {
      body = {
        resolution_notes: resolutionNotes,
        ...(resolvedBy ? { resolved_by: resolvedBy } : {}),
      };
    }
    return apiRequest(`/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};

/**
 * 6. Logistics Simulation API Service
 */
export const simulationApi = {
  getBaseline: () => apiRequest('/simulation/baseline', { method: 'GET' }),
  listScenarios: () => apiRequest('/simulation/scenarios', { method: 'GET' }),
  getScenarioById: (scenarioId) => apiRequest(`/simulation/scenarios/${scenarioId}`, { method: 'GET' }),
  runSimulation: (config) =>
    apiRequest('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(config),
      timeout: 60000, // Extended timeout for Monte Carlo runs
    }),
  getById: (simId) => apiRequest(`/simulation/${simId}`, { method: 'GET' }),
  updateRecommendationStatus: (simId, recId, updateData) =>
    apiRequest(`/simulation/${simId}/recommendations/${recId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),
};

/**
 * 7. Analytics & Reports API Service
 */
export const analyticsApi = {
  getOverview: (params) => apiRequest('/analytics/overview', { method: 'GET', params }),
  getKpis: (params) => apiRequest('/analytics/kpis', { method: 'GET', params }),
  getInventoryTrends: (params) => apiRequest('/analytics/inventory-trends', { method: 'GET', params }),
  getForecastAccuracy: (params) => apiRequest('/analytics/forecast-accuracy', { method: 'GET', params }),
  getStockoutRisks: (params) => apiRequest('/analytics/stockout-risks', { method: 'GET', params }),
  getReplenishmentSummary: () => apiRequest('/analytics/replenishment-summary', { method: 'GET' }),
  getDeliveryPerformance: () => apiRequest('/analytics/delivery-performance', { method: 'GET' }),
  getDashboardSummary: () => apiRequest('/analytics/dashboard', { method: 'GET' }),
  getAuditReport: (params) => apiRequest('/analytics/audit-report', { method: 'GET', params }),
};

export default {
  apiRequest,
  ApiError,
  inventory: inventoryApi,
  forecasting: forecastingApi,
  routes: routesApi,
  supplies: suppliesApi,
  alerts: alertsApi,
  simulation: simulationApi,
  analytics: analyticsApi,
};
