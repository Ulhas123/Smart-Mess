"""
src/generate.py  – Phase 2
Generate data/synthetic_headcount.csv

Model per row (date × hostel × slot):
  mu = base(hostel,slot) × weekday_factor × calendar_mults × menu_mult
       × weather_mult × festival_kernel_factor
  count ~ NegativeBinomial(mu, alpha)  where alpha is heteroscedastic

THIS DATASET IS SYNTHETIC. All counts are simulated.
"""

import sys
import math
import warnings
import numpy as np
import pandas as pd
import requests
import yaml
from pathlib import Path
from scipy.stats import nbinom

warnings.filterwarnings("ignore")

# ── Paths ────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parent.parent
DATA      = ROOT / "data"
CONF_PATH = ROOT / "config" / "assumptions.yaml"
CAL_CSV   = DATA / "iiita_calendar_2025_2026.csv"
MENU_CSV  = DATA / "mess_menu_weekly.csv"
OUT_CSV   = DATA / "synthetic_headcount.csv"

# ── Date range for "historical" synthetic data ───────────────
HIST_START = "2025-01-01"
HIST_END   = "2026-10-10"

# ── Open-Meteo API for Prayagraj weather ────────────────────
LAT, LON = 25.4358, 81.8463
WEATHER_API = (
    "https://archive-api.open-meteo.com/v1/archive"
    "?latitude={lat}&longitude={lon}"
    "&start_date={start}&end_date={end}"
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
    "&timezone=Asia%2FKolkata"
)


def load_config():
    with open(CONF_PATH) as f:
        return yaml.safe_load(f)


# ─────────────────────────────────────────────────────────────
# 1.  Load and merge calendar + menu
# ─────────────────────────────────────────────────────────────

def load_base_frames():
    cal = pd.read_csv(CAL_CSV, parse_dates=["date"])
    menu = pd.read_csv(MENU_CSV)
    # Map weekday name to slot→flags dict
    slot_map = {slot: {} for slot in ["breakfast", "lunch", "dinner"]}
    for _, row in menu.iterrows():
        wd = row["weekday"]
        sl = row["slot"]
        slot_map.setdefault(wd, {})[sl] = row
    return cal, menu, slot_map


# ─────────────────────────────────────────────────────────────
# 2.  Weather (Open-Meteo + climatology fallback)
# ─────────────────────────────────────────────────────────────

def fetch_weather(start: str, end: str):
    """
    Returns DataFrame with columns: date, temp_max, temp_min, precip,
    weather_is_simulated.
    Falls back to climatology + noise if API fails.
    """
    try:
        url = WEATHER_API.format(lat=LAT, lon=LON, start=start, end=end)
        resp = requests.get(url, timeout=20)
        if resp.status_code == 200:
            jd = resp.json().get("daily", {})
            dates = pd.to_datetime(jd["time"])
            df = pd.DataFrame({
                "date":       dates,
                "temp_max":   jd["temperature_2m_max"],
                "temp_min":   jd["temperature_2m_min"],
                "precip":     jd["precipitation_sum"],
                "weather_is_simulated": 0,
            })
            print(f"[generate] Weather fetched from Open-Meteo for {len(df)} days.")
            return df
    except Exception as e:
        print(f"[generate] Weather API failed ({e}). Using climatology fallback.")

    return _climatology_weather(start, end)


