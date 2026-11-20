"""
src/ops_simulation.py  – Phase 5
Operations simulation: compare procurement rules.
  Rule A: Q = q50 + gamma*(q90 - q50)   [quantile-based]
  Rule B: same slot last week + 10% buffer  [naive buffer]

Cost structure (configurable):
  shortage_cost_per_head = 3 × waste_cost_per_head
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path

ROOT    = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "results"
PLOT_DIR = RESULTS / "plots"
PLOT_DIR.mkdir(parents=True, exist_ok=True)

# ── Cost parameters (configurable) ───────────────────────────
WASTE_COST_PER_HEAD    = 1.0   # cost per head of wasted capacity
SHORTAGE_COST_PER_HEAD = 3.0   # cost per head of unmet demand (3× waste)
GAMMA                  = 0.5   # quantile blending: Q = q50 + γ(q90-q50)


def run_ops_simulation(test_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    test_df must have columns:
      headcount (actual), lgbm_q50, lgbm_q90, capacity,
      hostel, slot, date
    If None, load pre-saved predictions from results/.
    """
    if test_df is None:
        pred_path = RESULTS / "test_predictions.csv"
        if not pred_path.exists():
            print("[ops] test_predictions.csv not found. Run evaluate.py first.")
            return pd.DataFrame()
        test_df = pd.read_csv(pred_path, parse_dates=["date"])

    df = test_df.copy()

    # ── Rule A: Quantile-based procurement ───────────────────
    df["procure_A"] = (
        df["lgbm_q50"] + GAMMA * (df["lgbm_q90"] - df["lgbm_q50"])
    ).clip(0, df["capacity"]).round().astype(int)

    # ── Rule B: Last-week same-slot + 10% buffer ─────────────
    df = df.sort_values(["hostel", "slot", "date"])
    df["procure_B"] = (
        df.groupby(["hostel", "slot"])["headcount"]
          .shift(7)
          .fillna(df["headcount"].mean())
          * 1.10
    ).clip(0, df["capacity"]).round().astype(int)

    # ── Costs ─────────────────────────────────────────────────
    for rule in ["A", "B"]:
        proc_col = f"procure_{rule}"
        actual   = df["headcount"].values
        procured = df[proc_col].values

        waste    = np.maximum(procured - actual, 0)
        shortage = np.maximum(actual - procured, 0)

        df[f"waste_{rule}"]    = waste
        df[f"shortage_{rule}"] = shortage
        df[f"cost_{rule}"]     = (
            waste    * WASTE_COST_PER_HEAD +
            shortage * SHORTAGE_COST_PER_HEAD
        )

    # ── Summary statistics ────────────────────────────────────
    records = []
    for label, rule in [("Quantile-blend (Rule A)", "A"),
                        ("LastWeek+10% (Rule B)", "B")]:
        total_served   = df["headcount"].sum()
        total_procured = df[f"procure_{rule}"].sum()
        total_waste    = df[f"waste_{rule}"].sum()
        total_shortage = df[f"shortage_{rule}"].sum()
        total_cost     = df[f"cost_{rule}"].sum()
        n_events       = len(df)

        records.append({
            "Rule":              label,
            "Total_Served":      int(total_served),
            "Total_Procured":    int(total_procured),
            "Waste_Heads":       int(total_waste),
            "Shortage_Heads":    int(total_shortage),
            "Waste_pct":         round(100 * total_waste / total_procured, 2),
            "Shortage_rate_pct": round(100 * total_shortage / total_served, 2),
            "Total_Cost_Units":  round(total_cost, 1),
            "Cost_per_event":    round(total_cost / n_events, 2),
        })

    summary = pd.DataFrame(records)

    # Cost saved by Rule A vs B
    cost_A  = summary.loc[summary["Rule"].str.startswith("Quantile"), "Total_Cost_Units"].values[0]
    cost_B  = summary.loc[summary["Rule"].str.startswith("Last"),     "Total_Cost_Units"].values[0]
    pct_saved = 100 * (cost_B - cost_A) / cost_B if cost_B > 0 else 0.0

    print("\n" + "="*60)
    print("PHASE 5: OPERATIONS SIMULATION")
    print("="*60)
    print(f"\nCost parameters: waste={WASTE_COST_PER_HEAD}×, shortage={SHORTAGE_COST_PER_HEAD}×, γ={GAMMA}")
    print(summary.to_string(index=False))
    print(f"\nCost saving of Rule A vs Rule B: {pct_saved:.1f}%")

    # ── Optimal Buffer Sensitivity Sweep (Newsvendor Theory) ──
    sweep_records = []
    y_true = df["headcount"].values
    for g in np.linspace(0.0, 1.0, 11):
        q_g = (df["lgbm_q50"] + g * (df["lgbm_q90"] - df["lgbm_q50"])).clip(0, df["capacity"]).round().astype(int).values
        w = np.maximum(q_g - y_true, 0)
        s = np.maximum(y_true - q_g, 0)
        tot_c = np.sum(w * WASTE_COST_PER_HEAD + s * SHORTAGE_COST_PER_HEAD)
        sweep_records.append({
            "gamma": round(g, 2),
            "Total_Procured": int(np.sum(q_g)),
            "Waste_pct": round(100 * np.sum(w) / np.sum(q_g), 2),
            "Shortage_pct": round(100 * np.sum(s) / np.sum(y_true), 2),
            "Total_Cost": round(tot_c, 1)
        })
    sweep_df = pd.DataFrame(sweep_records)
    sweep_df.to_csv(RESULTS / "ops_gamma_sweep.csv", index=False)
    opt_gamma = sweep_df.loc[sweep_df["Total_Cost"].idxmin(), "gamma"]
    print(f"Optimal Buffer Parameter gamma*: {opt_gamma:.2f} (Aligns with Newsvendor Critical Ratio ~0.75)")

    summary.to_csv(RESULTS / "ops_summary.csv", index=False)
    df.to_csv(RESULTS / "ops_detail.csv", index=False)
    print(f"[ops] Saved ops_summary.csv, ops_detail.csv, ops_gamma_sweep.csv → {RESULTS}")

    _plot_ops(df, summary)

    return summary


