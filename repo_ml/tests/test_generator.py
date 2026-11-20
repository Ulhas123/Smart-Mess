"""
tests/test_generator.py
Unit tests for the synthetic data generator.

Run with:  python -m pytest tests/ -v
"""

import sys
import pytest
import numpy as np
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))


# ─────────────────────────────────────────────────────────────
# Helpers – run generator once and cache
# ─────────────────────────────────────────────────────────────

_CACHED_DF = None

def get_df():
    global _CACHED_DF
    if _CACHED_DF is None:
        # Build calendar + menu first if not present
        from src.build_calendar import build_calendar
        from src.build_menu import build_menu
        from src.generate import generate

        cal_path  = ROOT / "data" / "iiita_calendar_2025_2026.csv"
        menu_path = ROOT / "data" / "mess_menu_weekly.csv"
        if not cal_path.exists():
            build_calendar()
        if not menu_path.exists():
            build_menu()

        _CACHED_DF = generate(seed=42)
    return _CACHED_DF


# ─────────────────────────────────────────────────────────────
# Test 1: Basic shape
# ─────────────────────────────────────────────────────────────

def test_shape():
    """Correct number of rows: dates × hostels × slots."""
    df = get_df()
    n_dates  = len(pd.date_range("2025-01-01", "2026-10-10", freq="D"))
    n_hostels = 2
    n_slots   = 3
    expected  = n_dates * n_hostels * n_slots
    assert len(df) == expected, (
        f"Expected {expected} rows, got {len(df)}"
    )


# ─────────────────────────────────────────────────────────────
# Test 2: No negative headcounts
# ─────────────────────────────────────────────────────────────

def test_no_negative_headcounts():
    df = get_df()
    assert (df["headcount"] >= 0).all(), "Negative headcounts found!"


# ─────────────────────────────────────────────────────────────
# Test 3: Capacity clipping
# ─────────────────────────────────────────────────────────────

def test_capacity_clipping():
    df = get_df()
    for hostel in ["BH-2", "BH-3"]:
        sub = df[df["hostel"] == hostel]
        cap = sub["capacity"].iloc[0]
        over = (sub["headcount"] > cap).sum()
        assert over == 0, (
            f"{hostel}: {over} rows exceed capacity {cap}"
        )


# ─────────────────────────────────────────────────────────────
# Test 4: Seed reproducibility
# ─────────────────────────────────────────────────────────────

def test_seed_reproducibility():
    from src.build_calendar import build_calendar
    from src.build_menu import build_menu
    from src.generate import generate

    cal_path  = ROOT / "data" / "iiita_calendar_2025_2026.csv"
    menu_path = ROOT / "data" / "mess_menu_weekly.csv"
    if not cal_path.exists():
        build_calendar()
    if not menu_path.exists():
        build_menu()

    df1 = generate(seed=7)
    df2 = generate(seed=7)
    assert (df1["headcount"].values == df2["headcount"].values).all(), (
        "Same seed produced different results!"
    )


# ─────────────────────────────────────────────────────────────
# Test 5: Different seeds produce different data
# ─────────────────────────────────────────────────────────────

def test_different_seeds_differ():
    from src.generate import generate
    df_a = generate(seed=10)
    df_b = generate(seed=11)
    assert not (df_a["headcount"].values == df_b["headcount"].values).all(), (
        "Different seeds produced identical data!"
    )


# ─────────────────────────────────────────────────────────────
# Test 6: is_synthetic flag is always 1
# ─────────────────────────────────────────────────────────────

def test_is_synthetic_flag():
    df = get_df()
    assert (df["is_synthetic"] == 1).all(), (
        "is_synthetic column is not always 1!"
    )


# ─────────────────────────────────────────────────────────────
# Test 7: Required columns present
# ─────────────────────────────────────────────────────────────

def test_required_columns():
    df = get_df()
    required = [
        "date", "hostel", "slot", "headcount", "capacity",
        "attendance_pct", "weekday", "is_weekend", "is_holiday",
        "is_any_exam", "is_end_break", "is_mid_break",
        "academic_phase", "has_dessert", "temp_max", "precip_mm",
        "is_rainy", "weather_is_simulated", "is_synthetic",
        "festival_kernel",
    ]
    missing = [c for c in required if c not in df.columns]
    assert len(missing) == 0, f"Missing columns: {missing}"


# ─────────────────────────────────────────────────────────────
# Test 8: Break periods have lower attendance than normal
# ─────────────────────────────────────────────────────────────

def test_break_lower_than_normal():
    df = get_df()
    break_avg  = df[df["is_end_break"]  == 1]["attendance_pct"].mean()
    normal_avg = df[(df["academic_phase"] == "normal_classes")]["attendance_pct"].mean()
    assert break_avg < normal_avg, (
        f"End-break avg {break_avg:.3f} not lower than normal {normal_avg:.3f}"
    )


# ─────────────────────────────────────────────────────────────
# Test 9: Exam periods have higher attendance than normal
# ─────────────────────────────────────────────────────────────

def test_exam_higher_than_normal():
    df = get_df()
    exam_avg   = df[df["is_any_exam"] == 1]["attendance_pct"].mean()
    normal_avg = df[df["academic_phase"] == "normal_classes"]["attendance_pct"].mean()
    assert exam_avg > normal_avg, (
        f"Exam avg {exam_avg:.3f} not higher than normal {normal_avg:.3f}"
    )


# ─────────────────────────────────────────────────────────────
# Test 10: Menu CSV has correct shape
# ─────────────────────────────────────────────────────────────

def test_menu_shape():
    from src.build_menu import build_menu
    menu = build_menu()
    assert len(menu) == 21, f"Expected 21 menu rows, got {len(menu)}"
    required_cols = [
        "weekday", "slot", "items", "has_dessert",
        "is_fast_food_item", "has_nonveg_option", "is_special_item",
    ]
    missing = [c for c in required_cols if c not in menu.columns]
    assert len(missing) == 0, f"Menu missing columns: {missing}"


# ─────────────────────────────────────────────────────────────
# Test 11: Monday dinner has nonveg flag for BH-3
# ─────────────────────────────────────────────────────────────

def test_monday_dinner_nonveg():
    df = get_df()
    mon_dinner_bh3 = df[
        (df["weekday"] == "Monday") &
        (df["slot"] == "dinner") &
        (df["hostel"] == "BH-3")
    ]
    assert (mon_dinner_bh3["has_nonveg_option"] == 1).all(), (
        "BH-3 Monday dinner should have has_nonveg_option=1"
    )


# ─────────────────────────────────────────────────────────────
# Test 12: Hostel column only has valid values
# ─────────────────────────────────────────────────────────────

def test_hostel_values():
    df = get_df()
    invalid = set(df["hostel"].unique()) - {"BH-2", "BH-3"}
    assert len(invalid) == 0, f"Unknown hostel values: {invalid}"


# ─────────────────────────────────────────────────────────────
# Test 13: attendance_pct = headcount / capacity
# ─────────────────────────────────────────────────────────────

def test_attendance_pct_consistency():
    df = get_df()
    computed = (df["headcount"] / df["capacity"]).round(4)
    assert np.allclose(df["attendance_pct"].values, computed.values, atol=1e-3), (
        "attendance_pct is inconsistent with headcount / capacity"
    )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