def _climatology_weather(start: str, end: str):
    """
    Day-of-year climatology for Prayagraj (Allahabad, UP) based on IMD normals:
      Winter (Jan-Feb): Min 8-12°C, Max 22-27°C
      Summer (Apr-May): Min 23-28°C, Max 39-44°C
      Monsoon (Jul-Sep): Min 24-26°C, Max 31-34°C, periodic rain
      Post-Monsoon (Oct-Dec): Min 9-19°C, Max 24-32°C
    """
    from scipy.interpolate import interp1d
    rng = pd.date_range(start, end, freq="D")
    
    # Midpoints of each month: Jan 15, Feb 14, Mar 15, Apr 15, May 15, Jun 15, Jul 15, Aug 15, Sep 15, Oct 15, Nov 15, Dec 15
    month_mid = [15, 45, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]
    imd_max   = [23.2, 27.1, 33.7, 39.5, 42.1, 39.2, 33.4, 32.1, 32.5, 32.3, 29.1, 24.5]
    imd_min   = [ 9.1, 12.3, 17.4, 22.8, 27.2, 28.1, 26.0, 25.4, 24.3, 19.5, 13.8,  9.4]
    imd_rain_prob = [0.08, 0.09, 0.06, 0.04, 0.08, 0.28, 0.55, 0.58, 0.40, 0.12, 0.03, 0.05]
    imd_rain_mm   = [ 4.0,  4.5,  5.0,  5.0,  6.0, 14.0, 20.0, 22.0, 16.0,  8.0,  3.0,  3.0]

    # Circular padding for seamless year-round spline interpolation across Jan 1 boundary
    x_pad = [m - 365 for m in month_mid] + month_mid + [m + 365 for m in month_mid]
    max_pad = imd_max + imd_max + imd_max
    min_pad = imd_min + imd_min + imd_min
    rprob_pad = imd_rain_prob + imd_rain_prob + imd_rain_prob
    rmm_pad = imd_rain_mm + imd_rain_mm + imd_rain_mm

    f_max = interp1d(x_pad, max_pad, kind="cubic")
    f_min = interp1d(x_pad, min_pad, kind="cubic")
    f_rprob = interp1d(x_pad, rprob_pad, kind="cubic")
    f_rmm = interp1d(x_pad, rmm_pad, kind="cubic")

    doy = rng.dayofyear.values
    t_max_base = f_max(doy)
    t_min_base = f_min(doy)
    rain_prob = f_rprob(doy)
    rain_mm = f_rmm(doy)

    rng_gen = np.random.default_rng(seed=42)
    noise_tmax = rng_gen.normal(0, 1.2, len(rng))
    noise_tmin = rng_gen.normal(0, 1.0, len(rng))

    # Stochastic precipitation: bernoulli rain day + gamma intensity
    is_rain = (rng_gen.uniform(0, 1, len(rng)) < rain_prob)
    rain_amount = np.where(is_rain, rng_gen.gamma(shape=1.5, scale=rain_mm / 1.5), 0.0)

    # Daytime max drops 2-3°C during rain due to cloud cover and evaporative cooling
    t_max = np.round(t_max_base + noise_tmax - (is_rain * 2.5), 1)
    t_min = np.round(t_min_base + noise_tmin, 1)
    # Physical constraint: night minimum is always at least 4°C below day maximum
    t_min = np.minimum(t_min, t_max - 4.0)

    df = pd.DataFrame({
        "date":     rng,
        "temp_max": t_max,
        "temp_min": t_min,
        "precip":   np.round(rain_amount, 1),
        "weather_is_simulated": 1,
    })
    print(f"[generate] IMD Prayagraj climatology weather used for {len(df)} days (weather_is_simulated=1).")
    return df


def is_rainy(precip: float, threshold_mm: float = 3.0) -> int:
    return int(precip >= threshold_mm)


# ─────────────────────────────────────────────────────────────
# 3.  Festival intensity kernel
# ─────────────────────────────────────────────────────────────

def build_festival_kernel(cfg: dict, date_index: pd.DatetimeIndex) -> np.ndarray:
    """
    E_t = clamp( sum_k a_k * exp(-|t - tau_k| / b_k), 0, 0.90 )
    Returns array of fractional reduction (0 = no reduction).
    """
    events_cfg = cfg["festival_kernel"]["events"]
    kernel = np.zeros(len(date_index))

    for year in [2025, 2026]:
        for name, (doy, amp, hl) in events_cfg.items():
            # Convert day-of-year to actual date for each year
            tau = pd.Timestamp(f"{year}-01-01") + pd.Timedelta(days=int(doy) - 1)
            if tau not in date_index:
                # find closest in index
                pass
            for i, d in enumerate(date_index):
                dist = abs((d - tau).days)
                kernel[i] += amp * math.exp(-dist / hl)

    kernel = np.clip(kernel, 0, 0.90)
    return kernel