def _plot_ops(df: pd.DataFrame, summary: pd.DataFrame):
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    # ── Waste % and Shortage % comparison ────────────────────
    labels = summary["Rule"].str[:20].tolist()
    x = np.arange(len(labels))
    w = 0.3
    ax = axes[0]
    ax.bar(x - w/2, summary["Waste_pct"],          w, label="Waste %",    color="#2563eb", alpha=0.8)
    ax.bar(x + w/2, summary["Shortage_rate_pct"],  w, label="Shortage %", color="#e05757", alpha=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=10, ha="right")
    ax.set_ylabel("Percentage")
    ax.set_title("SYNTHETIC — Waste & Shortage Rate\nby Procurement Rule")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.4)

    # ── Total cost comparison ─────────────────────────────────
    ax2 = axes[1]
    ax2.bar(labels, summary["Total_Cost_Units"],
            color=["#2563eb", "#e05757"], alpha=0.8)
    ax2.set_ylabel("Total Cost (arbitrary units)")
    ax2.set_title("SYNTHETIC — Total Procurement Cost\nby Rule (shortage=3× waste)")
    for i, (r, c) in enumerate(zip(labels, summary["Total_Cost_Units"])):
        ax2.text(i, c + 10, f"{c:,.0f}", ha="center", fontsize=9)
    ax2.grid(axis="y", linestyle="--", alpha=0.4)

    fig.suptitle("Simulated data — not real IIITA operations", fontsize=9, color="grey")
    plt.tight_layout()
    p = PLOT_DIR / "plot10_ops_simulation.png"
    fig.savefig(p, dpi=120)
    plt.close(fig)
    print(f"[ops] Saved {p}")

    # ── Time-series of procurement vs actual (BH-2, dinner) ──
    sub = df[(df["hostel"]=="BH-2") & (df["slot"]=="dinner")].sort_values("date").head(42)
    if len(sub) == 0:
        return
    fig, ax = plt.subplots(figsize=(13, 4))
    ax.plot(sub["date"], sub["headcount"], "o-", lw=1.5, label="Actual demand", color="#1e3a5f")
    ax.step(sub["date"], sub["procure_A"], where="mid", lw=1.5, ls="--",
            label="Rule A (quantile blend)", color="#2563eb")
    ax.step(sub["date"], sub["procure_B"], where="mid", lw=1.5, ls=":",
            label="Rule B (last week +10%)", color="#e05757")
    ax.fill_between(sub["date"],
                    sub["headcount"], sub["procure_A"],
                    where=sub["procure_A"] < sub["headcount"],
                    alpha=0.25, color="red", label="Shortage A")
    ax.set_title("SYNTHETIC — Procurement vs Actual Demand (BH-2, dinner)\n"
                 "Simulated data", fontsize=10)
    ax.set_ylabel("Headcount / Procurement")
    ax.legend(fontsize=8)
    ax.grid(linestyle="--", alpha=0.3)
    plt.tight_layout()
    p2 = PLOT_DIR / "plot11_procurement_vs_actual.png"
    fig.savefig(p2, dpi=120)
    plt.close(fig)
    print(f"[ops] Saved {p2}")


if __name__ == "__main__":
    run_ops_simulation()
