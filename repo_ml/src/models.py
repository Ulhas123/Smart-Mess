"""
src/models.py  – Phase 4 (Part A)
Feature engineering and all forecasting models:
  - Seasonal-naive baseline
  - Holt-Winters (ExponentialSmoothing)
  - SARIMA
  - LightGBM point forecast
  - LightGBM quantile forecast (q10, q50, q90)
"""

import numpy as np
import pandas as pd
import warnings
import pickle
from pathlib import Path

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


# ─────────────────────────────────────────────────────────────
# 1.  Data loading and chronological splits
# ─────────────────────────────────────────────────────────────

TRAIN_END = "2026-03-31"
VAL_END   = "2026-06-30"
TEST_END  = "2026-10-10"


def load_data(hostel: str = None, slot: str = None) -> pd.DataFrame:
    df = pd.read_csv(DATA / "synthetic_headcount.csv", parse_dates=["date"])
    if hostel:
        df = df[df["hostel"] == hostel]
    if slot:
        df = df[df["slot"] == slot]
    return df.sort_values("date").reset_index(drop=True)


def chronological_split(df: pd.DataFrame):
    train = df[df["date"] <= TRAIN_END].copy()
    val   = df[(df["date"] > TRAIN_END) & (df["date"] <= VAL_END)].copy()
    test  = df[(df["date"] > VAL_END)  & (df["date"] <= TEST_END)].copy()
    return train, val, test


# ─────────────────────────────────────────────────────────────
# 2.  Feature engineering
# ─────────────────────────────────────────────────────────────

LAG_DAYS   = [1, 7, 14]
ROLL_WINS  = [7, 14, 28]