# ─────────────────────────────────────────────────────────────
# 4.  Core mu computation
# ─────────────────────────────────────────────────────────────

SLOT_ORDER = ["breakfast", "lunch", "dinner"]
WEEKDAY_IDX = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6,
}


def compute_mu(
    base_rate: float,
    capacity: int,
    weekday: str,
    slot: str,
    cal_row: pd.Series,
    menu_row: pd.Series,
    weather_row: pd.Series,
    festival_factor: float,
    cfg: dict,
    hostel: str,
) -> float:
    """Compute expected headcount mu for one (date, hostel, slot) cell."""

    mu = base_rate * capacity

    # ── Weekday factor ────────────────────────────────────────
    wf_list = cfg["weekday_factors"][slot]
    wf = wf_list[WEEKDAY_IDX[weekday]]
    mu *= wf

    # ── Calendar multipliers ──────────────────────────────────
    cm = cfg["calendar"]
    if cal_row["is_end_break"]:
        mu *= cm["end_break"]
    elif cal_row["is_mid_break"]:
        mu *= cm["mid_break"]
    elif cal_row["is_summer_sem"]:
        mu *= cm["summer_sem"]
    elif cal_row["is_pre_semester"]:
        mu *= cm["pre_semester"]
    else:
        if cal_row["is_holiday"]:
            mu *= cm["holiday"]
        if cal_row["is_any_exam"]:
            mu *= cm["exam_period"]
        if cal_row["is_no_classes"] and not cal_row["is_any_exam"]:
            mu *= cm["no_classes"]
        # Weekend slot bonuses
        if cal_row["is_weekend"]:
            if slot == "lunch":
                mu *= cm["weekend_lunch"]
            elif slot == "dinner":
                mu *= cm["weekend_dinner"]

    # days-to-exam pre-exam effect
    dne = cal_row.get("days_to_next_exam_start", 999)
    if 0 < dne <= 2:
        mu *= cm["pre_exam_2day"]

    # ── Festival kernel (reduction) ───────────────────────────
    mu *= (1.0 - festival_factor)

    # ── Menu multipliers ──────────────────────────────────────
    mm = cfg["menu_multipliers"]
    if menu_row is not None:
        if menu_row["has_dessert"]:
            mu *= mm["has_dessert"]
        if menu_row["is_fast_food_item"]:
            mu *= mm["is_fast_food_item"]
        if menu_row["is_special_item"]:
            mu *= mm["is_special_item"]
        # Non-veg only applies to BH-3 dinner Mon/Fri
        if (hostel == "BH-3" and slot == "dinner"
                and menu_row.get("has_nonveg_option", 0)):
            mu *= mm["has_nonveg_option"]

    # ── Weather multipliers ───────────────────────────────────
    wm = cfg["weather"]
    if weather_row is not None and is_rainy(weather_row.get("precip", 0)):
        if slot == "breakfast":
            mu *= wm["rain_breakfast"]
        elif slot == "lunch":
            mu *= wm["rain_lunch"]
        else:
            mu *= wm["rain_dinner"]
    if weather_row is not None:
        tmax = weather_row.get("temp_max", 25)
        if tmax >= wm["high_heat_threshold_c"]:
            mu *= wm["high_heat_factor"]
        tmin = weather_row.get("temp_min", 15)
        if tmin <= wm["cold_threshold_c"] and slot == "breakfast":
            mu *= wm["cold_factor"]

    return max(mu, 0.0)


# ─────────────────────────────────────────────────────────────
# 5.  NegBin draw
# ─────────────────────────────────────────────────────────────

