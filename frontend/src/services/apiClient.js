/**
 * LogiPredict AI — API Client Service Stub
 * Designed for future REST / WebSocket backend connectivity.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Generic API request wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[LogiPredict API] Fallback to mock data for ${endpoint}:`, error.message);
    throw error;
  }
}

export default {
  apiRequest,
};
