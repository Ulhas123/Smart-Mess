"""
src/build_calendar.py
Build data/iiita_calendar_2025_2026.csv — one row per calendar day.

All academic events are hand-encoded from:
  - Calendar 2025 Planner.pdf (IIIT Allahabad)
  - IIIT Cal 2026.pdf
  - Academic Calendar July to December 2026 for UG-PG-PhD.pdf
  - mock_attendance.csv (used for cross-referencing only)

THIS FILE IS PART OF A SYNTHETIC SIMULATION.
"""

import pandas as pd
import numpy as np
from pathlib import Path

# ── Output path ──────────────────────────────────────────────
OUT = Path(__file__).resolve().parent.parent / "data" / "iiita_calendar_2025_2026.csv"


# ── Helpers ──────────────────────────────────────────────────
def date_range(start, end):
    return pd.date_range(start=start, end=end, freq="D")


def mark(df, dates, col, val=1):
    """Set df[col]=val for the given dates (strings or date-like)."""
    for d in dates:
        d = pd.Timestamp(d)
        if d in df.index:
            df.loc[d, col] = val


def mark_range(df, start, end, col, val=1):
    dr = pd.date_range(start=start, end=end, freq="D")
    for d in dr:
        if d in df.index:
            df.loc[d, col] = val


def mark_holiday(df, dates, names):
    for d, n in zip(dates, names):
        d = pd.Timestamp(d)
        if d in df.index:
            df.loc[d, "is_holiday"] = 1
            df.loc[d, "holiday_name"] = n


def mark_blue(df, dates, names):
    for d, n in zip(dates, names):
        d = pd.Timestamp(d)
        if d in df.index:
            df.loc[d, "is_blue_event"] = 1
            df.loc[d, "blue_event_name"] = n


def mark_fest(df, dates, names):
    for d, n in zip(dates, names):
        d = pd.Timestamp(d)
        if d in df.index:
            df.loc[d, "is_fest"] = 1
            df.loc[d, "fest_name"] = n