CALENDAR_FEATS = [
    "is_weekend", "is_holiday", "is_midsem_exam", "is_endsem_exam",
    "is_makeup_exam", "is_backpaper_exam", "is_c2_assessment",
    "is_project_eval", "is_mid_break", "is_end_break", "is_summer_sem",
    "is_pre_semester", "is_any_exam", "is_no_classes",
    "days_to_next_exam_start", "days_since_last_exam_end",
    "festival_kernel", "is_blue_event", "is_fest", "is_campus_event",
]
MENU_FEATS = [
    "has_dessert", "is_fast_food_item", "has_nonveg_option", "is_special_item",
]
WEATHER_FEATS = [
    "temp_max", "temp_min", "precip_mm", "is_rainy",
]
SLOT_FEATS  = ["is_lunch", "is_dinner"]
WDAY_FEATS  = [f"wday_{i}" for i in range(7)]


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add lag, rolling, and indicator features.  No target leakage."""
    df = df.sort_values(["hostel", "slot", "date"]).copy()

    # Slot dummies
    df["is_lunch"]  = (df["slot"] == "lunch").astype(int)
    df["is_dinner"] = (df["slot"] == "dinner").astype(int)

    # Weekday dummies
    dow = df["date"].dt.dayofweek
    for i in range(7):
        df[f"wday_{i}"] = (dow == i).astype(int)

    # Month, day-of-year cyclical encoding
    doy = df["date"].dt.dayofyear
    df["sin_doy"] = np.sin(2 * np.pi * doy / 365.25)
    df["cos_doy"] = np.cos(2 * np.pi * doy / 365.25)
    df["month"]   = df["date"].dt.month

    # Lag and rolling — per (hostel, slot) group to avoid cross-contamination
    groups = df.groupby(["hostel", "slot"])
    lag_cols, roll_cols = [], []

    for lag in LAG_DAYS:
        col = f"lag_{lag}d"
        df[col] = groups["headcount"].shift(lag)
        lag_cols.append(col)

    for win in ROLL_WINS:
        col = f"roll{win}d_mean"
        # Use shift(1) to avoid using current day
        df[col] = groups["headcount"].transform(
            lambda x: x.shift(1).rolling(win, min_periods=max(1, win//2)).mean()
        )
        col2 = f"roll{win}d_std"
        df[col2] = groups["headcount"].transform(
            lambda x: x.shift(1).rolling(win, min_periods=max(1, win//2)).std()
        )
        roll_cols.extend([col, col2])

    # Same-slot same-weekday last week (seasonal naive feature)
    df["lag_7d_same_slot"] = groups["headcount"].shift(7)

    return df, lag_cols, roll_cols


def get_feature_cols(lag_cols, roll_cols,
                     include_calendar=True,
                     include_weather=True) -> list:
    cols = (SLOT_FEATS + WDAY_FEATS
            + ["sin_doy", "cos_doy", "month"]
            + lag_cols + roll_cols + ["lag_7d_same_slot"]
            + MENU_FEATS)
    if include_calendar:
        cols += CALENDAR_FEATS
    if include_weather:
        cols += WEATHER_FEATS
    return [c for c in cols if c]


# ─────────────────────────────────────────────────────────────
# 3.  Baseline models
# ─────────────────────────────────────────────────────────────

def seasonal_naive_predict(train: pd.DataFrame, test: pd.DataFrame) -> pd.Series:
    """Same weekday + slot last week."""
    lookup = train.set_index(["hostel", "slot", "weekday"])["headcount"]
    preds = []
    for _, row in test.iterrows():
        try:
            # Exact match last week
            past = train[
                (train["hostel"]  == row["hostel"]) &
                (train["slot"]    == row["slot"])   &
                (train["weekday"] == row["weekday"])
            ].sort_values("date")
            if len(past) > 0:
                preds.append(past.iloc[-1]["headcount"])
            else:
                preds.append(train["headcount"].mean())
        except:
            preds.append(train["headcount"].mean())
    return pd.Series(preds, index=test.index)


def holtwinters_predict(train_series: pd.Series,
                        n_periods: int,
                        seasonal_periods: int = 7):
    """Holt-Winters per (hostel, slot) series."""
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    try:
        model = ExponentialSmoothing(
            train_series,
            trend="add",
            seasonal="add",
            seasonal_periods=seasonal_periods,
            initialization_method="estimated",
        ).fit(optimized=True)
        return model.forecast(n_periods)
    except Exception as e:
        print(f"  [HW] failed: {e}, using mean")
        return pd.Series([train_series.mean()] * n_periods)


def sarima_predict(train_series: pd.Series,
                   n_periods: int,
                   order=(1, 1, 1),
                   seasonal_order=(1, 0, 1, 7)):
    """SARIMA per series."""
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    try:
        model = SARIMAX(
            train_series,
            order=order,
            seasonal_order=seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False,
        ).fit(disp=False)
        forecast = model.get_forecast(steps=n_periods)
        return forecast.predicted_mean
    except Exception as e:
        print(f"  [SARIMA] failed: {e}, using mean")
        return pd.Series([train_series.mean()] * n_periods)


# ─────────────────────────────────────────────────────────────
# 4.  LightGBM models
# ─────────────────────────────────────────────────────────────

import lightgbm as lgb


def train_lgbm_point(X_train, y_train,
                     X_val=None, y_val=None,
                     loss="mae"):
    """Point-forecast LightGBM (MAE or MSE loss) with conservative tree depth to prevent overfitting."""
    objective = "regression_l1" if loss == "mae" else "regression"
    params = dict(
        objective=objective,
        n_estimators=600,
        learning_rate=0.04,
        num_leaves=31,            # Conservative tree depth prevents overfitting
        min_child_samples=25,     # Requires at least 25 samples per leaf
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,            # L1 regularization
        reg_lambda=0.1,           # L2 regularization
        verbose=-1,
    )
    callbacks = [lgb.log_evaluation(-1)]
    eval_set = None
    if X_val is not None:
        eval_set = [(X_val, y_val)]
        callbacks.insert(0, lgb.early_stopping(50, verbose=False))
        
    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=eval_set,
        callbacks=callbacks,
    )
    return model


def train_lgbm_quantile(X_train, y_train,
                        X_val=None, y_val=None,
                        quantile: float = 0.5):
    """Quantile-regression LightGBM."""
    params = dict(
        objective="quantile",
        alpha=quantile,
        n_estimators=600,
        learning_rate=0.04,
        num_leaves=31,            # Conservative tree depth prevents overfitting
        min_child_samples=25,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=0.1,
        verbose=-1,
    )
    callbacks = [lgb.log_evaluation(-1)]
    eval_set = None
    if X_val is not None:
        eval_set = [(X_val, y_val)]
        callbacks.insert(0, lgb.early_stopping(50, verbose=False))
        
    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=eval_set,
        callbacks=callbacks,
    )
    return model


def train_all_lgbm(X_train, y_train, X_val, y_val):
    """Train point + three quantile models."""
    print("  [LightGBM] Training point model (MAE)...")
    m_point = train_lgbm_point(X_train, y_train, X_val, y_val, loss="mae")
    print("  [LightGBM] Training q10...")
    m_q10   = train_lgbm_quantile(X_train, y_train, X_val, y_val, 0.10)
    print("  [LightGBM] Training q50...")
    m_q50   = train_lgbm_quantile(X_train, y_train, X_val, y_val, 0.50)
    print("  [LightGBM] Training q90...")
    m_q90   = train_lgbm_quantile(X_train, y_train, X_val, y_val, 0.90)
    return {"point": m_point, "q10": m_q10, "q50": m_q50, "q90": m_q90}


def predict_monotone_quantiles(models: dict, X: pd.DataFrame):
    """
    Predict q10, q50, q90 and enforce mathematical non-crossing monotonicity:
    q10 <= q50 <= q90. Prevents unphysical interval inversions.
    """
    q10_raw = models["q10"].predict(X)
    q50_raw = models["q50"].predict(X)
    q90_raw = models["q90"].predict(X)

    q50 = np.clip(q50_raw, 0, None)
    q10 = np.clip(np.minimum(q10_raw, q50), 0, None)
    q90 = np.clip(np.maximum(q90_raw, q50), 0, None)
    return q10, q50, q90


# ─────────────────────────────────────────────────────────────
# 5.  Rolling-origin backtest
# ─────────────────────────────────────────────────────────────

def rolling_origin_backtest(df: pd.DataFrame,
                             feature_cols: list,
                             n_origins: int = 6,
                             horizon: int = 14) -> pd.DataFrame:
    """
    Rolling-origin (expanding window) backtest.
    Returns DataFrame with columns: origin_date, step_ahead, actual, predicted.
    """
    df = df.sort_values("date").reset_index(drop=True)
    all_dates = df["date"].unique()
    all_dates = np.sort(all_dates)

    # Pick n_origins evenly spaced from training period
    cutoffs = pd.date_range(
        start="2025-06-01", end=TRAIN_END, periods=n_origins
    )

    records = []
    for cutoff in cutoffs:
        tr = df[df["date"] <= cutoff]
        te = df[(df["date"] > cutoff) &
                (df["date"] <= cutoff + pd.Timedelta(days=horizon))]
        if len(tr) < 50 or len(te) == 0:
            continue

        X_tr = tr[feature_cols].fillna(0)
        y_tr = tr["headcount"]
        X_te = te[feature_cols].fillna(0)

        m = train_lgbm_point(X_tr, y_tr, loss="mae")
        preds = m.predict(X_te)

        for i, (_, row) in enumerate(te.iterrows()):
            records.append({
                "origin_date": str(cutoff.date()),
                "step_ahead":  i + 1,
                "actual":      row["headcount"],
                "predicted":   round(preds[i]),
                "hostel":      row["hostel"],
                "slot":        row["slot"],
            })

    return pd.DataFrame(records)


if __name__ == "__main__":
    print("[models.py] Feature engineering test...")
    df = load_data()
    df_feat, lag_cols, roll_cols = add_features(df)
    feat_cols = get_feature_cols(lag_cols, roll_cols)
    train, val, test = chronological_split(df_feat)
    print(f"  Train: {len(train):,}  Val: {len(val):,}  Test: {len(test):,}")
    print(f"  Feature count: {len(feat_cols)}")
    print("[models.py] OK")
