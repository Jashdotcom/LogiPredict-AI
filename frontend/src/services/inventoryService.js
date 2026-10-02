/**
 * LogiPredict AI — Inventory Service Layer
 * ========================================
 * Manages inventory data operations, FastAPI endpoint integration (`/api/v1/inventory/...`),
 * and robust offline synthetic fallback for SIH 2026 demonstration.
 */

import { apiRequest } from './apiClient';
import { INVENTORY_ITEMS as INITIAL_ITEMS } from '../data/dashboard/inventoryData';

// In-memory state store for prototype quantity updates
let cachedInventory = [...INITIAL_ITEMS];

export const inventoryService = {
  /**
   * Fetch all inventory items with optional filters
   * @param {Object} [params]
   * @returns {Promise<Array>}
   */
  async getInventory(params = {}) {
    try {
      const response = await apiRequest('inventory', { method: 'GET', params });
      return response || cachedInventory;
    } catch {
      // Offline fallback to local synthetic store
      let items = [...cachedInventory];
      if (params.category && params.category !== 'all') {
        items = items.filter((i) => i.category.toLowerCase() === params.category.toLowerCase());
      }
      if (params.depot && params.depot !== 'all') {
        items = items.filter((i) => i.storage_location.toLowerCase().includes(params.depot.toLowerCase()));
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.item_id.toLowerCase().includes(q) ||
            i.item_name.toLowerCase().includes(q) ||
            i.storage_location.toLowerCase().includes(q)
        );
      }
      return items;
    }
  },

  /**
   * Fetch single inventory item by ID
   * @param {string} itemId
   * @returns {Promise<Object>}
   */
  async getItemById(itemId) {
    try {
      const response = await apiRequest(`inventory/${itemId}`, { method: 'GET' });
      return response;
    } catch {
      const found = cachedInventory.find((i) => i.item_id === itemId);
      if (!found) throw new Error(`Item ${itemId} not found`);
      return found;
    }
  },

  /**
   * Update stock quantity for an item (increase, decrease, or set)
   * @param {string} itemId
   * @param {number} newQuantity
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async updateStockQuantity(itemId, newQuantity, reason = 'Manual Inventory Adjustment') {
    const qty = Number(newQuantity);
    if (isNaN(qty) || qty < 0) {
      throw new Error('Invalid quantity specified. Must be a non-negative number.');
    }

    try {
      const response = await apiRequest(`inventory/${itemId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          current_stock: qty,
          reason,
        }),
      });
      // Update local cache
      cachedInventory = cachedInventory.map((item) =>
        item.item_id === itemId
          ? { ...item, current_stock: qty, last_updated: new Date().toISOString() }
          : item
      );
      return response || { success: true, item_id: itemId, current_stock: qty };
    } catch {
      // Offline simulation success
      const index = cachedInventory.findIndex((i) => i.item_id === itemId);
      if (index === -1) throw new Error(`Item ${itemId} not found`);

      const maxCap = cachedInventory[index].maximum_capacity || 100000;
      if (qty > maxCap) {
        throw new Error(`Quantity exceeds maximum storage capacity (${maxCap})`);
      }

      cachedInventory[index] = {
        ...cachedInventory[index],
        current_stock: qty,
        last_updated: new Date().toISOString(),
      };

      return {
        success: true,
        item_id: itemId,
        current_stock: qty,
        reason,
        timestamp: new Date().toISOString(),
        message: 'Stock quantity updated successfully.',
      };
    }
  },
};

export default inventoryService;
