/**
  * LogiPredict AI — Advanced Inventory Calculation & Logic Utility
  * ===============================================================
  * Implements deterministic inventory business logic for SIH 2026:
  * - Daily consumption rates & configurable windows
  * - Days of stock cover (runway)
  * - Reorder thresholds (Consumption × Lead Time + Safety Stock)
  * - Reorder recommendations & maximum capacity bounds
  * - Standardized inventory status classification (Healthy, Low Stock, Critical, Out of Stock)
  * - Stockout risk identification relative to lead times
  */

 /**
  * Calculate average daily consumption for an inventory item.
  * @param {Object} item - Inventory record
  * @returns {number} Average daily consumption
  */
 export function calculateDailyConsumption(item) {
   if (!item) return 0;
   return Number(item.daily_consumption ?? item.consumption ?? 0);
 }

 /**
  * Calculate days of stock cover (runway).
  * @param {number} currentStock
  * @param {number} dailyConsumption
  * @returns {number|null} Days of stock cover, or null if consumption is zero/missing
  */
 export function calculateStockCoverDays(currentStock, dailyConsumption) {
   const stock = Number(currentStock || 0);
   const consumption = Number(dailyConsumption || 0);
   if (consumption <= 0) return null;
   return Number((stock / consumption).toFixed(1));
 }

 /**
  * Calculate reorder point threshold.
  * Formula: Reorder Point = (Average Daily Consumption × Lead Time Days) + Minimum Safety Stock
  * @param {number} dailyConsumption
  * @param {number} leadTimeDays
  * @param {number} minimumStock
  * @returns {number} Reorder threshold quantity
  */
 export function calculateReorderThreshold(dailyConsumption, leadTimeDays, minimumStock) {
   const consumption = Number(dailyConsumption || 0);
   const leadTime = Number(leadTimeDays || 3);
   const safety = Number(minimumStock || 0);
   return Math.round((consumption * leadTime) + safety);
 }

 /**
  * Classify item stock status.
  * Rules:
  * - Out of Stock: Current stock === 0
  * - Critical: Current stock < minimum_stock or stock cover <= lead time
  * - Low Stock: Current stock < reorder_level
  * - Healthy: Otherwise
  * @param {Object} item
  * @returns {'Healthy'|'Low Stock'|'Critical'|'Out of Stock'}
  */
 export function classifyItemStatus(item) {
   if (!item) return 'Healthy';
   const current = Number(item.current_stock ?? 0);
   const min = Number(item.minimum_stock ?? 30);
   const reorder = Number(item.reorder_level ?? 40);

   if (current === 0) return 'Out of Stock';
   if (current < min) return 'Critical';
   if (current <= reorder) return 'Low Stock';
   return 'Healthy';
 }

 /**
  * Calculate reorder recommendation for an item.
  * @param {Object} item
  * @returns {Object} Recommendation metrics
  */
 export function calculateReorderRecommendation(item) {
   if (!item) return { required: false, quantity: 0, priority: 'none' };

   const current = Number(item.current_stock ?? 0);
   const max = Number(item.maximum_capacity ?? 1000);
   const reorderLevel = Number(item.reorder_level ?? 40);
   const consumption = calculateDailyConsumption(item);
   const leadTime = Number(item.lead_time_days ?? 3);
   const stockCover = calculateStockCoverDays(current, consumption);

   const isRequired = current <= reorderLevel || (stockCover !== null && stockCover <= leadTime);

   let recommendedQty = 0;
   let priority = 'normal';

   if (isRequired) {
     recommendedQty = Math.max(0, max - current);
     if (current === 0 || stockCover <= leadTime) {
       priority = 'critical';
     } else if (current < item.minimum_stock) {
       priority = 'high';
     } else {
       priority = 'warning';
     }
   }

   return {
     required: isRequired,
     recommendedQuantity: recommendedQty,
     stockCoverDays: stockCover,
     priority,
   };
 }

 /**
  * Identify potential stockout risk.
  * Condition: Stock cover days <= lead time days + safety buffer (2 days)
  * @param {Object} item
  * @returns {boolean}
  */
 export function detectStockoutRisk(item) {
   if (!item) return false;
   const current = Number(item.current_stock ?? 0);
   if (current === 0) return true;
   const consumption = calculateDailyConsumption(item);
   const leadTime = Number(item.lead_time_days ?? 3);
   const stockCover = calculateStockCoverDays(current, consumption);
   if (stockCover === null) return false;
   return stockCover <= (leadTime + 2);
 }

 export default {
   calculateDailyConsumption,
   calculateStockCoverDays,
   calculateReorderThreshold,
   classifyItemStatus,
   calculateReorderRecommendation,
   detectStockoutRisk,
 };
