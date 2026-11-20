# IIITA Mess Demand Forecasting — Synthetic Simulation

> **Project:** Predictive Mathematical Modeling & Smart App for Mess Management  
> **Course:** ECE Minor Project, IIIT Allahabad  
> **Operator:** KMK Global Limited | **Hostels:** BH-2 (Veg) · BH-3 (Non-Veg)

---

> ⚠️ **IMPORTANT: This dataset is synthetic; metrics reflect the simulator, not real IIITA attendance.**  
> All headcount values are computer-generated using the stochastic model described below.  
> No real student attendance data was available or used.

---

## Quick Start

```bash
pip install -r requirements.txt
python run_all.py                    # full pipeline (~10-20 min with Phase 3)
python run_all.py --skip-validate    # skip robustness sweep (~3-5 min)
python run_all.py --phase 2          # run only Phase 2 (generate data)
python run_all.py --tests-only       # run unit tests only
python -m pytest tests/ -v           # run tests directly
```

---

## Project Structure

```
.
├── config/
│   └── assumptions.yaml         # All tunable multipliers + rationale
├── data/
│   ├── iiita_calendar_2025_2026.csv   # Phase 0: academic calendar
│   ├── mess_menu_weekly.csv           # Phase 1: weekly menu with flags
│   └── synthetic_headcount.csv       # Phase 2: main output (is_synthetic=1)
├── results/
│   ├── metrics.csv                    # Phase 4: model performance
│   ├── metrics_by_regime.csv          # Phase 4: per-academic-regime metrics
│   ├── effect_recovery.csv            # Phase 3: OLS vs true log-multipliers
│   ├── robustness_sweep.csv           # Phase 3: 9-config sweep
│   ├── rolling_origin_backtest.csv    # Phase 4: expanding-window backtest
│   ├── ops_summary.csv                # Phase 5: procurement rule comparison
│   ├── ops_detail.csv                 # Phase 5: row-level ops data
│   └── plots/                         # All PNG plots
├── src/
│   ├── build_calendar.py              # Phase 0
│   ├── build_menu.py                  # Phase 1
│   ├── generate.py                    # Phase 2: synthetic generator
│   ├── validate_sim.py                # Phase 3: simulation validation
│   ├── models.py                      # Phase 4a: feature eng + models
│   ├── evaluate.py                    # Phase 4b: metrics + plots
│   └── ops_simulation.py              # Phase 5: procurement simulation
├── tests/
│   └── test_generator.py              # 13 unit tests
├── run_all.py                         # Single pipeline entry point
├── requirements.txt
└── README.md
```

---

## Data Card

| Field | Value |
|---|---|
| **Dataset name** | IIITA Mess Synthetic Headcount |
| **Version** | 1.0 |
| **Date range** | 2025-01-01 to 2026-10-10 |
| **Granularity** | date × hostel × slot |
| **Total rows** | ~11,718 (642 days × 2 hostels × 3 slots) |
| **Hostels** | BH-2 (veg, capacity 300), BH-3 (non-veg, capacity 300) |
| **Slots** | breakfast, lunch, dinner |
| **is_synthetic** | **Always 1** |
| **Real data used** | None — only aggregate averages used as calibration targets |
| **Source calendars** | IIIT Allahabad 2025 Planner, Jul-Dec 2026 Academic Calendar |

### What Is Simulated

- **Every headcount value** is a random draw from a Negative Binomial distribution.
- Base rates (breakfast 0.42, lunch 0.67, dinner 0.76) are **placeholder values** because the real average was not provided.
- All calendar events (exam dates, break periods) are hand-coded from official PDF calendars and may contain approximations.
- Weather is fetched from Open-Meteo historical archive for Prayagraj; if unavailable, day-of-year climatology is used (`weather_is_simulated=1`).
- Festival kernel is a parameterised exponential decay — not based on observed data.

### Limitations

1. No real attendance data → all statistics are circular (model recovers what it was told).
2. Capacity split BH-2/BH-3 = 300/300 is assumed; actual split may differ.
3. Menu effects (+3–8%) are assumptions; no preference survey conducted.
4. Festival home-going kernel parameters are illustrative.
5. Summer semester attendance is highly uncertain.
6. SARIMA and Holt-Winters are run on a single representative series only.
7. Results should **not** be cited as evidence of real-world model performance.

---

## All Assumptions (from config/assumptions.yaml)

