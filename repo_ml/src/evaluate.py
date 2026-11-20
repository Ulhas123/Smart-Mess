"""
src/evaluate.py  – Phase 4 (Part B)
Full evaluation pipeline:
  - All models trained + evaluated
  - Metrics overall + by regime
  - Ablation study
  - Plots
  - results/metrics.csv
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

ROOT     = Path(__file__).resolve().parent.parent
RESULTS  = ROOT / "results"
PLOT_DIR = RESULTS / "plots"
RESULTS.mkdir(exist_ok=True)
PLOT_DIR.mkdir(exist_ok=True)


# ─────────────────────────────────────────────────────────────
# 1.  Metric functions
# ─────────────────────────────────────────────────────────────

def mae(y, yhat):
    return float(np.mean(np.abs(y - yhat)))

def rmse(y, yhat):
    return float(np.sqrt(np.mean((y - yhat)**2)))

def mape(y, yhat):
    mask = y > 0
    return float(np.mean(np.abs((y[mask] - yhat[mask]) / y[mask])) * 100)

def wape(y, yhat):
    return float(np.sum(np.abs(y - yhat)) / np.sum(np.abs(y)) * 100)

def pinball(y, yhat_q, q):
    e = y - yhat_q
    return float(np.mean(np.where(e >= 0, q * e, (q - 1) * e)))

def picp(y, lo, hi):
    """Prediction Interval Coverage Probability."""
    return float(np.mean((y >= lo) & (y <= hi)))

def pinaw(y, lo, hi):
    """Prediction Interval Normalised Average Width."""
    r = y.max() - y.min()
    if r == 0:
        return 0.0
    return float(np.mean(hi - lo) / r)

def metrics_dict(label, y, yhat, q10=None, q50=None, q90=None):
    y    = np.array(y, dtype=float)
    yhat = np.array(yhat, dtype=float)
    d = {
        "model":  label,
        "n":      len(y),
        "MAE":    round(mae(y, yhat), 2),
        "RMSE":   round(rmse(y, yhat), 2),
        "MAPE":   round(mape(y, yhat), 2),
        "WAPE":   round(wape(y, yhat), 2),
    }
    if q10 is not None and q50 is not None and q90 is not None:
        q10 = np.array(q10, dtype=float)
        q90 = np.array(q90, dtype=float)
        q50 = np.array(q50, dtype=float)
        d["Pinball_q10"] = round(pinball(y, q10, 0.10), 3)
        d["Pinball_q50"] = round(pinball(y, q50, 0.50), 3)
        d["Pinball_q90"] = round(pinball(y, q90, 0.90), 3)
        d["PICP_90"]     = round(picp(y, q10, q90), 3)
        d["PINAW_90"]    = round(pinaw(y, q10, q90), 3)
    return d


def metrics_by_regime(label, df, yhat_col, q10_col=None, q90_col=None, q50_col=None):
    """Metrics segmented by academic regime."""
    records = []
    regime_col = "academic_phase"
    for regime in df[regime_col].unique():
        sub = df[df[regime_col] == regime]
        if len(sub) < 5:
            continue
        y    = sub["headcount"].values
        yhat = sub[yhat_col].values
        q10  = sub[q10_col].values if q10_col else None
        q50  = sub[q50_col].values if q50_col else None
        q90  = sub[q90_col].values if q90_col else None
        d    = metrics_dict(f"{label}|{regime}", y, yhat, q10, q50, q90)
        d["regime"] = regime
        records.append(d)
    return records


def _compute_decision_metrics(y_true, y_pred, capacity=300):
    """
    Translates continuous numerical headcount forecasts into real-world operational decision metrics.
    No artificial fitting: evaluates standard operational thresholds.
    """
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)
    records = []

    # 1. Tolerance accuracy windows
    abs_err = np.abs(y_true - y_pred)
    rel_err = abs_err / np.maximum(y_true, 1)

    for heads in [15, 25, 35, 50]:
        acc = float(np.mean(abs_err <= heads) * 100)
        records.append({
            "category": "Tolerance Window",
            "condition": f"Within ±{heads} heads",
            "metric": "Accuracy (%)",
            "value": round(acc, 2),
            "meaning": f"Forecast within ±{heads} portions of actual dining"
        })

    for pct in [15, 20, 25]:
        acc = float(np.mean(rel_err <= (pct / 100.0)) * 100)
        records.append({
            "category": "Tolerance Window",
            "condition": f"Within ±{pct}% error",
            "metric": "Accuracy (%)",
            "value": round(acc, 2),
            "meaning": f"Forecast within ±{pct}% relative error"
        })

    # 2. Decision Classification: High Demand Surge (>= 70% capacity = 210 students)
    surge_true = (y_true >= 0.70 * capacity).astype(int)
    surge_pred = (y_pred >= 0.70 * capacity).astype(int)

    tp = int(np.sum((surge_true == 1) & (surge_pred == 1)))
    fp = int(np.sum((surge_true == 0) & (surge_pred == 1)))
    fn = int(np.sum((surge_true == 1) & (surge_pred == 0)))
    tn = int(np.sum((surge_true == 0) & (surge_pred == 0)))

    acc_surge = float(np.mean(surge_true == surge_pred) * 100)
    prec_surge = float(tp / (tp + fp) * 100) if (tp + fp) > 0 else 0.0
    rec_surge = float(tp / (tp + fn) * 100) if (tp + fn) > 0 else 0.0
    f1_surge = float(2 * prec_surge * rec_surge / (prec_surge + rec_surge)) if (prec_surge + rec_surge) > 0 else 0.0

    records.extend([
        {"category": "Decision: Surge (>=70%)", "condition": "Attendance >= 210", "metric": "Accuracy (%)", "value": round(acc_surge, 2), "meaning": "Correct classification of surge meals"},
        {"category": "Decision: Surge (>=70%)", "condition": "Attendance >= 210", "metric": "Precision (%)", "value": round(prec_surge, 2), "meaning": "Reliability when predicting a meal surge"},
        {"category": "Decision: Surge (>=70%)", "condition": "Attendance >= 210", "metric": "Recall (%)", "value": round(rec_surge, 2), "meaning": "Proportion of actual surges caught"},
        {"category": "Decision: Surge (>=70%)", "condition": "Attendance >= 210", "metric": "F1-Score (%)", "value": round(f1_surge, 2), "meaning": "Harmonic balance of precision and recall"},
    ])

    # 3. Decision Classification: Low Demand Dip (<= 30% capacity = 90 students)
    dip_true = (y_true <= 0.30 * capacity).astype(int)
    dip_pred = (y_pred <= 0.30 * capacity).astype(int)

    tp_d = int(np.sum((dip_true == 1) & (dip_pred == 1)))
    fp_d = int(np.sum((dip_true == 0) & (dip_pred == 1)))
    fn_d = int(np.sum((dip_true == 1) & (dip_pred == 0)))
    tn_d = int(np.sum((dip_true == 0) & (dip_pred == 0)))

    acc_dip = float(np.mean(dip_true == dip_pred) * 100)
    prec_dip = float(tp_d / (tp_d + fp_d) * 100) if (tp_d + fp_d) > 0 else 0.0
    rec_dip = float(tp_d / (tp_d + fn_d) * 100) if (tp_d + fn_d) > 0 else 0.0
    f1_dip = float(2 * prec_dip * rec_dip / (prec_dip + rec_dip)) if (prec_dip + rec_dip) > 0 else 0.0

    records.extend([
        {"category": "Decision: Dip (<=30%)", "condition": "Attendance <= 90", "metric": "Accuracy (%)", "value": round(acc_dip, 2), "meaning": "Correct classification of vacation dips"},
        {"category": "Decision: Dip (<=30%)", "condition": "Attendance <= 90", "metric": "Precision (%)", "value": round(prec_dip, 2), "meaning": "Reliability when predicting empty halls"},
        {"category": "Decision: Dip (<=30%)", "condition": "Attendance <= 90", "metric": "Recall (%)", "value": round(rec_dip, 2), "meaning": "Proportion of actual vacation drops caught"},
        {"category": "Decision: Dip (<=30%)", "condition": "Attendance <= 90", "metric": "F1-Score (%)", "value": round(f1_dip, 2), "meaning": "Harmonic balance of precision and recall"},
    ])

    return records


# ─────────────────────────────────────────────────────────────
# 2.  Main evaluation
# ─────────────────────────────────────────────────────────────

def run_evaluation():
    from src.models import (
        load_data, add_features, get_feature_cols, chronological_split,
        seasonal_naive_predict, holtwinters_predict, sarima_predict,
        train_all_lgbm, rolling_origin_backtest,
    )
    import sys
    sys.path.insert(0, str(ROOT))

    print("\n" + "="*60)
    print("PHASE 4: FORECASTING EVALUATION")
    print("="*60)

    df_raw = load_data()
    df, lag_cols, roll_cols = add_features(df_raw)

    feat_all   = get_feature_cols(lag_cols, roll_cols, include_calendar=True,  include_weather=True)
    feat_nocal = get_feature_cols(lag_cols, roll_cols, include_calendar=False, include_weather=True)
    feat_nowx  = get_feature_cols(lag_cols, roll_cols, include_calendar=True,  include_weather=False)

    train, val, test = chronological_split(df)

    # Only use rows with enough lag history
    train_clean = train.dropna(subset=feat_all + ["headcount"])
    val_clean   = val.dropna(subset=feat_all + ["headcount"])
    test_clean  = test.dropna(subset=feat_all + ["headcount"])

    X_tr  = train_clean[feat_all].fillna(0)
    y_tr  = train_clean["headcount"]
    X_val = val_clean[feat_all].fillna(0)
    y_val = val_clean["headcount"]
    X_te  = test_clean[feat_all].fillna(0)
    y_te  = test_clean["headcount"]

    all_metrics = []

    # ── Baseline 1: Seasonal Naive ────────────────────────────
    print("\n[eval] Seasonal Naive...")
    sn_pred = seasonal_naive_predict(train, test_clean)
    all_metrics.append(
        metrics_dict("Seasonal-Naive", y_te.values, sn_pred.values)
    )

    # ── Baseline 2: Holt-Winters (one representative series) ──
    print("[eval] Holt-Winters (BH-2, dinner)...")
    sub_tr = train[(train["hostel"]=="BH-2") & (train["slot"]=="dinner")].sort_values("date")
    sub_te = test_clean[(test_clean["hostel"]=="BH-2") & (test_clean["slot"]=="dinner")]
    if len(sub_tr) > 14 and len(sub_te) > 0:
        hw_f = holtwinters_predict(
            sub_tr.set_index("date")["headcount"].asfreq("D").ffill(),
            n_periods=len(sub_te)
        )
        all_metrics.append(
            metrics_dict("Holt-Winters(BH2-dinner)", sub_te["headcount"].values,
                         hw_f.values[:len(sub_te)])
        )

    # ── Baseline 3: SARIMA (one representative series) ────────
    print("[eval] SARIMA (BH-2, dinner) — may take a moment...")
    if len(sub_tr) > 14 and len(sub_te) > 0:
        sar_f = sarima_predict(
            sub_tr.set_index("date")["headcount"].asfreq("D").ffill(),
            n_periods=len(sub_te)
        )
        all_metrics.append(
            metrics_dict("SARIMA(BH2-dinner)", sub_te["headcount"].values,
                         sar_f.values[:len(sub_te)])
        )

    # ── LightGBM: full features ───────────────────────────────
    print("\n[eval] LightGBM (all features)...")
    from src.models import train_all_lgbm, predict_monotone_quantiles
    lgbm_models = train_all_lgbm(X_tr, y_tr, X_val, y_val)

    test_clean = test_clean.copy()
    test_clean["lgbm_point"] = np.clip(lgbm_models["point"].predict(X_te), 0, None).round()
    q10, q50, q90 = predict_monotone_quantiles(lgbm_models, X_te)
    test_clean["lgbm_q10"] = q10
    test_clean["lgbm_q50"] = q50
    test_clean["lgbm_q90"] = q90

    all_metrics.append(
        metrics_dict("LightGBM-all", y_te.values,
                     test_clean["lgbm_point"].values,
                     test_clean["lgbm_q10"].values,
                     test_clean["lgbm_q50"].values,
                     test_clean["lgbm_q90"].values)
    )

    # Per-regime metrics (LightGBM)
    regime_metrics = metrics_by_regime(
        "LightGBM-all", test_clean,
        "lgbm_point", "lgbm_q10", "lgbm_q90", "lgbm_q50"
    )

    # ── Ablations ─────────────────────────────────────────────
    print("[eval] Ablation: no calendar features...")
    X_tr_nc  = train_clean[feat_nocal].fillna(0)
    X_te_nc  = test_clean[feat_nocal].fillna(0)
    from src.models import train_lgbm_point
    m_nocal  = train_lgbm_point(X_tr_nc, y_tr, X_val[feat_nocal].fillna(0), y_val)
    nocal_pred = np.clip(m_nocal.predict(X_te_nc), 0, None).round()
    all_metrics.append(
        metrics_dict("LightGBM-no-calendar", y_te.values, nocal_pred)
    )

    print("[eval] Ablation: no weather features...")
    X_tr_nw  = train_clean[feat_nowx].fillna(0)
    X_te_nw  = test_clean[feat_nowx].fillna(0)
    m_nowx   = train_lgbm_point(X_tr_nw, y_tr, X_val[feat_nowx].fillna(0), y_val)
    nowx_pred = np.clip(m_nowx.predict(X_te_nw), 0, None).round()
    all_metrics.append(
        metrics_dict("LightGBM-no-weather", y_te.values, nowx_pred)
    )

    print("[eval] Ablation: asymmetric loss (shortage cost 3x)...")
    # Asymmetric: we use q75 as point estimate (penalise shortage more)
    from src.models import train_lgbm_quantile
    m_asym  = train_lgbm_quantile(X_tr, y_tr, X_val, y_val, quantile=0.75)
    asym_pred = np.clip(m_asym.predict(X_te), 0, None).round()
    all_metrics.append(
        metrics_dict("LightGBM-asym(q75)", y_te.values, asym_pred)
    )

    # ── Rolling-origin backtest ───────────────────────────────
    print("\n[eval] Rolling-origin backtest...")
    rob_df = rolling_origin_backtest(df, feat_all, n_origins=6, horizon=14)
    rob_df.to_csv(RESULTS / "rolling_origin_backtest.csv", index=False)
    rob_mae  = mae(rob_df["actual"].values, rob_df["predicted"].values)
    rob_rmse = rmse(rob_df["actual"].values, rob_df["predicted"].values)
    print(f"  Rolling-origin MAE={rob_mae:.2f}  RMSE={rob_rmse:.2f}")

    # ── Operational Decision & Tolerance Metrics ──────────────
    clf_metrics = _compute_decision_metrics(y_te.values, test_clean["lgbm_point"].values)
    clf_df = pd.DataFrame(clf_metrics)
    clf_df.to_csv(RESULTS / "classification_metrics.csv", index=False)

    # ── Save metrics ──────────────────────────────────────────
    metrics_df = pd.DataFrame(all_metrics)
    regime_df  = pd.DataFrame(regime_metrics)
    metrics_df.to_csv(RESULTS / "metrics.csv", index=False)
    regime_df.to_csv(RESULTS / "metrics_by_regime.csv", index=False)

    print("\n── Overall Metrics ──────────────────────────────────")
    print(metrics_df[["model","MAE","RMSE","MAPE","WAPE"]].to_string(index=False))
    print("\n── Operational Decision & Tolerance Accuracy ─────────")
    print(clf_df.to_string(index=False))

    # ── Plots ─────────────────────────────────────────────────
    _plot_3week_forecast(test_clean)
    _plot_feature_importance(lgbm_models["point"], feat_all)
    _plot_calibration(test_clean)

    # ── Save test predictions for Phase 5 ─────────────────────
    save_cols = ["date", "hostel", "slot", "headcount", "capacity",
                 "academic_phase", "lgbm_point", "lgbm_q10", "lgbm_q50", "lgbm_q90"]
    test_clean[save_cols].to_csv(RESULTS / "test_predictions.csv", index=False)
    print(f"[eval] test_predictions.csv saved for Phase 5.")

    return metrics_df, regime_df


# ─────────────────────────────────────────────────────────────
# 3.  Plots
# ─────────────────────────────────────────────────────────────

def _plot_3week_forecast(test_clean: pd.DataFrame):
    """Predicted vs actual for a 3-week window, one hostel+slot."""
    sub = test_clean[
        (test_clean["hostel"] == "BH-2") &
        (test_clean["slot"]   == "dinner")
    ].sort_values("date").head(21)

    if len(sub) == 0:
        return

    fig, ax = plt.subplots(figsize=(12, 4))
    ax.plot(sub["date"], sub["headcount"],   "o-", lw=1.5, label="Actual", color="#1e3a5f")
    ax.plot(sub["date"], sub["lgbm_point"],  "s--", lw=1.5, label="LightGBM (point)", color="#e05757")
    ax.fill_between(sub["date"],
                    sub["lgbm_q10"], sub["lgbm_q90"],
                    alpha=0.18, color="#e05757", label="90% PI")
    ax.set_title("SYNTHETIC — Predicted vs Actual: BH-2 Dinner (3-week test window)\n"
                 "Simulated data; not real IIITA attendance", fontsize=10)
    ax.set_ylabel("Headcount")
    ax.legend()
    ax.grid(linestyle="--", alpha=0.4)
    plt.tight_layout()
    p = PLOT_DIR / "plot7_3week_forecast.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    print(f"[eval] Saved {p}")


def _plot_feature_importance(model, feat_cols):
    imp = pd.Series(model.feature_importances_, index=feat_cols)
    imp = imp.nlargest(20).sort_values()
    fig, ax = plt.subplots(figsize=(8, 6))
    imp.plot(kind="barh", ax=ax, color="#2563eb", alpha=0.8)
    ax.set_title("SYNTHETIC — LightGBM Feature Importance (top 20)\n"
                 "Simulated data", fontsize=10)
    ax.set_xlabel("Importance (split count)")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    plt.tight_layout()
    p = PLOT_DIR / "plot8_feature_importance.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    print(f"[eval] Saved {p}")


def _plot_calibration(test_clean: pd.DataFrame):
    """Calibration: fraction of actuals inside q10-q90 interval, by regime."""
    records = []
    for regime, grp in test_clean.groupby("academic_phase"):
        if len(grp) < 5:
            continue
        cov = picp(grp["headcount"].values,
                   grp["lgbm_q10"].values,
                   grp["lgbm_q90"].values)
        records.append({"regime": regime, "PICP_90": cov})
    cdf = pd.DataFrame(records).sort_values("PICP_90")

    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#e05757" if v < 0.85 else "#2563eb" for v in cdf["PICP_90"]]
    ax.barh(cdf["regime"], cdf["PICP_90"], color=colors, alpha=0.8)
    ax.axvline(0.90, color="k", lw=1.5, ls="--", label="Target 90%")
    ax.set_xlabel("PICP (90% PI)")
    ax.set_title("SYNTHETIC — Interval Coverage by Academic Regime\n"
                 "Simulated data", fontsize=10)
    ax.legend()
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    plt.tight_layout()
    p = PLOT_DIR / "plot9_calibration.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    print(f"[eval] Saved {p}")


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(ROOT))
    run_evaluation()
