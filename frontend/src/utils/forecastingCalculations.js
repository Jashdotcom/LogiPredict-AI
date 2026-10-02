/**
 * LogiPredict AI — Forecasting Calculation Utility
 * ===============================================
 * Generates and calculates multi-horizon time-series forecasts, confidence intervals,
 * daily demand projections, and summary metrics for the Forecasting module.
 */

import { INVENTORY_ITEMS } from '../data/dashboard/inventoryData';

/**
 * Generate simulated multi-horizon demand records for a selected item or category & depot.
 * @param {string} itemId - SKU or category name
 * @param {string} depot - Storage location or 'all'
 * @param {number} horizonDays - 7, 14, 30, 60, or 90 days
 * @param {string} modelName - Selected AI model
 * @returns {Object} Forecast dataset with history, predictions, bounds, and summary
 */
export function generateForecastData(itemId = 'all', depot = 'all', horizonDays = 14, modelName = 'ensemble') {
  // Find base item or use default consumption
  const matchedItem = INVENTORY_ITEMS.find((i) => i.item_id === itemId || i.item_name === itemId);
  const baseConsumption = matchedItem ? Number(matchedItem.daily_consumption ?? 450) : 1200;
  const currentStock = matchedItem ? Number(matchedItem.current_stock ?? 14200) : 25000;

  const historyDays = 7;
  const totalDays = historyDays + horizonDays;
  const data = [];

  const baseDate = new Date('2026-10-02T00:00:00Z');

  let totalPredictedDemand = 0;
  let peakDemand = 0;
  let minDemand = Infinity;

  for (let i = -historyDays; i < horizonDays; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Is historical (i < 0) or forecast (i >= 0)
    const isHistorical = i < 0;

    // Simulate fluctuation based on day and model
    const noise = Math.sin(i * 0.7) * (baseConsumption * 0.12) + (Math.random() * 40 - 20);
    const trendFactor = 1 + (i * 0.005); // slight upward trend

    let actualVal = null;
    let forecastVal = null;
    let lowerBound = null;
    let upperBound = null;

    if (isHistorical) {
      actualVal = Math.round(baseConsumption + noise);
    } else {
      // Future prediction
      const modelMultiplier = modelName === 'xgboost' ? 1.05 : modelName === 'prophet' ? 0.98 : 1.0;
      forecastVal = Math.round((baseConsumption * trendFactor + noise) * modelMultiplier);

      // 95% Confidence interval bounds (~8% spread)
      const spread = forecastVal * 0.08;
      lowerBound = Math.max(0, Math.round(forecastVal - spread));
      upperBound = Math.round(forecastVal + spread);

      totalPredictedDemand += forecastVal;
      if (forecastVal > peakDemand) peakDemand = forecastVal;
      if (forecastVal < minDemand) minDemand = forecastVal;
    }

    // Illustrative projected remaining stock
    const daysFromToday = i >= 0 ? i : 0;
    const projectedStock = Math.max(0, currentStock - (daysFromToday * baseConsumption));
    const stockStatus = projectedStock === 0 ? 'Out of Stock' : projectedStock < (matchedItem?.minimum_stock || 5000) ? 'Critical' : 'Healthy';

    data.push({
      dayIndex: i,
      date: dateStr,
      label: dayOfWeek,
      isHistorical,
      actual: actualVal,
      forecast: forecastVal,
      lowerBound,
      upperBound,
      currentStock,
      projectedStock,
      stockStatus,
    });
  }

  const avgDailyDemand = Math.round(totalPredictedDemand / horizonDays);
  const startForecast = data.find(d => d.dayIndex === 0)?.forecast || baseConsumption;
  const endForecast = data.find(d => d.dayIndex === horizonDays - 1)?.forecast || baseConsumption;
  const expectedChangePct = Number((((endForecast - startForecast) / startForecast) * 100).toFixed(1));

  return {
    series: data,
    summary: {
      totalPredictedDemand,
      avgDailyDemand,
      peakDemand,
      minDemand: minDemand === Infinity ? 0 : minDemand,
      expectedChangePct,
      horizonDays,
      modelName,
    },
  };
}

export default { generateForecastData };