### Capacity
| Hostel | Assumed Capacity | Rationale |
|---|---|---|
| BH-2 (Veg) | 300 | Placeholder 50/50 split of ~600 total |
| BH-3 (Non-Veg) | 300 | Placeholder 50/50 split of ~600 total |

### Base Attendance Rates (placeholder — fill in real values)
| Slot | Rate | Source |
|---|---|---|
| Breakfast | 0.42 | Placeholder (no real data) |
| Lunch | 0.67 | Placeholder |
| Dinner | 0.76 | Placeholder |

### Calendar Multipliers
| Event | Multiplier | Rationale |
|---|---|---|
| End-semester break | 0.15 | Campus nearly empty; most students go home |
| Mid-semester break | 0.35 | Many students travel; short break |
| Summer semester | 0.30 | Smaller batch; some stay for internships |
| Pre-semester | 0.25 | Students arriving; not all mess-registered |
| Holiday (gazetted) | 0.82 | Moderate exodus on national holidays |
| Exam period | 1.06 | Students stay on campus; all meals taken |
| Weekend lunch bonus | 1.05 | Leisurely weekend lunches slightly higher |
| Weekend dinner bonus | 1.02 | Small evening boost on weekends |
| No-classes day | 0.90 | Mild drop when no academic pressure |
| Pre-exam (2 days before) | 1.02 | Students settle back on campus |

### Festival Kernel (home-going effect)
| Festival | Day-of-Year | Amplitude | Half-life (days) |
|---|---|---|---|
| Holi | 74 (~15 Mar) | 0.60 | 4.0 |
| Diwali | 307 (~3 Nov) | 0.70 | 5.0 |
| Dussehra | 294 (~21 Oct) | 0.55 | 4.0 |
| Chhath Puja | 311 (~7 Nov) | 0.50 | 3.0 |
| Id-ul-Fitr | 90 (~31 Mar) | 0.45 | 3.5 |
| Id-ul-Adha | 180 (~late Jun) | 0.40 | 3.0 |
| Christmas | 359 | 0.35 | 3.0 |
| New Year | 1 | 0.30 | 2.0 |

### Menu Multipliers
| Feature | Multiplier | Rationale |
|---|---|---|
| has_dessert | +6% | Dessert days attract more diners |
| is_fast_food_item | +5% | Crowd-favourite items (chole bhature, dosa) |
| is_special_item | +4% | Biryani, kaju katli, ice-cream days |
| has_nonveg_option (BH-3) | +7% | Non-veg dinner is popular (Mon & Fri) |

### Weather Multipliers
| Condition | Slot | Multiplier | Rationale |
|---|---|---|---|
| Rain | Breakfast | 0.82 | Students avoid morning walk in rain |
| Rain | Lunch | 0.96 | Small effect at midday |
| Rain | Dinner | 0.97 | Smallest effect in evening |
| Very hot (≥40°C) | All | 0.97 | Slight appetite reduction |
| Very cold (≤10°C) | Breakfast | 0.98 | Cold mornings reduce early risers |

### Noise Model
```
headcount ~ NegativeBinomial(mu, alpha)
alpha = 0.05 + 0.12 × sigmoid(is_exam_or_fest)
Variance = mu + alpha × mu²
```

---

## Output Columns (synthetic_headcount.csv)

| Column | Description |
|---|---|
| date | YYYY-MM-DD |
| hostel | BH-2 or BH-3 |
| slot | breakfast / lunch / dinner |
| headcount | **Simulated** integer headcount |
| capacity | Hostel capacity (300) |
| attendance_pct | headcount / capacity |
| mu_expected | Model's expected value before NegBin draw |
| is_synthetic | **Always 1** |
| weather_is_simulated | 1 if climatology fallback used |
| [calendar columns] | From iiita_calendar_2025_2026.csv |
| [menu columns] | has_dessert, is_fast_food_item, etc. |
| [weather columns] | temp_max, temp_min, precip_mm, is_rainy |
| festival_kernel | Exponential decay intensity [0, 0.9] |
| negbin_alpha | Dispersion parameter used for this row |

---

## Model Results & Evaluation

Evaluated chronologically on unseen test period (2026-07-01 to 2026-10-10, 612 meal-events):

