"""
LogiPredict AI - Forecasting Engine Test Suite
==============================================
Phase 5.2: Demand Forecasting Unit & Integration Tests
Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime, timedelta
import unittest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.services.forecast_data import (
    SyntheticDemandGenerator,
    SKU_CATALOG,
    DEPOT_CATALOG,
    demand_generator,
)
from app.services.forecast_preprocessor import ForecastDataPreprocessor
from app.services.forecast_models import (
    BaselineForecastModel,
    MovingAverageForecastModel,
    MLRegressionForecastModel,
    EnsembleForecastModel,
    get_forecast_model,
)
from app.services.forecast_evaluator import ForecastEvaluator
from app.services.forecast_service import DemandForecastingService
from app.utils.exceptions import ValidationError, NotFoundError


class TestSyntheticDataGenerator(unittest.TestCase):
    """Unit tests for the synthetic historical demand generator."""

    def setUp(self):
        self.gen = SyntheticDemandGenerator(seed=42)

    def test_seed_determinism(self):
        gen1 = SyntheticDemandGenerator(seed=123)
        gen2 = SyntheticDemandGenerator(seed=123)
        df1 = gen1.generate_daily_demand_series(item_id="SKU-POL-DSL-01", days=30)
        df2 = gen2.generate_daily_demand_series(item_id="SKU-POL-DSL-01", days=30)
        pd.testing.assert_frame_equal(df1, df2)

    def test_non_negative_demand(self):
        df = self.gen.generate_daily_demand_series(item_id="all", days=45)
        self.assertTrue((df["demand"] >= 0).all())

    def test_synthetic_attribution(self):
        df = self.gen.generate_daily_demand_series(item_id="SKU-POL-DSL-01", days=14)
        self.assertTrue((df["is_synthetic"] == True).all())
        self.assertTrue((df["data_source"] == "synthetic").all())

    def test_catalog_retrieval(self):
        sku = self.gen.get_sku_metadata("SKU-POL-DSL-01")
        self.assertIsNotNone(sku)
        self.assertEqual(sku["name"], "Winter-Grade Diesel ATF-800")
        self.assertIsNone(self.gen.get_sku_metadata("NON-EXISTENT-SKU"))

    def test_aggregated_series_generation(self):
        agg = self.gen.generate_aggregated_demand_series(item_id="SKU-ORD-556-03", days=30)
        self.assertEqual(len(agg), 30)
        self.assertIn("timestamp", agg.columns)
        self.assertIn("demand", agg.columns)


class TestForecastPreprocessor(unittest.TestCase):
    """Unit tests for time-series cleaning, validation, and feature engineering."""

    def test_clean_and_standardize_series(self):
        raw_data = [
            {"date": "2026-10-02", "demand": 150.0},
            {"date": "2026-10-01", "demand": -20.0},  # Negative value should be clamped
            {"date": "2026-10-04", "demand": 180.0},  # Missing 2026-10-03
        ]
        clean_df = ForecastDataPreprocessor.clean_and_standardize_series(raw_data)

        # Check chronological ordering
        self.assertEqual(clean_df.iloc[0]["date"], "2026-10-01")
        self.assertEqual(clean_df.iloc[-1]["date"], "2026-10-04")

        # Check non-negative clamping
        self.assertTrue((clean_df["demand"] >= 0).all())

        # Check missing date interpolation (4 days total: Oct 1, 2, 3, 4)
        self.assertEqual(len(clean_df), 4)

    def test_empty_dataset_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            ForecastDataPreprocessor.clean_and_standardize_series([])

    def test_chronological_train_test_split(self):
        gen = SyntheticDemandGenerator(seed=42)
        df = gen.generate_aggregated_demand_series(days=60)
        train_df, test_df = ForecastDataPreprocessor.train_test_split_chronological(df, test_days=14)

        self.assertEqual(len(train_df), 46)
        self.assertEqual(len(test_df), 14)
        # Ensure zero temporal overlap / no future leakage
        self.assertLess(train_df["timestamp"].max(), test_df["timestamp"].min())

    def test_lagged_features_creation(self):
        gen = SyntheticDemandGenerator(seed=42)
        df = gen.generate_aggregated_demand_series(days=60)
        feat_df = ForecastDataPreprocessor.create_lagged_features(df, lags=[1, 7], rolling_windows=[3, 7])

        self.assertIn("lag_1", feat_df.columns)
        self.assertIn("lag_7", feat_df.columns)
        self.assertIn("rolling_mean_3", feat_df.columns)
        self.assertIn("rolling_mean_7", feat_df.columns)
        self.assertIn("day_of_week", feat_df.columns)
        self.assertFalse(feat_df.isna().any().any())


class TestForecastModels(unittest.TestCase):
    """Unit tests for individual forecasting algorithms and confidence bounds."""

    def setUp(self):
        self.gen = SyntheticDemandGenerator(seed=42)
        self.history_df = self.gen.generate_aggregated_demand_series(days=60)

    def test_baseline_model(self):
        model = BaselineForecastModel()
        model.fit(self.history_df)
        preds = model.predict(horizon_days=14)
        self.assertEqual(len(preds), 14)
        self.assertTrue(all(p >= 0 for p in preds))

    def test_moving_average_model(self):
        model = MovingAverageForecastModel(window_size=7)
        model.fit(self.history_df)
        preds = model.predict(horizon_days=14)
        self.assertEqual(len(preds), 14)
        self.assertTrue(all(p >= 0 for p in preds))

    def test_ml_regression_model(self):
        model = MLRegressionForecastModel()
        model.fit(self.history_df)
        preds = model.predict(horizon_days=14)
        self.assertEqual(len(preds), 14)
        self.assertTrue(all(p >= 0 for p in preds))

    def test_ensemble_model(self):
        model = EnsembleForecastModel()
        model.fit(self.history_df)
        preds = model.predict(horizon_days=14)
        self.assertEqual(len(preds), 14)
        self.assertTrue(all(p >= 0 for p in preds))

    def test_confidence_intervals(self):
        model = EnsembleForecastModel()
        model.fit(self.history_df)
        preds = model.predict(horizon_days=7)
        lowers, uppers = model.compute_confidence_intervals(preds, confidence_level=0.95)

        for l, p, u in zip(lowers, preds, uppers):
            self.assertLessEqual(l, p)
            self.assertLessEqual(p, u)
            self.assertGreaterEqual(l, 0)

    def test_unfitted_predict_raises_error(self):
        model = BaselineForecastModel()
        with self.assertRaises(ValidationError):
            model.predict(horizon_days=7)


class TestForecastEvaluator(unittest.TestCase):
    """Unit tests for evaluation metrics and model benchmarking."""

    def test_calculate_metrics_exact(self):
        actuals = [100.0, 110.0, 120.0, 130.0]
        preds = [102.0, 108.0, 125.0, 128.0]
        metrics = ForecastEvaluator.calculate_metrics(actuals, preds)

        self.assertIn("mae", metrics)
        self.assertIn("rmse", metrics)
        self.assertIn("mape", metrics)
        self.assertIn("r2_score", metrics)
        self.assertIn("accuracy", metrics)
        self.assertGreater(metrics["accuracy"], 0.90)

    def test_safe_mape_with_zeros(self):
        actuals = [0.0, 10.0, 0.0]
        preds = [0.0, 10.0, 1.0]
        metrics = ForecastEvaluator.calculate_metrics(actuals, preds)
        self.assertFalse(np.isnan(metrics["mape"]))
        self.assertFalse(np.isinf(metrics["mape"]))

    def test_benchmark_all_models(self):
        gen = SyntheticDemandGenerator(seed=42)
        df = gen.generate_aggregated_demand_series(days=60)
        benchmarks = ForecastEvaluator.benchmark_all_models(df, test_days=14)

        self.assertGreaterEqual(len(benchmarks), 3)
        self.assertEqual(benchmarks[0]["name"], "Ensemble Neural/ML Blend")


class TestForecastingService(unittest.TestCase):
    """Integration tests for the unified forecasting service orchestrator."""

    def setUp(self):
        self.service = DemandForecastingService()

    def test_generate_demand_forecast_structure(self):
        result = self.service.generate_demand_forecast(
            item_id="SKU-POL-DSL-01",
            depot="DEPOT-LEH-01",
            horizon_days=14,
            model_name="ensemble",
        )

        self.assertIn("series", result)
        self.assertIn("summary", result)
        self.assertIn("metadata", result)

        # 7 history + 14 forecast = 21 points
        self.assertEqual(len(result["series"]), 21)

        # Validate series item schema
        first_hist = result["series"][0]
        self.assertTrue(first_hist["isHistorical"])
        self.assertIsNotNone(first_hist["actual"])
        self.assertIsNone(first_hist["forecast"])

        first_pred = result["series"][7]
        self.assertFalse(first_pred["isHistorical"])
        self.assertIsNone(first_pred["actual"])
        self.assertIsNotNone(first_pred["forecast"])
        self.assertIsNotNone(first_pred["lowerBound"])
        self.assertIsNotNone(first_pred["upperBound"])
        self.assertIsNotNone(first_pred["projectedStock"])

    def test_unknown_sku_raises_not_found(self):
        with self.assertRaises(NotFoundError):
            self.service.generate_demand_forecast(item_id="UNKNOWN-SKU-99")

    def test_invalid_horizon_raises_validation_error(self):
        with self.assertRaises(ValidationError):
            self.service.generate_demand_forecast(horizon_days=0)
        with self.assertRaises(ValidationError):
            self.service.generate_demand_forecast(horizon_days=100)

    def test_retrain_model_pipeline(self):
        retrain_res = self.service.retrain_model_pipeline()
        self.assertEqual(retrain_res["pipeline_status"], "synchronized")
        self.assertIn("accuracy", retrain_res)
        self.assertTrue(retrain_res["is_synthetic"])


class TestForecastApiEndpoints(unittest.TestCase):
    """Integration tests for FastAPI v1 demand forecasting endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def test_get_forecast_endpoint_camel_case(self):
        response = self.client.get("/api/v1/forecast?itemId=SKU-POL-DSL-01&depot=all&horizonDays=14&modelName=ensemble")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIn("series", body["data"])
        self.assertIn("summary", body["data"])
        self.assertEqual(body["data"]["summary"]["horizonDays"], 14)

    def test_get_forecast_endpoint_snake_case(self):
        response = self.client.get("/api/v1/forecast?item_id=SKU-ORD-556-03&horizon_days=30&model_name=baseline")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["summary"]["horizonDays"], 30)

    def test_get_item_forecast_endpoint(self):
        response = self.client.get("/api/v1/forecasting/item/SKU-RAT-MRE-05?horizon_days=14")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])

    def test_trigger_retrain_endpoint(self):
        response = self.client.post("/api/v1/forecast/retrain", json={"model_override": "ensemble"})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["pipeline_status"], "synchronized")

    def test_get_metrics_endpoint(self):
        response = self.client.get("/api/v1/forecasting/metrics")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIn("models", body["data"])
        self.assertGreaterEqual(len(body["data"]["models"]), 3)


if __name__ == "__main__":
    unittest.main()