# ─────────────────────────────────────────────────────────────
def build_calendar():
    idx = date_range("2025-01-01", "2026-12-31")
    df = pd.DataFrame(index=idx)
    df.index.name = "date"

    df["weekday"] = df.index.day_name()
    df["is_weekend"] = df.index.dayofweek.isin([5, 6]).astype(int)
    df["is_holiday"] = 0
    df["holiday_name"] = ""
    df["is_blue_event"] = 0
    df["blue_event_name"] = ""
    df["is_fest"] = 0
    df["fest_name"] = ""
    df["is_campus_event"] = 0

    # ── Exam flags ───────────────────────────────────────────
    df["is_midsem_exam"] = 0
    df["is_endsem_exam"] = 0
    df["is_makeup_exam"] = 0
    df["is_backpaper_exam"] = 0
    df["is_c2_assessment"] = 0
    df["is_project_eval"] = 0

    # ── Break / class flags ──────────────────────────────────
    df["is_mid_break"] = 0
    df["is_end_break"] = 0
    df["is_summer_sem"] = 0
    df["is_pre_semester"] = 0
    df["is_classes_start"] = 0

    # ═══════════════════════════════════════════════════════
    # 2025 Academic Calendar (Even Semester Jan-May + Odd Jul-Nov)
    # Source: Calendar 2025 Planner.pdf + IIIT Allahabad website
    # ═══════════════════════════════════════════════════════

    # --- 2025 Gazetted / National Holidays ---
    mark_holiday(df,
        ["2025-01-14", "2025-01-26", "2025-03-14", "2025-03-31",
         "2025-04-10", "2025-04-14", "2025-04-18", "2025-05-12",
         "2025-06-07", "2025-08-15", "2025-08-27", "2025-10-02",
         "2025-10-02", "2025-10-20", "2025-10-23", "2025-11-05",
         "2025-12-25"],
        ["Makar Sankranti", "Republic Day", "Holi (Dhulendi)", "Id-ul-Fitr",
         "Ram Navami", "Ambedkar Jayanti", "Good Friday", "Buddha Purnima",
         "Id-ul-Adha (Bakrid)", "Independence Day", "Janmashtami", "Gandhi Jayanti/Dussehra",
         "Dussehra", "Diwali", "Govardhan Puja", "Chhath Puja",
         "Christmas"]
    )

    # Diwali cluster 2025: Oct 18-23
    mark_holiday(df,
        ["2025-10-18", "2025-10-19", "2025-10-21", "2025-10-22"],
        ["Dhanteras", "Choti Diwali", "Bhai Dooj", "Chitragupta Puja"]
    )

    # --- 2025 Even Semester (Jan 6 - May 15 approx) ---
    mark_range(df, "2025-01-02", "2025-01-05", "is_pre_semester")
    mark(df, ["2025-01-06"], "is_classes_start")
    # C2 mid-sem exams: approx Feb 24 - Mar 1
    mark_range(df, "2025-02-24", "2025-03-01", "is_midsem_exam")
    # Mid-sem break: Mar 3-9
    mark_range(df, "2025-03-03", "2025-03-09", "is_mid_break")
    # C2 assessments: Mar 10 onwards
    mark_range(df, "2025-03-10", "2025-03-14", "is_c2_assessment")
    # End-sem exams: Apr 28 - May 14
    mark_range(df, "2025-04-28", "2025-05-14", "is_endsem_exam")
    # End break: May 15 - Jun 30
    mark_range(df, "2025-05-15", "2025-06-30", "is_end_break")

    # Summer semester: Jul 1 - Jul 14 (short)
    mark_range(df, "2025-07-01", "2025-07-14", "is_summer_sem")

    # --- 2025 Odd Semester (Jul 21 - Nov 28 approx) ---
    mark_range(df, "2025-07-15", "2025-07-20", "is_pre_semester")
    mark(df, ["2025-07-21"], "is_classes_start")
    # C1 midsem exams: Sep 15-21
    mark_range(df, "2025-09-15", "2025-09-21", "is_midsem_exam")
    # Mid-sem break: Sep 22-28
    mark_range(df, "2025-09-22", "2025-09-28", "is_mid_break")
    # C2 assessment: Oct 13-17
    mark_range(df, "2025-10-13", "2025-10-17", "is_c2_assessment")
    # End-sem exams: Nov 17-29
    mark_range(df, "2025-11-17", "2025-11-29", "is_endsem_exam")
    # Makeup exams: Dec 1-5
    mark_range(df, "2025-12-01", "2025-12-05", "is_makeup_exam")
    # Back-paper exams: Dec 8-12
    mark_range(df, "2025-12-08", "2025-12-12", "is_backpaper_exam")
    # End break: Dec 1 - Jan 5 2026
    mark_range(df, "2025-12-06", "2025-12-31", "is_end_break")

    # --- 2025 Campus Events ---
    mark_blue(df,
        ["2025-02-14", "2025-03-21", "2025-09-05", "2025-11-11"],
        ["Confluence (Tech Fest)", "Holi Celebration", "Teachers Day", "Abhiyantriki (Technical Day)"]
    )
    mark_fest(df,
        ["2025-02-14", "2025-02-15", "2025-02-16"],
        ["Confluence Day1", "Confluence Day2", "Confluence Day3"]
    )
    # Alumni meet / Convocation
    mark_blue(df, ["2025-10-25"], ["Convocation"])
    mark(df, ["2025-10-25"], "is_campus_event")

    # ═══════════════════════════════════════════════════════
    # 2026 Academic Calendar (Even Semester Jan-May + Jul-Dec)
    # Source: Academic Calendar July-Dec 2026 + IIIT Cal 2026
    # ═══════════════════════════════════════════════════════

    # End break from 2025 continues into Jan 2026
    mark_range(df, "2026-01-01", "2026-01-06", "is_end_break")

    # --- 2026 Gazetted / National Holidays ---
    mark_holiday(df,
        ["2026-01-14", "2026-01-26", "2026-03-20", "2026-03-20",
         "2026-03-29", "2026-04-02", "2026-04-14", "2026-04-14",
         "2026-05-28", "2026-08-15", "2026-08-25", "2026-09-09",
         "2026-10-02", "2026-10-09", "2026-10-27", "2026-10-30",
         "2026-11-10", "2026-11-19", "2026-12-25"],
        ["Makar Sankranti", "Republic Day", "Holi (Dhulendi)", "Holika Dahan",
         "Id-ul-Fitr", "Good Friday", "Ambedkar Jayanti", "Dr. Ambedkar Jayanti",
         "Buddha Purnima", "Independence Day", "Janmashtami", "Onam",
         "Gandhi Jayanti", "Dussehra", "Diwali", "Govardhan Puja",
         "Chhath Puja", "Guru Nanak Jayanti", "Christmas"]
    )

    # Diwali cluster 2026: Oct 27-31
    mark_holiday(df,
        ["2026-10-28", "2026-10-29", "2026-10-31"],
        ["Choti Diwali", "Bhai Dooj", "Chitragupta Puja"]
    )

    # --- 2026 Even Semester (Jan 7 - May 15 approx) ---
    mark_range(df, "2026-01-07", "2026-01-11", "is_pre_semester")
    mark(df, ["2026-01-12"], "is_classes_start")
    # C1 midsem exams: Feb 23 - Mar 1
    mark_range(df, "2026-02-23", "2026-03-01", "is_midsem_exam")
    # Mid-sem break: Mar 2-8
    mark_range(df, "2026-03-02", "2026-03-08", "is_mid_break")
    # C2 assessment: Mar 23-27
    mark_range(df, "2026-03-23", "2026-03-27", "is_c2_assessment")
    # End-sem exams: Apr 27 - May 13
    mark_range(df, "2026-04-27", "2026-05-13", "is_endsem_exam")
    # Project evaluations: May 14-16
    mark_range(df, "2026-05-14", "2026-05-16", "is_project_eval")
    # End break: May 17 - Jul 3
    mark_range(df, "2026-05-17", "2026-07-03", "is_end_break")

    # --- 2026 Odd Semester (Jul 7 - Dec 2026 per Academic Calendar Jul-Dec 2026) ---
    mark_range(df, "2026-07-04", "2026-07-06", "is_pre_semester")
    mark(df, ["2026-07-07"], "is_classes_start")
    # C1 midsem exams: Sep 14-20
    mark_range(df, "2026-09-14", "2026-09-20", "is_midsem_exam")
    # Mid-sem break: Sep 21-27
    mark_range(df, "2026-09-21", "2026-09-27", "is_mid_break")
    # C2 assessment: Oct 19-23
    mark_range(df, "2026-10-19", "2026-10-23", "is_c2_assessment")
    # End-sem exams: Nov 16-30
    mark_range(df, "2026-11-16", "2026-11-30", "is_endsem_exam")
    # Makeup exams: Dec 1-5
    mark_range(df, "2026-12-01", "2026-12-05", "is_makeup_exam")
    # Back-paper: Dec 7-11
    mark_range(df, "2026-12-07", "2026-12-11", "is_backpaper_exam")
    # End break: Dec 12 onward
    mark_range(df, "2026-12-12", "2026-12-31", "is_end_break")

    # --- 2026 Campus Events ---
    mark_blue(df,
        ["2026-02-13", "2026-02-14", "2026-02-15", "2026-09-05", "2026-11-14"],
        ["Confluence Day1", "Confluence Day2", "Confluence Day3", "Teachers Day", "Abhiyantriki"]
    )
    mark_fest(df,
        ["2026-02-13", "2026-02-14", "2026-02-15"],
        ["Confluence Day1", "Confluence Day2", "Confluence Day3"]
    )

    # ── Derived composite flags ───────────────────────────────
    df["is_any_exam"] = (
        df[["is_midsem_exam", "is_endsem_exam", "is_makeup_exam",
            "is_backpaper_exam", "is_c2_assessment"]].max(axis=1)
    )
    df["is_no_classes"] = (
        df[["is_weekend", "is_holiday", "is_mid_break", "is_end_break",
            "is_summer_sem", "is_pre_semester", "is_any_exam"]].max(axis=1)
    )

    # ── Academic phase label ─────────────────────────────────
    def academic_phase(row):
        if row["is_end_break"]:
            return "end_break"
        if row["is_mid_break"]:
            return "mid_break"
        if row["is_summer_sem"]:
            return "summer_sem"
        if row["is_pre_semester"]:
            return "pre_semester"
        if row["is_endsem_exam"] or row["is_makeup_exam"] or row["is_backpaper_exam"]:
            return "endsem_exam"
        if row["is_midsem_exam"] or row["is_c2_assessment"]:
            return "midsem_exam"
        if row["is_project_eval"]:
            return "project_eval"
        if row["is_no_classes"]:
            return "no_classes"
        return "normal_classes"

    df["academic_phase"] = df.apply(academic_phase, axis=1)

    # ── days_to_next_exam_start / days_since_last_exam_end ───
    exam_days = df.index[df["is_any_exam"] == 1]
    days_to_next = []
    days_since_last = []
    for d in df.index:
        future = exam_days[exam_days > d]
        days_to_next.append((future[0] - d).days if len(future) > 0 else 999)
        past = exam_days[exam_days < d]
        days_since_last.append((d - past[-1]).days if len(past) > 0 else 999)
    df["days_to_next_exam_start"] = days_to_next
    df["days_since_last_exam_end"] = days_since_last

    # ── needs_review flag ────────────────────────────────────
    # Days that are uncertain (manually review)
    df["needs_review"] = 0
    review_dates = [
        "2025-03-14",  # Holi near mid-break
        "2025-04-10",  # Ram Navami (not standard gazette)
        "2025-11-05",  # Chhath Puja
        "2026-09-09",  # Onam (not all years)
    ]
    for d in review_dates:
        d = pd.Timestamp(d)
        if d in df.index:
            df.loc[d, "needs_review"] = 1

    df = df.reset_index()
    df["date"] = df["date"].astype(str)
    df.to_csv(OUT, index=False)
    print(f"[build_calendar] Saved {len(df)} rows → {OUT}")
    return df


if __name__ == "__main__":
    build_calendar()
