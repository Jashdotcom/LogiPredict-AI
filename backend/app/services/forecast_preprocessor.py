"""
LogiPredict AI - Time-Series Data Preprocessor & Feature Pipeline
================================================================
Phase 5.2: Forecasting Engine Preprocessor
Indian Army Forward Supply Chain (SIH 2026)

Validates, cleans, standardizes, and engineers lag features for time-series demand
modeling while strictly preventing future data leakage and lookahead bias.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Union
import numpy as np
import pandas as pd

from app.utils.exceptions import ValidationError


class ForecastDataPreprocessor:
    """
    Sanitizes, validates, and engineers features from historical inventory time-series.
    """

    @staticmethod
    def clean_and_standardize_series(
        data: Union[pd.DataFrame, List[Dict[str, Any]]],
        date_col: str = "date",
        target_col: str = "demand",
        fill_missing_dates: bool = True,
    ) -> pd.DataFrame:
        """
        Cleans, verifies non-negativity, deduplicates, and reindexes to a complete daily calendar.

        Args:
            data: Input DataFrame or list of dict records.
            date_col: Column name containing date strings or datetimes.
            target_col: Column name for the target demand variable.
            fill_missing_dates: Whether to interpolate/fill missing calendar dates.

        Returns:
            Sanitized, strictly sorted pd.DataFrame with ['date', 'timestamp', target_col].
        """
        if isinstance(data, list):
            if not data:
                raise ValidationError("Input time-series dataset cannot be empty.")
            df = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            if data.empty:
                raise ValidationError("Input time-series DataFrame cannot be empty.")
            df = data.copy()
        else:
            raise ValidationError(f"Unsupported data type for preprocessor: {type(data)}")

        if date_col not in df.columns:
            raise ValidationError(f"Date column '{date_col}' not found in time-series data.")

        if target_col not in df.columns:
            raise ValidationError(f"Target demand column '{target_col}' not found in dataset.")

        # Convert date to datetime
        try:
            df["timestamp"] = pd.to_datetime(df[date_col])
        except Exception as e:
            raise ValidationError(f"Failed to parse dates in column '{date_col}': {str(e)}")

        # Ensure non-negative target values
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce").fillna(0.0)
        if (df[target_col] < 0).any():
            # Clamp negative telemetry to 0 with warning
            df[target_col] = df[target_col].clip(lower=0.0)

        # Deduplicate by date if multiple entries exist (aggregate by sum)
        df["date"] = df["timestamp"].dt.strftime("%Y-%m-%d")
        grouped = df.groupby(["date", "timestamp"], as_index=False)[target_col].sum()
        grouped.sort_values(by="timestamp", inplace=True)
        grouped.reset_index(drop=True, inplace=True)

        if not fill_missing_dates or len(grouped) <= 1:
            return grouped

        # Reindex across complete contiguous daily range
        start_date = grouped["timestamp"].min()
        end_date = grouped["timestamp"].max()
        full_idx = pd.date_range(start=start_date, end=end_date, freq="D")

        reindexed_df = pd.DataFrame({"timestamp": full_idx})
        reindexed_df["date"] = reindexed_df["timestamp"].dt.strftime("%Y-%m-%d")

        merged = pd.merge(reindexed_df, grouped[["timestamp", target_col]], on="timestamp", how="left")

        # Fill missing intermediate demand via linear interpolation and forward/backward fill
        merged[target_col] = merged[target_col].interpolate(method="linear").bfill().ffill().fillna(0.0)
        merged[target_col] = merged[target_col].clip(lower=0.0)

        return merged

    @staticmethod
    def train_test_split_chronological(
        df: pd.DataFrame,
        test_days: int = 14,
        date_col: str = "timestamp",
        target_col: str = "demand",
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Performs strict chronological train/test split preventing future data leakage.

        Args:
            df: Cleaned chronological DataFrame.
            test_days: Number of trailing time-steps reserved for out-of-sample validation.
            date_col: Timestamp column name.
            target_col: Target column name.

        Returns:
            Tuple of (train_df, test_df)
        """
        if len(df) <= test_days:
            raise ValidationError(
                f"Dataset length ({len(df)}) must exceed test holdout window ({test_days} days)."
            )

        sorted_df = df.sort_values(by=date_col).reset_index(drop=True)
        split_idx = len(sorted_df) - test_days

        train_df = sorted_df.iloc[:split_idx].copy().reset_index(drop=True)
        test_df = sorted_df.iloc[split_idx:].copy().reset_index(drop=True)

        return train_df, test_df

    @staticmethod
    def create_lagged_features(
        df: pd.DataFrame,
        target_col: str = "demand",
        lags: Optional[List[int]] = None,
        rolling_windows: Optional[List[int]] = None,
        drop_na: bool = True,
    ) -> pd.DataFrame:
        """
        Constructs autoregressive lag and rolling window features for ML regression.
        All rolling windows are shifted by 1 step to strictly prevent target leakage.

        Args:
            df: Cleaned time-series DataFrame with 'timestamp' and target_col.
            target_col: Target demand column.
            lags: List of lag periods (default: [1, 2, 3, 7, 14]).
            rolling_windows: List of rolling mean windows (default: [3, 7, 14]).
            drop_na: Whether to drop initial rows with NaN feature values.

        Returns:
            DataFrame augmented with engineered lag, rolling, and temporal calendar features.
        """
        if lags is None:
            lags = [1, 2, 3, 7, 14]
        if rolling_windows is None:
            rolling_windows = [3, 7, 14]

        res = df.copy()

        # Calendar temporal features
        res["day_of_week"] = res["timestamp"].dt.dayofweek
        res["day_of_month"] = res["timestamp"].dt.day
        res["day_of_year"] = res["timestamp"].dt.dayofyear
        res["month"] = res["timestamp"].dt.month
        res["is_weekend"] = res["day_of_week"].isin([5, 6]).astype(int)

        # Autoregressive Lag Features
        for lag in lags:
            res[f"lag_{lag}"] = res[target_col].shift(lag)

        # Shifted Rolling Statistics (shift(1) ensures no lookahead of current step)
        shifted_target = res[target_col].shift(1)
        for window in rolling_windows:
            res[f"rolling_mean_{window}"] = shifted_target.rolling(window=window, min_periods=1).mean()
            res[f"rolling_std_{window}"] = shifted_target.rolling(window=window, min_periods=1).std().fillna(0.0)

        if drop_na:
            max_lag = max(lags) if lags else 1
            if len(res) > max_lag:
                res = res.iloc[max_lag:].copy().reset_index(drop=True)

        return res


# Module singleton instance
forecast_preprocessor = ForecastDataPreprocessor()