def negbin_draw(mu: float, alpha: float, rng: np.random.Generator) -> int:
    """Draw from NegBin(mu, alpha). Var = mu + alpha * mu^2."""
    if mu <= 0:
        return 0
    # scipy parameterisation: n=1/alpha, p=1/(1+alpha*mu)
    n = 1.0 / alpha
    p = 1.0 / (1.0 + alpha * mu)
    return int(rng.negative_binomial(n, p))


def heteroscedastic_alpha(cal_row: pd.Series, cfg: dict) -> float:
    """Dispersion is higher on exam/festival days."""
    nb = cfg["negbin"]
    is_high = float(cal_row.get("is_any_exam", 0) or cal_row.get("is_fest", 0))
    sig = 1.0 / (1.0 + math.exp(-is_high))   # sigmoid ≈ 0.5 or 0.73
    return nb["alpha0"] + nb["eta"] * sig


# ─────────────────────────────────────────────────────────────
# 6.  Main generator
# ─────────────────────────────────────────────────────────────

def generate(seed: int = None, cfg_override: dict = None):
    cfg = load_config()
    if cfg_override:
        _deep_update(cfg, cfg_override)
    if seed is None:
        seed = cfg.get("seed", 42)
    rng = np.random.default_rng(seed)

    print(f"[generate] seed={seed}  date range {HIST_START} → {HIST_END}")

    # Load calendars and menu
    cal, menu, _ = load_base_frames()
    cal = cal[
        (cal["date"] >= pd.Timestamp(HIST_START)) &
        (cal["date"] <= pd.Timestamp(HIST_END))
    ].copy().reset_index(drop=True)
    cal["date"] = pd.to_datetime(cal["date"])

    # Weather
    weather_df = fetch_weather(HIST_START, HIST_END)
    weather_df["date"] = pd.to_datetime(weather_df["date"])
    # Merge
    cal = cal.merge(weather_df, on="date", how="left")

    # Build festival kernel
    festival_kernel = build_festival_kernel(cfg, pd.DatetimeIndex(cal["date"]))

    # Menu lookup: weekday → slot → row
    menu_lkp = {}
    for _, mrow in menu.iterrows():
        menu_lkp.setdefault(mrow["weekday"], {})[mrow["slot"]] = mrow

    rows = []
    hostels = ["BH-2", "BH-3"]

    for i, cal_row in cal.iterrows():
        date = cal_row["date"]
        weekday = date.day_name()
        ff = festival_kernel[i]

        w_row = cal_row  # weather already merged into cal_row

        for hostel in hostels:
            cap = cfg["capacity"][hostel]
            base_rates = cfg["base_rates"][hostel]

            for slot in SLOT_ORDER:
                base = base_rates[slot]
                m_row = menu_lkp.get(weekday, {}).get(slot, None)
                alpha = heteroscedastic_alpha(cal_row, cfg)

                mu = compute_mu(
                    base_rate=base,
                    capacity=cap,
                    weekday=weekday,
                    slot=slot,
                    cal_row=cal_row,
                    menu_row=m_row,
                    weather_row=w_row,
                    festival_factor=ff,
                    cfg=cfg,
                    hostel=hostel,
                )

                headcount = min(negbin_draw(mu, alpha, rng), cap)

                row = {
                    "date":              str(date.date()),
                    "hostel":            hostel,
                    "slot":              slot,
                    "headcount":         headcount,
                    "capacity":          cap,
                    "attendance_pct":    round(headcount / cap, 4),
                    "mu_expected":       round(mu, 2),
                    # Calendar features
                    "weekday":           weekday,
                    "is_weekend":        int(cal_row["is_weekend"]),
                    "is_holiday":        int(cal_row["is_holiday"]),
                    "holiday_name":      cal_row.get("holiday_name", ""),
                    "is_blue_event":     int(cal_row.get("is_blue_event", 0)),
                    "is_fest":           int(cal_row.get("is_fest", 0)),
                    "is_campus_event":   int(cal_row.get("is_campus_event", 0)),
                    "is_midsem_exam":    int(cal_row.get("is_midsem_exam", 0)),
                    "is_endsem_exam":    int(cal_row.get("is_endsem_exam", 0)),
                    "is_makeup_exam":    int(cal_row.get("is_makeup_exam", 0)),
                    "is_backpaper_exam": int(cal_row.get("is_backpaper_exam", 0)),
                    "is_c2_assessment":  int(cal_row.get("is_c2_assessment", 0)),
                    "is_project_eval":   int(cal_row.get("is_project_eval", 0)),
                    "is_mid_break":      int(cal_row.get("is_mid_break", 0)),
                    "is_end_break":      int(cal_row.get("is_end_break", 0)),
                    "is_summer_sem":     int(cal_row.get("is_summer_sem", 0)),
                    "is_pre_semester":   int(cal_row.get("is_pre_semester", 0)),
                    "is_classes_start":  int(cal_row.get("is_classes_start", 0)),
                    "is_any_exam":       int(cal_row.get("is_any_exam", 0)),
                    "is_no_classes":     int(cal_row.get("is_no_classes", 0)),
                    "academic_phase":    cal_row.get("academic_phase", ""),
                    "days_to_next_exam_start": int(cal_row.get("days_to_next_exam_start", 999)),
                    "days_since_last_exam_end": int(cal_row.get("days_since_last_exam_end", 999)),
                    "festival_kernel":   round(ff, 4),
                    # Menu features
                    "has_dessert":       int(m_row["has_dessert"]) if m_row is not None else 0,
                    "is_fast_food_item": int(m_row["is_fast_food_item"]) if m_row is not None else 0,
                    "has_nonveg_option": int(m_row.get("has_nonveg_option", 0)) if m_row is not None else 0,
                    "is_special_item":   int(m_row["is_special_item"]) if m_row is not None else 0,
                    # Weather features
                    "temp_max":          round(float(w_row.get("temp_max", np.nan)), 1),
                    "temp_min":          round(float(w_row.get("temp_min", np.nan)), 1),
                    "precip_mm":         round(float(w_row.get("precip", 0.0)), 2),
                    "is_rainy":          is_rainy(float(w_row.get("precip", 0.0))),
                    "weather_is_simulated": int(w_row.get("weather_is_simulated", 1)),
                    # Metadata
                    "is_synthetic":      1,
                    "negbin_alpha":      round(alpha, 4),
                }
                rows.append(row)

    df = pd.DataFrame(rows)
    df.to_csv(OUT_CSV, index=False)
    print(f"[generate] Saved {len(df):,} rows → {OUT_CSV}")
    return df


