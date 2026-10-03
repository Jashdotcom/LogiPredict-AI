"""
LogiPredict AI - Time-Series Forecasting Models
===============================================
Phase 5.2: Forecasting Engine Models
Indian Army Forward Supply Chain (SIH 2026)

Modular implementation of forecasting architectures:
1. Baseline Historical Mean / Day-of-Week Model
2. Moving Average Model (Configurable window)
3. Machine Learning Autoregressive Regressor (Scikit-Learn Ridge/Linear)
4. Weighted Ensemble Model
"""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta
import math
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

from app.services.forecast_preprocessor import ForecastDataPreprocessor
from app.utils.exceptions import ValidationError


class BaseForecastModel(ABC):
    """
    Abstract base class for all time-series demand forecasting models.
    """

    def __init__(self, name: str, model_type: str):
        self.name = name
        self.model_type = model_type
        self.is_fitted = False
        self.history_df: Optional[pd.DataFrame] = None
        self.target_col: str = "demand"
        self.residuals: np.ndarray = np.array([])
        self.residual_std: float = 1.0

    @abstractmethod
    def fit(self, history_df: pd.DataFrame, target_col: str = "demand") -> "BaseForecastModel":
        """Fits the forecasting model on historical training data."""
        pass

    @abstractmethod
    def predict(self, horizon_days: int) -> List[float]:
        """Generates future demand point predictions for the given horizon."""
        pass

    def compute_confidence_intervals(
        self,
        predictions: List[float],
        confidence_level: float = 0.95,
    ) -> Tuple[List[float], List[float]]:
        """
        Computes lower and upper prediction intervals expanding over the horizon.

        Using z * std * sqrt(1 + h * expansion_rate) to represent compounding uncertainty.
        """
        # z-score: 1.96 for 95%, 1.645 for 90%, 1.28 for 80%
        z = 1.96 if confidence_level >= 0.95 else 1.645 if confidence_level >= 0.90 else 1.28
        base_std = max(self.residual_std, 1.0)

        lower_bounds = []
        upper_bounds = []

        for h, pred in enumerate(predictions, start=1):
            # Compound uncertainty expansion factor over forward horizon
            horizon_factor = math.sqrt(1.0 + (h * 0.05))
            margin = z * base_std * horizon_factor

            # Floor lower bound to 0 (demand cannot be negative)
            lower_b = max(0.0, round(pred - margin, 2))
            upper_b = max(lower_b, round(pred + margin, 2))

            lower_bounds.append(lower_b)
            upper_bounds.append(upper_b)

        return lower_bounds, upper_bounds


class BaselineForecastModel(BaseForecastModel):
    """
    Transparent historical baseline model incorporating historical mean and day-of-week profile.
    """

    def __init__(self, name: str = "Historical Mean Baseline"):
        super().__init__(name=name, model_type="baseline")
        self.global_mean: float = 0.0
        self.dow_means: Dict[int, float] = {}
        self.last_observation: float = 0.0

    def fit(self, history_df: pd.DataFrame, target_col: str = "demand") -> "BaselineForecastModel":
        if history_df.empty:
            raise ValidationError("Cannot fit Baseline model on empty dataset.")

        self.history_df = history_df.copy()
        self.target_col = target_col

        clean_df = ForecastDataPreprocessor.clean_and_standardize_series(self.history_df, target_col=target_col)
        self.global_mean = float(clean_df[target_col].mean())
        self.last_observation = float(clean_df[target_col].iloc[-1])

        clean_df["dow"] = clean_df["timestamp"].dt.dayofweek
        self.dow_means = clean_df.groupby("dow")[target_col].mean().to_dict()

        # Calculate in-sample residuals
        preds = clean_df["dow"].map(self.dow_means).fillna(self.global_mean).values
        self.residuals = clean_df[target_col].values - preds
        self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else max(1.0, self.global_mean * 0.1)

        self.is_fitted = True
        return self

    def predict(self, horizon_days: int) -> List[float]:
        if not self.is_fitted or self.history_df is None:
            raise ValidationError("Baseline model must be fitted before predicting.")

        last_dt = self.history_df["timestamp"].max()
        predictions = []

        for h in range(1, horizon_days + 1):
            target_dt = last_dt + timedelta(days=h)
            dow = target_dt.weekday()
            pred = self.dow_means.get(dow, self.global_mean)
            predictions.append(max(0.0, round(float(pred), 2)))

        return predictions


