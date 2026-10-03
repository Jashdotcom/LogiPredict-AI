"""
LogiPredict AI - Forecast Model Evaluation & Benchmarking
=========================================================
Phase 5.2: Forecasting Engine Evaluation Service
Indian Army Forward Supply Chain (SIH 2026)

Computes standard error metrics (MAE, RMSE, MAPE, R²) on strictly held-out historical
test sets to evaluate out-of-sample model accuracy without lookahead bias.
"""

from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.services.forecast_preprocessor import ForecastDataPreprocessor
from app.services.forecast_models import (
    BaseForecastModel,
    BaselineForecastModel,
    MovingAverageForecastModel,
    MLRegressionForecastModel,
    EnsembleForecastModel,
)
from app.utils.exceptions import ValidationError


class ForecastEvaluator:
    """
    Evaluates forecasting model performance against out-of-sample ground truth data.
    """

    @staticmethod
    def calculate_metrics(
        actuals: List[float],
        predictions: List[float],
        epsilon: float = 1e-4,
    ) -> Dict[str, float]:
        """
        Calculates MAE, RMSE, MAPE (with zero-division safeguard), and R² score.

        Args:
            actuals: Ground truth observed demand values.
            predictions: Forecast point predictions.
            epsilon: Minimum denominator safeguard to prevent division by zero.

        Returns:
            Dict containing ['mae', 'rmse', 'mape', 'r2_score', 'accuracy']
        """
        if len(actuals) == 0 or len(predictions) == 0:
            raise ValidationError("Actual and prediction vectors cannot be empty.")
        if len(actuals) != len(predictions):
            raise ValidationError(
                f"Dimension mismatch: actuals ({len(actuals)}) vs predictions ({len(predictions)})"
            )

        y_true = np.array(actuals, dtype=float)
        y_pred = np.array(predictions, dtype=float)

        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))

        # Safe MAPE calculation avoiding zero division on silent days
        denominator = np.maximum(np.abs(y_true), epsilon)
        mape = float(np.mean(np.abs(y_true - y_pred) / denominator))

        # Safe R² score calculation
        if np.var(y_true) < 1e-6:
            r2 = 1.0 if mae < 1e-6 else 0.0
        else:
            r2 = float(r2_score(y_true, y_pred))
            # Floor catastrophic negative R² to -1.0 for UI stability
            r2 = max(-1.0, min(1.0, r2))

        accuracy = max(0.0, min(1.0, 1.0 - mape))

        return {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 4),
            "r2_score": round(r2, 4),
            "accuracy": round(accuracy, 4),
        }

    @classmethod
    def evaluate_model_holdout(
        cls,
        model: BaseForecastModel,
        df: pd.DataFrame,
        test_days: int = 14,
        target_col: str = "demand",
    ) -> Dict[str, Any]:
        """
        Splits dataset chronologically, fits model on training split, and evaluates on holdout set.

        Args:
            model: Forecast model instance to evaluate.
            df: Historical demand DataFrame.
            test_days: Number of trailing out-of-sample days.
            target_col: Target demand column.

        Returns:
            Dict containing evaluation metrics and test summary.
        """
        clean_df = ForecastDataPreprocessor.clean_and_standardize_series(df, target_col=target_col)
        train_df, test_df = ForecastDataPreprocessor.train_test_split_chronological(
            clean_df,
            test_days=test_days,
            target_col=target_col,
        )

        model.fit(train_df, target_col=target_col)
        preds = model.predict(len(test_df))
        actuals = test_df[target_col].tolist()

        metrics = cls.calculate_metrics(actuals, preds)
        metrics["model_name"] = model.name
        metrics["model_type"] = model.model_type
        metrics["train_samples"] = len(train_df)
        metrics["test_samples"] = len(test_df)
        return metrics

    @classmethod
    def benchmark_all_models(
        cls,
        df: pd.DataFrame,
        test_days: int = 14,
        target_col: str = "demand",
    ) -> List[Dict[str, Any]]:
        """
        Runs standardized out-of-sample benchmark comparison across all model architectures.

        Returns:
            List of model metric summaries sorted by accuracy (highest first).
        """
        models: List[BaseForecastModel] = [
            EnsembleForecastModel(name="Ensemble Neural/ML Blend"),
            MLRegressionForecastModel(name="XGBoost / ML Regressor"),
            MovingAverageForecastModel(name="Moving Average (7-Day)", window_size=7),
            BaselineForecastModel(name="Historical Mean Baseline"),
        ]

        results = []
        for m in models:
            try:
                res = cls.evaluate_model_holdout(m, df, test_days=test_days, target_col=target_col)
                status = "active" if m.model_type == "ensemble" else "standby" if m.model_type in ["ml_regression", "moving_average"] else "baseline"
                results.append({
                    "name": m.name,
                    "model_type": m.model_type,
                    "accuracy": f"{round(res['accuracy'] * 100, 1)}%",
                    "mape": f"{round(res['mape'] * 100, 1)}%",
                    "rmse": res["rmse"],
                    "mae": res["mae"],
                    "r2_score": res["r2_score"],
                    "status": status,
                    "raw_accuracy": res["accuracy"],
                })
            except Exception:
                continue

        # Sort leaderboard by raw accuracy descending
        results.sort(key=lambda x: x["raw_accuracy"], reverse=True)
        return results


# Module singleton instance
forecast_evaluator = ForecastEvaluator()
