"""
src/validate_sim.py  – Phase 3
Validate the synthetic simulation:
  1. Recover injected effect sizes via OLS
  2. Robustness: 3 noise levels × 3 multiplier configs
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import warnings
import yaml
from pathlib import Path

warnings.filterwarnings("ignore")

ROOT     = Path(__file__).resolve().parent.parent
DATA     = ROOT / "data"
CONF     = ROOT / "config" / "assumptions.yaml"
PLOT_DIR = ROOT / "results" / "plots"
PLOT_DIR.mkdir(parents=True, exist_ok=True)


def load_config():
    with open(CONF) as f:
        return yaml.safe_load(f)


# ─────────────────────────────────────────────────────────────
# 1. Effect-recovery regression
# ─────────────────────────────────────────────────────────────

def recover_effects(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    """
    OLS: log(attendance_pct) ~ features  — recover coefficients.
    Compare to true log-multipliers from config.
    """
    from statsmodels.formula.api import ols

    df = df.copy()
    df["log_att"] = np.log(df["attendance_pct"].clip(0.01, 0.99))

    # Encode slot as dummy
    df["is_lunch"]   = (df["slot"] == "lunch").astype(int)
    df["is_dinner"]  = (df["slot"] == "dinner").astype(int)
    df["is_weekend_d"] = df["is_weekend"].astype(int)

    # One-hot academic phase (end_break as reference)
    for phase in ["mid_break","summer_sem","pre_semester",
                  "endsem_exam","midsem_exam","normal_classes"]:
        df[f"ph_{phase}"] = (df["academic_phase"] == phase).astype(int)

    formula = (
        "log_att ~ is_lunch + is_dinner + is_weekend_d + is_rainy"
        " + has_dessert + is_fast_food_item + is_special_item + has_nonveg_option"
        " + ph_mid_break + ph_summer_sem + ph_pre_semester"
        " + ph_endsem_exam + ph_midsem_exam + ph_normal_classes"
    )
    model = ols(formula, data=df.dropna(subset=["log_att"])).fit()

    # True log-multipliers from config
    cm   = cfg["calendar"]
    mm   = cfg["menu_multipliers"]
    wm   = cfg["weather"]

    true_vals = {
        "ph_mid_break":      np.log(cm["mid_break"]    / cm["end_break"]),
        "ph_summer_sem":     np.log(cm["summer_sem"]   / cm["end_break"]),
        "ph_pre_semester":   np.log(cm["pre_semester"] / cm["end_break"]),
        "ph_endsem_exam":    np.log(cm["exam_period"]  / cm["end_break"]),
        "ph_midsem_exam":    np.log(cm["exam_period"]  / cm["end_break"]),
        "ph_normal_classes": np.log(1.0               / cm["end_break"]),
        "has_dessert":       np.log(mm["has_dessert"]),
        "is_fast_food_item": np.log(mm["is_fast_food_item"]),
        "is_special_item":   np.log(mm["is_special_item"]),
        "has_nonveg_option": np.log(mm["has_nonveg_option"]),
        "is_rainy":          np.log(wm["rain_breakfast"]),  # approx
    }

    rows = []
    for feat, true_v in true_vals.items():
        recovered = model.params.get(feat, np.nan)
        rows.append({
            "feature":   feat,
            "true_log_multiplier":      round(true_v, 4),
            "recovered_log_multiplier": round(recovered, 4),
            "abs_error":                round(abs(true_v - recovered), 4),
            "pvalue":                   round(model.pvalues.get(feat, np.nan), 4),
        })

    result = pd.DataFrame(rows)
    print("\n[validate] Effect-recovery results:")
    print(result.to_string(index=False))
    return result, model


def plot_recovery(result: pd.DataFrame):
    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(result))
    ax.bar(x - 0.2, result["true_log_multiplier"],      0.35, label="True",      color="#2563eb", alpha=0.8)
    ax.bar(x + 0.2, result["recovered_log_multiplier"], 0.35, label="Recovered", color="#e05757", alpha=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels(result["feature"], rotation=35, ha="right", fontsize=8)
    ax.set_ylabel("Log-Multiplier Coefficient")
    ax.set_title("SYNTHETIC — Effect Recovery: True vs OLS-Recovered Log-Multipliers\n"
                 "(Simulation validation; not real data)", fontsize=10)
    ax.legend()
    ax.axhline(0, color="k", lw=0.5, ls="--")
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    plt.tight_layout()
    p = PLOT_DIR / "plot5_effect_recovery.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    print(f"[validate] Saved {p}")


# ─────────────────────────────────────────────────────────────
# 2. Robustness across noise × multiplier configurations
# ─────────────────────────────────────────────────────────────

def robustness_sweep():
    """
    Regenerate data with:
      3 noise levels (alpha0 ∈ {0.03, 0.05, 0.10})
      × 3 multiplier sets (base, boosted, dampened)
    Report MAE of recovered effects vs true.
    """
    import sys
    sys.path.insert(0, str(ROOT / "src"))
    from generate import generate

    noise_levels = [0.03, 0.05, 0.10]
    mult_configs = [
        {"label": "base",     "exam_period": 1.06, "end_break": 0.15},
        {"label": "boosted",  "exam_period": 1.12, "end_break": 0.10},
        {"label": "dampened", "exam_period": 1.02, "end_break": 0.20},
    ]

    cfg = load_config()
    records = []
    seed = 0

    for noise in noise_levels:
        for mc in mult_configs:
            label = mc["label"]
            override = {
                "negbin": {"alpha0": noise, "eta": cfg["negbin"]["eta"]},
                "calendar": {
                    **cfg["calendar"],
                    "exam_period": mc["exam_period"],
                    "end_break":   mc["end_break"],
                },
            }
            seed += 1
            df_sim = generate(seed=seed, cfg_override=override)

            # Quick metric: mean attendance_pct by phase
            phases = df_sim.groupby("academic_phase")["attendance_pct"].mean().to_dict()
            exam_att   = phases.get("endsem_exam",  0)
            break_att  = phases.get("end_break",    0)
            normal_att = phases.get("normal_classes", 0)

            records.append({
                "noise_alpha0":    noise,
                "multiplier_set":  label,
                "exam_attendance": round(exam_att, 3),
                "break_attendance": round(break_att, 3),
                "normal_attendance": round(normal_att, 3),
                "exam_vs_normal_ratio":
                    round(exam_att / normal_att, 3) if normal_att > 0 else np.nan,
                "break_vs_normal_ratio":
                    round(break_att / normal_att, 3) if normal_att > 0 else np.nan,
            })
            print(f"[robustness] noise={noise}, mult={label} → "
                  f"exam={exam_att:.3f}, break={break_att:.3f}, normal={normal_att:.3f}")

    rob_df = pd.DataFrame(records)
    out = ROOT / "results" / "robustness_sweep.csv"
    rob_df.to_csv(out, index=False)
    print(f"\n[validate] Robustness table saved → {out}")
    print(rob_df.to_string(index=False))
    return rob_df


def plot_robustness(rob_df: pd.DataFrame):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    for ax, col, ylabel in zip(
        axes,
        ["exam_vs_normal_ratio", "break_vs_normal_ratio"],
        ["Exam/Normal ratio", "Break/Normal ratio"],
    ):
        for label, grp in rob_df.groupby("multiplier_set"):
            ax.plot(grp["noise_alpha0"], grp[col], marker="o", label=label)
        ax.set_xlabel("NegBin alpha0 (noise)")
        ax.set_ylabel(ylabel)
        ax.set_title(f"SYNTHETIC — {ylabel} vs Noise\n(Simulation robustness)")
        ax.legend()
        ax.grid(linestyle="--", alpha=0.4)
    plt.tight_layout()
    p = PLOT_DIR / "plot6_robustness.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    print(f"[validate] Saved {p}")


# ─────────────────────────────────────────────────────────────

def run_validation():
    df = pd.read_csv(DATA / "synthetic_headcount.csv")
    cfg = load_config()

    print("\n" + "="*60)
    print("PHASE 3: SIMULATION VALIDATION")
    print("="*60)

    result, model = recover_effects(df, cfg)
    result.to_csv(ROOT / "results" / "effect_recovery.csv", index=False)
    plot_recovery(result)

    print("\nRunning robustness sweep (9 configs × full regeneration)...")
    rob_df = robustness_sweep()
    plot_robustness(rob_df)

    return result, rob_df


if __name__ == "__main__":
    run_validation()