class MovingAverageForecastModel(BaseForecastModel):
    """
    Moving average model with configurable rolling window and recursive multi-step extrapolation.
    """

    def __init__(self, name: str = "Moving Average (7-Day)", window_size: int = 7):
        super().__init__(name=name, model_type="moving_average")
        self.window_size = window_size
        self.recent_values: List[float] = []

    def fit(self, history_df: pd.DataFrame, target_col: str = "demand") -> "MovingAverageForecastModel":
        if history_df.empty:
            raise ValidationError("Cannot fit Moving Average model on empty dataset.")

        self.history_df = history_df.copy()
        self.target_col = target_col

        clean_df = ForecastDataPreprocessor.clean_and_standardize_series(self.history_df, target_col=target_col)
        values = clean_df[target_col].values
        self.recent_values = list(values[-self.window_size:]) if len(values) >= self.window_size else list(values)

        # Calculate rolling in-sample residuals
        rolling_series = clean_df[target_col].rolling(window=self.window_size).mean().shift(1)
        valid_mask = ~rolling_series.isna()
        if valid_mask.sum() > 0:
            self.residuals = clean_df.loc[valid_mask, target_col].values - rolling_series[valid_mask].values
            self.residual_std = float(np.std(self.residuals))
        else:
            self.residuals = np.array([0.0])
            self.residual_std = max(1.0, float(np.std(values))) if len(values) > 1 else 1.0

        self.is_fitted = True
        return self

    def predict(self, horizon_days: int) -> List[float]:
        if not self.is_fitted:
            raise ValidationError("Moving Average model must be fitted before predicting.")

        buffer = list(self.recent_values)
        predictions = []

        for _ in range(horizon_days):
            current_ma = float(np.mean(buffer[-self.window_size:])) if buffer else 0.0
            pred = max(0.0, round(current_ma, 2))
            predictions.append(pred)
            buffer.append(pred)

        return predictions


class MLRegressionForecastModel(BaseForecastModel):
    """
    Autoregressive Scikit-Learn regressor utilizing engineered lag and rolling features.
    """

    def __init__(self, name: str = "ML Lagged Feature Regressor", alpha: float = 1.0):
        super().__init__(name=name, model_type="ml_regression")
        self.model = Ridge(alpha=alpha, positive=False)
        self.feature_cols: List[str] = []
        self.last_feature_window: Optional[pd.DataFrame] = None

    def fit(self, history_df: pd.DataFrame, target_col: str = "demand") -> "MLRegressionForecastModel":
        if history_df.empty:
            raise ValidationError("Cannot fit ML Regression model on empty dataset.")

        self.history_df = history_df.copy()
        self.target_col = target_col

        clean_df = ForecastDataPreprocessor.clean_and_standardize_series(self.history_df, target_col=target_col)
        feat_df = ForecastDataPreprocessor.create_lagged_features(
            clean_df,
            target_col=target_col,
            lags=[1, 2, 3, 7, 14],
            rolling_windows=[3, 7, 14],
            drop_na=True,
        )

        if feat_df.empty or len(feat_df) < 5:
            # Fallback to simple lags if dataset is small
            feat_df = ForecastDataPreprocessor.create_lagged_features(
                clean_df,
                target_col=target_col,
                lags=[1, 2, 3],
                rolling_windows=[3],
                drop_na=True,
            )

        self.feature_cols = [c for c in feat_df.columns if c not in ["date", "timestamp", target_col]]
        X = feat_df[self.feature_cols].values
        y = feat_df[target_col].values

        self.model.fit(X, y)
        in_sample_preds = self.model.predict(X)
        self.residuals = y - in_sample_preds
        self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else 1.0

        # Save latest historical buffer for recursive forecasting
        self.last_feature_window = clean_df.copy()
        self.is_fitted = True
        return self

    def predict(self, horizon_days: int) -> List[float]:
        if not self.is_fitted or self.last_feature_window is None:
            raise ValidationError("ML Regression model must be fitted before predicting.")

        sim_df = self.last_feature_window.copy()
        last_dt = sim_df["timestamp"].max()
        predictions = []

        for h in range(1, horizon_days + 1):
            next_dt = last_dt + timedelta(days=h)

            # Construct augmented lagged feature row for next_dt
            feat_df = ForecastDataPreprocessor.create_lagged_features(
                sim_df,
                target_col=self.target_col,
                lags=[1, 2, 3, 7, 14],
                rolling_windows=[3, 7, 14],
                drop_na=False,
            )

            # Build feature vector for the latest step
            target_dow = next_dt.weekday()
            target_dom = next_dt.day
            target_doy = next_dt.timetuple().tm_yday
            target_month = next_dt.month
            is_weekend = 1 if target_dow in [5, 6] else 0

            latest_row = {}
            for col in self.feature_cols:
                if col == "day_of_week":
                    latest_row[col] = target_dow
                elif col == "day_of_month":
                    latest_row[col] = target_dom
                elif col == "day_of_year":
                    latest_row[col] = target_doy
                elif col == "month":
                    latest_row[col] = target_month
                elif col == "is_weekend":
                    latest_row[col] = is_weekend
                elif col in feat_df.columns:
                    latest_row[col] = feat_df[col].iloc[-1]
                else:
                    latest_row[col] = 0.0

            x_vec = np.array([[latest_row[col] for col in self.feature_cols]])
            raw_pred = float(self.model.predict(x_vec)[0])
            pred = max(0.0, round(raw_pred, 2))
            predictions.append(pred)

            # Append synthetic prediction to simulation buffer for subsequent autoregressive lags
            new_entry = pd.DataFrame([{
                "date": next_dt.strftime("%Y-%m-%d"),
                "timestamp": next_dt,
                self.target_col: pred,
            }])
            sim_df = pd.concat([sim_df, new_entry], ignore_index=True)

        return predictions


