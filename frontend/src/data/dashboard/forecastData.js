/**
 * LogiPredict AI — Synthetic Forecast Values Dataset
 * ==================================================
 * 14-day hybrid neural model predictions (LSTM-Prophet-XGBoost ensemble)
 * for inventory items (SIH 2026).
 */

export const FORECAST_RECORDS = [
  {
    forecast_id: 'FC-8801',
    item_id: 'SKU-POL-DSL-01',
    forecast_date: '2026-10-03',
    predicted_demand: 4600,
    lower_bound: 4200,
    upper_bound: 5000,
    forecast_horizon_days: 14,
    model_name: 'LSTM-Prophet Ensemble v1.4',
    generated_at: '2026-10-02T06:00:00Z',
    is_synthetic: true,
  },
  {
    forecast_id: 'FC-8802',
    item_id: 'SKU-POL-KRS-02',
    forecast_date: '2026-10-03',
    predicted_demand: 1950,
    lower_bound: 1750,
    upper_bound: 2150,
    forecast_horizon_days: 14,
    model_name: 'XGBoost Thermal Regression v2.1',
    generated_at: '2026-10-02T06:00:00Z',
    is_synthetic: true,
  },
  {
    forecast_id: 'FC-8803',
    item_id: 'SKU-ORD-556-03',
    forecast_date: '2026-10-03',
    predicted_demand: 14,
    lower_bound: 10,
    upper_bound: 18,
    forecast_horizon_days: 14,
    model_name: 'Prophet Time-Series v1.0',
    generated_at: '2026-10-02T06:00:00Z',
    is_synthetic: true,
  },
  {
    forecast_id: 'FC-8804',
    item_id: 'SKU-RAT-MRE-05',
    forecast_date: '2026-10-03',
    predicted_demand: 480,
    lower_bound: 420,
    upper_bound: 540,
    forecast_horizon_days: 14,
    model_name: 'LSTM Neural Net v3.2',
    generated_at: '2026-10-02T06:00:00Z',
    is_synthetic: true,
  },
  {
    forecast_id: 'FC-8805',
    item_id: 'SKU-MED-PLM-07',
    forecast_date: '2026-10-03',
    predicted_demand: 7.5,
    lower_bound: 5.0,
    upper_bound: 10.0,
    forecast_horizon_days: 14,
    model_name: 'Ensemble Health Predictor v1.1',
    generated_at: '2026-10-02T06:00:00Z',
    is_synthetic: true,
  },
];

export default FORECAST_RECORDS;
