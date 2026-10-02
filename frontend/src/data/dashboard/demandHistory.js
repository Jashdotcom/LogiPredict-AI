/**
 * LogiPredict AI — Synthetic Demand History Dataset
 * =================================================
 * Historical daily consumption and aggregate throughput across forward supply nodes
 * (SIH 2026).
 */

export const DEMAND_HISTORY = [
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-18', demand: 4120, unit: 'units', is_synthetic: true },
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-19', demand: 4350, unit: 'units', is_synthetic: true },
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-20', demand: 4780, unit: 'units', is_synthetic: true },
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-21', demand: 5020, unit: 'units', is_synthetic: true },
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-22', demand: 5510, unit: 'units', is_synthetic: true },
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-23', demand: 5980, unit: 'units', is_synthetic: true },
  { item_id: 'SKU-POL-DSL-01', date: '2026-09-24', demand: 5240, unit: 'units', is_synthetic: true },
  // Aggregate chart mapping for Overview Dashboard (14-day window: 7 days actual, 7 days forecast)
];

export const OVERVIEW_DEMAND_SERIES = [
  { day: 'Day 1 (Mon)', date: '2026-09-25', actual: 4200, forecast: 4150, lowerBound: 3900, upperBound: 4400, is_synthetic: true },
  { day: 'Day 2 (Tue)', date: '2026-09-26', actual: 4480, forecast: 4400, lowerBound: 4100, upperBound: 4700, is_synthetic: true },
  { day: 'Day 3 (Wed)', date: '2026-09-27', actual: 4890, forecast: 4750, lowerBound: 4400, upperBound: 5100, is_synthetic: true },
  { day: 'Day 4 (Thu)', date: '2026-09-28', actual: 5120, forecast: 5100, lowerBound: 4800, upperBound: 5400, is_synthetic: true },
  { day: 'Day 5 (Fri)', date: '2026-09-29', actual: 5600, forecast: 5550, lowerBound: 5200, upperBound: 5900, is_synthetic: true },
  { day: 'Day 6 (Sat)', date: '2026-09-30', actual: 6100, forecast: 6250, lowerBound: 5800, upperBound: 6700, is_synthetic: true },
  { day: 'Day 7 (Sun)', date: '2026-10-01', actual: 5300, forecast: 5400, lowerBound: 5000, upperBound: 5800, is_synthetic: true },
  { day: 'Day 8 (Mon)', date: '2026-10-02', actual: null, forecast: 4600, lowerBound: 4200, upperBound: 5000, is_synthetic: true },
  { day: 'Day 9 (Tue)', date: '2026-10-03', actual: null, forecast: 4900, lowerBound: 4500, upperBound: 5300, is_synthetic: true },
  { day: 'Day 10 (Wed)', date: '2026-10-04', actual: null, forecast: 5350, lowerBound: 4900, upperBound: 5800, is_synthetic: true },
  { day: 'Day 11 (Thu)', date: '2026-10-05', actual: null, forecast: 5800, lowerBound: 5300, upperBound: 6300, is_synthetic: true },
  { day: 'Day 12 (Fri)', date: '2026-10-06', actual: null, forecast: 6400, lowerBound: 5900, upperBound: 6900, is_synthetic: true },
  { day: 'Day 13 (Sat)', date: '2026-10-07', actual: null, forecast: 6950, lowerBound: 6400, upperBound: 7500, is_synthetic: true },
  { day: 'Day 14 (Sun)', date: '2026-10-08', actual: null, forecast: 5900, lowerBound: 5400, upperBound: 6400, is_synthetic: true },
];

export default {
  DEMAND_HISTORY,
  OVERVIEW_DEMAND_SERIES,
};