class EnsembleForecastModel(BaseForecastModel):
    """
    Weighted ensemble combining ML Regressor, Moving Average, and Baseline models.
    """

    def __init__(
        self,
        name: str = "Ensemble Neural/ML Blend",
        weights: Optional[Dict[str, float]] = None,
    ):
        super().__init__(name=name, model_type="ensemble")
        self.weights = weights or {"ml_regression": 0.50, "moving_average": 0.30, "baseline": 0.20}
        self.baseline_model = BaselineForecastModel()
        self.ma_model = MovingAverageForecastModel(window_size=7)
        self.ml_model = MLRegressionForecastModel()

    def fit(self, history_df: pd.DataFrame, target_col: str = "demand") -> "EnsembleForecastModel":
        self.history_df = history_df.copy()
        self.target_col = target_col

        self.baseline_model.fit(history_df, target_col=target_col)
        self.ma_model.fit(history_df, target_col=target_col)
        self.ml_model.fit(history_df, target_col=target_col)

        # Ensemble residual calculation
        w_ml = self.weights.get("ml_regression", 0.5)
        w_ma = self.weights.get("moving_average", 0.3)
        w_base = self.weights.get("baseline", 0.2)
        total_w = w_ml + w_ma + w_base

        combined_std = (
            (w_ml * self.ml_model.residual_std)
            + (w_ma * self.ma_model.residual_std)
            + (w_base * self.baseline_model.residual_std)
        ) / total_w

        self.residual_std = max(1.0, float(combined_std))
        self.is_fitted = True
        return self

    def predict(self, horizon_days: int) -> List[float]:
        if not self.is_fitted:
            raise ValidationError("Ensemble model must be fitted before predicting.")

        p_base = self.baseline_model.predict(horizon_days)
        p_ma = self.ma_model.predict(horizon_days)
        p_ml = self.ml_model.predict(horizon_days)

        w_ml = self.weights.get("ml_regression", 0.5)
        w_ma = self.weights.get("moving_average", 0.3)
        w_base = self.weights.get("baseline", 0.2)
        total_w = w_ml + w_ma + w_base

        ensemble_preds = []
        for b, m, l in zip(p_base, p_ma, p_ml):
            blended = ((w_base * b) + (w_ma * m) + (w_ml * l)) / total_w
            ensemble_preds.append(max(0.0, round(float(blended), 2)))

        return ensemble_preds


def get_forecast_model(model_name: str = "ensemble") -> BaseForecastModel:
    """
    Factory function instantiating model architecture from alias or identifier.
    """
    norm_name = (model_name or "ensemble").lower().strip()

    if norm_name in ["baseline", "historical_mean", "naive"]:
        return BaselineForecastModel()
    elif norm_name in ["moving_average", "moving_avg", "movingaverage", "ma_7", "ma"]:
        return MovingAverageForecastModel(window_size=7)
    elif norm_name in ["ml_regression", "ridge", "linear", "xgboost", "prophet"]:
        # Map ML aliases to robust Scikit-Learn regressor
        model_display = "XGBoost Regressor v2.4 (Simulated)" if "xgboost" in norm_name else (
            "Meta Prophet Time-Series (Simulated)" if "prophet" in norm_name else "ML Lagged Feature Regressor"
        )
        return MLRegressionForecastModel(name=model_display)
    else:
        return EnsembleForecastModel(name="Ensemble (ML + MA + Baseline)")
