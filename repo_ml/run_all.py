"""
run_all.py  — Single entry point for the full pipeline.

Usage:
    python run_all.py              # full pipeline
    python run_all.py --phase 2    # run only phase 2 (generate)
    python run_all.py --skip-validate  # skip Phase 3 (faster)

Phases:
    0  build_calendar   →  data/iiita_calendar_2025_2026.csv
    1  build_menu       →  data/mess_menu_weekly.csv
    2  generate         →  data/synthetic_headcount.csv  + plots
    3  validate_sim     →  results/effect_recovery.csv   + plots
    4  evaluate         →  results/metrics.csv           + plots
    5  ops_simulation   →  results/ops_summary.csv       + plots

THIS PIPELINE PRODUCES SYNTHETIC DATA.
Results reflect the simulator, not real IIITA attendance.
"""

import sys
import time
import argparse
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))


def banner(msg):
    print(f"\n{'='*65}")
    print(f"  {msg}")
    print(f"{'='*65}")


def phase0():
    banner("PHASE 0 — Building Academic Calendar")
    from src.build_calendar import build_calendar
    df = build_calendar()
    print(f"  Calendar: {len(df)} days, "
          f"{df['is_holiday'].sum()} holidays, "
          f"{df['is_any_exam'].sum()} exam-days")


def phase1():
    banner("PHASE 1 — Building Weekly Menu Table")
    from src.build_menu import build_menu
    menu = build_menu()
    print(f"  Menu: {len(menu)} rows | "
          f"dessert days: {menu['has_dessert'].sum()} | "
          f"fast-food: {menu['is_fast_food_item'].sum()} | "
          f"nonveg: {menu['has_nonveg_option'].sum()}")


def phase2():
    banner("PHASE 2 — Generating Synthetic Headcount Data")
    from src.generate import generate, make_plots
    t0 = time.time()
    df = generate()
    print(f"\n  Generated {len(df):,} rows in {time.time()-t0:.1f}s")
    print(f"  Mean attendance_pct  : {df['attendance_pct'].mean():.3f}")
    print(f"  Breakfast avg        : {df[df['slot']=='breakfast']['attendance_pct'].mean():.3f}")
    print(f"  Lunch avg            : {df[df['slot']=='lunch']['attendance_pct'].mean():.3f}")
    print(f"  Dinner avg           : {df[df['slot']=='dinner']['attendance_pct'].mean():.3f}")
    print(f"  End-break avg        : {df[df['is_end_break']==1]['attendance_pct'].mean():.3f}")
    print(f"  Exam-period avg      : {df[df['is_any_exam']==1]['attendance_pct'].mean():.3f}")
    print("\n  Generating plots...")
    make_plots(df)
    return df


def phase3(skip=False):
    if skip:
        print("\n[run_all] Skipping Phase 3 (--skip-validate)")
        return
    banner("PHASE 3 — Simulation Validation")
    from src.validate_sim import run_validation
    run_validation()


def phase4():
    banner("PHASE 4 — Forecasting & Evaluation")
    from src.evaluate import run_evaluation
    metrics_df, regime_df = run_evaluation()
    print("\n  -- Metrics Summary (test set) --")
    print(metrics_df[["model","MAE","RMSE","MAPE","WAPE"]].to_string(index=False))
    return metrics_df


def _save_test_predictions():
    """Re-run predictions and save for ops simulation."""
    import pandas as pd
    import numpy as np
    from src.models import (
        load_data, add_features, get_feature_cols,
        chronological_split, train_all_lgbm, predict_monotone_quantiles,
    )

    df_raw = load_data()
    df, lag_cols, roll_cols = add_features(df_raw)
    feat_all = get_feature_cols(lag_cols, roll_cols)
    train, val, test = chronological_split(df)

    train_c = train.dropna(subset=feat_all + ["headcount"])
    val_c   = val.dropna(subset=feat_all + ["headcount"])
    test_c  = test.dropna(subset=feat_all + ["headcount"])

    lgbm_models = train_all_lgbm(
        train_c[feat_all].fillna(0), train_c["headcount"],
        val_c[feat_all].fillna(0),   val_c["headcount"],
    )

    test_c = test_c.copy()
    X_te   = test_c[feat_all].fillna(0)
    test_c["lgbm_point"] = np.clip(lgbm_models["point"].predict(X_te), 0, None).round()
    q10, q50, q90 = predict_monotone_quantiles(lgbm_models, X_te)
    test_c["lgbm_q10"] = q10
    test_c["lgbm_q50"] = q50
    test_c["lgbm_q90"] = q90

    out = ROOT / "results" / "test_predictions.csv"
    test_c.to_csv(out, index=False)
    print(f"\n  [run_all] Test predictions saved → {out}")


def phase5():
    banner("PHASE 5 — Operations Simulation")
    from src.ops_simulation import run_ops_simulation
    summary = run_ops_simulation()
    return summary


def run_tests():
    banner("UNIT TESTS")
    import subprocess
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short"],
        cwd=str(ROOT),
        capture_output=False,
    )
    return result.returncode == 0


# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="IIITA Mess Demand Forecasting Pipeline")
    parser.add_argument("--phase", type=int, default=None,
                        help="Run only a specific phase (0-5)")
    parser.add_argument("--skip-validate", action="store_true",
                        help="Skip Phase 3 (robustness sweep is slow)")
    parser.add_argument("--tests-only", action="store_true",
                        help="Run unit tests only")
    args = parser.parse_args()

    print("\n" + "*"*65)
    print("  IIITA Mess Demand Forecasting - Synthetic Simulation Pipeline")
    print("  Project: ECE Minor, IIIT Allahabad")
    print("  !! THIS DATASET IS SYNTHETIC -- all numbers are simulated.")
    print("  Metrics reflect the simulator, not real IIITA attendance.")
    print("*"*65)

    if args.tests_only:
        ok = run_tests()
        sys.exit(0 if ok else 1)

    if args.phase is not None:
        {0: phase0, 1: phase1, 2: phase2, 3: phase3, 4: phase4, 5: phase5
         }[args.phase]()
    else:
        t_start = time.time()
        phase0()
        phase1()
        phase2()
        phase3(skip=args.skip_validate)
        phase4()
        phase5()
        run_tests()

        banner(f"ALL PHASES COMPLETE in {time.time()-t_start:.1f}s")
        print("\n  Outputs:")
        for f in sorted((ROOT / "data").iterdir()):
            print(f"    data/{f.name}  ({f.stat().st_size:,} bytes)")
        for f in sorted((ROOT / "results").iterdir()):
            if f.is_file():
                print(f"    results/{f.name}  ({f.stat().st_size:,} bytes)")
        plot_dir = ROOT / "results" / "plots"
        for f in sorted(plot_dir.iterdir()):
            print(f"    results/plots/{f.name}")

        print("\n  !! All outputs are SYNTHETIC (is_synthetic=1).")
        print("  Metrics reflect the simulator, not real IIITA attendance.\n")


if __name__ == "__main__":
    main()