| Model | MAE | RMSE | MAPE (%) | WAPE (%) | Notes |
|---|---|---|---|---|---|
| **Seasonal-Naive** | 68.20 | 85.77 | 65.57% | 42.61% | Same weekday + slot last week |
| **Holt-Winters** (BH2-dinner) | 69.56 | 83.47 | 58.16% | 33.58% | Additive trend + seasonality |
| **SARIMA** (BH2-dinner) | 72.88 | 86.01 | 58.93% | 35.18% | (1,1,1)×(1,0,1,7) |
| **LightGBM (All features)** | **41.54** | **53.23** | **32.14%** | **25.95%** | **Best overall** (conservative depth, non-crossing quantiles) |
| LightGBM (No calendar) | 47.28 | 60.89 | 38.09% | 29.54% | Ablation: calendar features save ~5.74 MAE |
| LightGBM (No weather) | 41.67 | 53.33 | 32.08% | 26.03% | Ablation: modest weather impact |
| LightGBM (Asymmetric q75) | 48.54 | 61.49 | 44.32% | 30.33% | Direct asymmetric loss optimization |

- **Rolling-Origin Expanding Window Backtest:** MAE = 42.35, RMSE = 57.31 (across 6 cutoffs × 14-day horizons).
- **Quantile Calibration:** PICP (90% Interval Coverage) = 72.4%, Pinball q10 = 8.34, Pinball q50 = 20.74, Pinball q90 = 10.05.

### Operational Decision & Tolerance Accuracy (Test Period)

| Category | Decision Condition | Metric | Value | Kitchen Operational Meaning |
|---|---|---|---|---|
| **Surge Detection** | Attendance $\ge 70\%$ ($\ge 210$ heads) | **Accuracy** | **76.31%** | Correct classification of peak rush meals |
| | | **Precision** | **60.76%** | Reliability when predicting a meal surge |
| | | **Recall** | **53.63%** | Proportion of actual surges caught |
| | | **F1-Score** | **56.97%** | Harmonic balance of precision and recall |
| **Vacation Dip** | Attendance $\le 30\%$ ($\le 90$ heads) | **Accuracy** | **88.07%** | Correct classification of holiday/break dips |
| | | **Precision** | **84.07%** | Reliability when predicting empty halls |
| | | **Recall** | **63.33%** | Proportion of actual vacation drops caught |
| | | **F1-Score** | **72.24%** | Harmonic balance of precision and recall |
| **Tolerance Margin** | Within $\pm 25$ portions | **Accuracy** | **38.56%** | Predictions within typical kitchen cooking tolerance |
| | Within $\pm 35$ portions | **Accuracy** | **50.33%** | Majority of meals within ~1 serving tray |
| | Within $\pm 50$ portions | **Accuracy** | **66.99%** | Two-thirds of meals captured |

---

## Operations Simulation (Phase 5)

Comparing buffer procurement strategies under asymmetric loss (shortage penalty = 3× waste cost):

| Rule | Description | Total Procured | Waste Heads (Waste %) | Shortage Heads (Shortage %) | Total Cost Units | Cost / Event |
|---|---|---|---|---|---|---|
| **Rule A (Quantile Blend)** | $Q = q_{50} + 0.5 \times (q_{90} - q_{50})$ | 114,129 | 22,915 (20.08%) | 6,741 (6.88%) | **43,138.0** | **70.49** |
| **Rule B (Naive Buffer)** | Last week same slot + 10% | 105,436 | 28,110 (26.66%) | 20,629 (21.06%) | 89,997.0 | 147.05 |

> **Bottom Line:** The quantile-blended procurement strategy achieves **52.1% total cost reduction** compared to the naive +10% rule, dramatically cutting meal shortages from 21.06% down to 6.88%.  
> **Newsvendor Critical Fractile Connection:** Sweeping $\gamma$ reveals the optimal parameter $\gamma^* \approx 0.70$ (Total Cost = 42,644), which matches classical Newsvendor economic theory $\tau^* = \frac{C_{\text{shortage}}}{C_{\text{shortage}} + C_{\text{waste}}} = \frac{3}{3+1} = 0.75$.

---

## Citation / Academic Use

If referencing this work:
> "Synthetic mess-attendance dataset for IIIT Allahabad (BH-2 & BH-3), generated using a Negative Binomial stochastic model calibrated to placeholder attendance rates. All data is simulated; results do not reflect real student attendance patterns."

---

*Generated by run_all.py — IIITA Mess Demand Forecasting Project*