# ─────────────────────────────────────────────────────────────
# 7.  Plots (Phase 2 visuals)
# ─────────────────────────────────────────────────────────────

def make_plots(df: pd.DataFrame):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates

    PLOT_DIR = ROOT / "results" / "plots"
    PLOT_DIR.mkdir(parents=True, exist_ok=True)

    df["date"] = pd.to_datetime(df["date"])

    # ── Plot 1: One month of data (Jan 2025) ─────────────────
    month = df[(df["date"] >= "2025-01-01") & (df["date"] < "2025-02-01")]
    fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)
    for ax, slot in zip(axes, SLOT_ORDER):
        for hostel, col in [("BH-2", "#5b8dee"), ("BH-3", "#e05757")]:
            sub = month[(month["slot"] == slot) & (month["hostel"] == hostel)]
            ax.bar(sub["date"], sub["headcount"], alpha=0.6, label=hostel,
                   color=col, width=0.4,
                   align="center" if hostel == "BH-2" else "edge")
        ax.set_ylabel(f"{slot.capitalize()}\nHeadcount")
        ax.legend(fontsize=8)
        ax.set_ylim(0, 320)
        ax.grid(axis="y", linestyle="--", alpha=0.4)
    axes[0].set_title("SYNTHETIC — IIITA Mess Attendance: January 2025\n"
                       "(Simulated data; not real IIITA attendance)", fontsize=12)
    axes[-1].xaxis.set_major_formatter(mdates.DateFormatter("%d %b"))
    fig.autofmt_xdate()
    plt.tight_layout()
    p1 = PLOT_DIR / "plot1_jan2025.png"
    fig.savefig(p1, dpi=120)
    plt.close(fig)
    print(f"[generate] Saved {p1}")

    # ── Plot 2: Weekday × Slot average attendance % ──────────
    order_wd = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    dfg = (df.groupby(["weekday","slot","hostel"])["attendance_pct"]
             .mean().reset_index())
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    for ax, hostel in zip(axes, ["BH-2", "BH-3"]):
        sub = dfg[dfg["hostel"] == hostel]
        pivot = sub.pivot(index="weekday", columns="slot",
                          values="attendance_pct").reindex(order_wd)
        pivot.plot(kind="bar", ax=ax, colormap="tab10", rot=30)
        ax.set_title(f"SYNTHETIC — Avg Attendance % by Weekday & Slot\n{hostel}")
        ax.set_ylabel("Attendance fraction")
        ax.set_ylim(0, 1)
        ax.legend(title="Slot")
        ax.grid(axis="y", linestyle="--", alpha=0.4)
    fig.suptitle("Simulated data — not real IIITA attendance", fontsize=9,
                 color="grey")
    plt.tight_layout()
    p2 = PLOT_DIR / "plot2_weekday_slot_avg.png"
    fig.savefig(p2, dpi=120)
    plt.close(fig)
    print(f"[generate] Saved {p2}")

    # ── Plot 3: Exam vs break period attendance ───────────────
    regime_map = {
        "end_break":    "End Break",
        "mid_break":    "Mid Break",
        "summer_sem":   "Summer Sem",
        "pre_semester": "Pre-Semester",
        "endsem_exam":  "Endsem Exam",
        "midsem_exam":  "Midsem Exam",
        "normal_classes":"Normal Classes",
    }
    df["phase_label"] = df["academic_phase"].map(regime_map).fillna("Other")
    dfr = (df.groupby(["phase_label","slot"])["attendance_pct"]
             .mean().reset_index())
    pivot_r = dfr.pivot(index="phase_label", columns="slot",
                        values="attendance_pct")
    fig, ax = plt.subplots(figsize=(10, 5))
    pivot_r.plot(kind="bar", ax=ax, colormap="Set2", rot=30)
    ax.set_title("SYNTHETIC — Mean Attendance % by Academic Phase & Slot\n"
                 "(Simulated; not real IIITA attendance)", fontsize=11)
    ax.set_ylabel("Attendance fraction")
    ax.set_ylim(0, 1)
    ax.legend(title="Slot")
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    plt.tight_layout()
    p3 = PLOT_DIR / "plot3_academic_phase.png"
    fig.savefig(p3, dpi=120)
    plt.close(fig)
    print(f"[generate] Saved {p3}")

    # ── Plot 4: Full time-series of combined attendance ───────
    daily = (df.groupby("date")["headcount"].sum().reset_index()
               .sort_values("date"))
    fig, ax = plt.subplots(figsize=(16, 4))
    ax.plot(daily["date"], daily["headcount"], lw=0.7, color="#2563eb",
            label="Total daily headcount (both hostels, all slots)")
    ax.set_title("SYNTHETIC — Total Daily Mess Headcount 2025-01 to 2026-10\n"
                 "(Simulated data; not real IIITA attendance)", fontsize=11)
    ax.set_ylabel("Headcount")
    ax.legend()
    ax.grid(linestyle="--", alpha=0.3)
    plt.tight_layout()
    p4 = PLOT_DIR / "plot4_full_timeseries.png"
    fig.savefig(p4, dpi=120)
    plt.close(fig)
    print(f"[generate] Saved {p4}")


# ─────────────────────────────────────────────────────────────

def _deep_update(base, override):
    for k, v in override.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            _deep_update(base[k], v)
        else:
            base[k] = v


if __name__ == "__main__":
    df = generate()
    make_plots(df)
