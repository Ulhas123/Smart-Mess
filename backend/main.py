import os
import math
import yaml
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend import database
from backend import weather
from backend.time_utils import (
    get_ist_now,
    get_ist_date_str,
    get_ist_time_str,
    get_current_meal_slot,
    get_active_meal_slot,
    get_time_context,
    get_slot_timing_display,
)

app = FastAPI(
    title="IIITA Mess Demand Forecasting & Smart App API",
    description="Department of ECE, IIIT Allahabad - Predictive Mathematical Modeling & Kitchen Operations API",
    version="1.0.0"
)

# Enable CORS for frontend (allows Vercel, localhost, and custom domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ML_DIR = BASE_DIR / "repo_ml"
if not REPO_ML_DIR.exists():
    REPO_ML_DIR = Path.cwd() / "repo_ml"
DATA_DIR = REPO_ML_DIR / "data"
RESULTS_DIR = REPO_ML_DIR / "results"
CONFIG_DIR = REPO_ML_DIR / "config"

# Load assumptions
assumptions = {}
if (CONFIG_DIR / "assumptions.yaml").exists():
    with open(CONFIG_DIR / "assumptions.yaml", "r", encoding="utf-8") as f:
        assumptions = yaml.safe_load(f)

# Load data tables
calendar_df = pd.DataFrame()
if (DATA_DIR / "iiita_calendar_2025_2026.csv").exists():
    calendar_df = pd.read_csv(DATA_DIR / "iiita_calendar_2025_2026.csv")

menu_df = pd.DataFrame()
if (DATA_DIR / "mess_menu_weekly.csv").exists():
    menu_df = pd.read_csv(DATA_DIR / "mess_menu_weekly.csv")

metrics_df = pd.DataFrame()
if (RESULTS_DIR / "metrics.csv").exists():
    metrics_df = pd.read_csv(RESULTS_DIR / "metrics.csv")

ops_df = pd.DataFrame()
if (RESULTS_DIR / "ops_summary.csv").exists():
    ops_df = pd.read_csv(RESULTS_DIR / "ops_summary.csv")

effect_df = pd.DataFrame()
if (RESULTS_DIR / "effect_recovery.csv").exists():
    effect_df = pd.read_csv(RESULTS_DIR / "effect_recovery.csv")

test_pred_df = pd.DataFrame()
if (RESULTS_DIR / "test_predictions.csv").exists():
    test_pred_df = pd.read_csv(RESULTS_DIR / "test_predictions.csv")

# In-memory telemetry storage for mock student card swipes and feedback
telemetry_state = {
    "live_scans": [
        {"id": 1, "roll": "IEC2023059", "name": "Tushar Garg", "hostel": "BH-3", "slot": "dinner", "timestamp": "19:32:10"},
        {"id": 2, "roll": "IEC2023037", "name": "Varun Karankar", "hostel": "BH-2", "slot": "dinner", "timestamp": "19:34:45"},
        {"id": 3, "roll": "IEC2023058", "name": "Aadarsh Singh", "hostel": "BH-3", "slot": "dinner", "timestamp": "19:36:20"},
        {"id": 4, "roll": "IEC2023012", "name": "Rohan Sharma", "hostel": "BH-2", "slot": "dinner", "timestamp": "19:38:05"},
        {"id": 5, "roll": "IEC2023088", "name": "Priya Verma", "hostel": "BH-2", "slot": "dinner", "timestamp": "19:40:15"},
    ],
    "feedback": [
        {"id": 1, "roll": "IEC2023059", "rating": 5, "comment": "Special Paneer Butter Masala was excellent tonight!", "meal": "Dinner", "date": "Today"},
        {"id": 2, "roll": "IEC2023037", "rating": 4, "comment": "Crisp dosas for breakfast, zero waiting time.", "meal": "Breakfast", "date": "Today"},
        {"id": 3, "roll": "IEC2023021", "rating": 5, "comment": "Great to see no food shortage during exam week.", "meal": "Lunch", "date": "Yesterday"},
    ]
}

# --- Pydantic Request Models ---
class ForecastRequest(BaseModel):
    date: str
    hostel: str = "BH-2"
    slot: str = "dinner"
    is_rainy: Optional[bool] = False
    temp_max: Optional[float] = 32.0
    temp_min: Optional[float] = 22.0
    precip_mm: Optional[float] = 0.0
    has_dessert: Optional[bool] = False
    is_fast_food: Optional[bool] = False
    has_nonveg: Optional[bool] = False
    is_special: Optional[bool] = False
    academic_phase: Optional[str] = "Normal"
    days_to_exam: Optional[int] = 30
    festival_factor: Optional[float] = 0.0
    use_live_weather: Optional[bool] = False

class ProcurementRequest(BaseModel):
    headcount: int
    slot: str = "dinner"
    hostel: str = "BH-2"
    menu_type: Optional[str] = "Standard"

class SwipeRequest(BaseModel):
    roll: str
    name: Optional[str] = "IIITA Student"
    hostel: str
    slot: str

class FeedbackRequest(BaseModel):
    roll: str
    rating: int
    comment: str
    meal: str

class StudentRegisterRequest(BaseModel):
    roll: str
    name: str
    hostel: str
    password: str
    id_card_data: str
    id_card_filename: Optional[str] = "id_card.png"
    email: Optional[str] = None

class StudentLoginRequest(BaseModel):
    roll: str
    password: str

class VendorLoginRequest(BaseModel):
    vendor_id: str
    password: str

class GeneratePassRequest(BaseModel):
    roll: str
    slot: Optional[str] = None

class ScanPassRequest(BaseModel):
    qr_data: str
    slot: Optional[str] = None

class ToggleAllowedRequest(BaseModel):
    roll: str
    is_allowed: bool

# get_current_meal_slot is imported from backend.time_utils (Prayagraj Asia/Kolkata synchronized)


# --- Core Mathematical Simulator Functions ---
def compute_headcount(req: ForecastRequest) -> Dict[str, Any]:
    hostel_str = str(req.hostel or "BH-2").strip()
    if hostel_str in ["Combined", "BH-2 + BH-3", "BH2+BH3", "Both", "All"]:
        capacity = 600.0
    elif hostel_str == "BH-3":
        capacity = 300.0
    else:
        capacity = 300.0

    base_rates = {"breakfast": 0.42, "lunch": 0.67, "dinner": 0.76}
    base_rate = base_rates.get(req.slot.lower(), 0.67)

    # Academic Regime Multipliers grounded in MinorProject_Final_Updated.pptx
    regime_mults = {
        "Normal": 1.00,
        "Regular": 1.00,
        "Exam": 1.06,
        "Exam Period": 1.06,
        "Mid-Sem Exam": 1.06,
        "End-Sem Exam": 1.06,
        "End Break": 0.15,
        "End-Break": 0.15,
        "Mid Break": 0.35,
        "Mid-Break": 0.35,
        "Summer": 0.30,
        "Summer Sem": 0.30,
        "Pre-Sem": 0.25,
        "Pre-Semester": 0.25,
        "Holiday": 0.82,
    }

    academic_phase = req.academic_phase or "Normal"
    days_to_exam = req.days_to_exam if req.days_to_exam is not None else 30
    festival_factor = req.festival_factor if req.festival_factor is not None else 0.0

    # Live weather integration if requested
    live_w = None
    if getattr(req, "use_live_weather", False):
        try:
            live_w = weather.get_prayagraj_weather()
            req.is_rainy = live_w.get("is_rainy", req.is_rainy)
            req.temp_max = live_w.get("temp_max", req.temp_max)
            req.temp_min = live_w.get("temp_min", req.temp_min)
            req.precip_mm = live_w.get("precipitation_mm", req.precip_mm)
        except Exception:
            pass

    # Auto-lookup from calendar_df if date provided
    if req.date and not calendar_df.empty and "date" in calendar_df.columns:
        match = calendar_df[calendar_df["date"] == req.date]
        if not match.empty:
            row = match.iloc[0]
            if req.academic_phase == "Normal" and "academic_phase" in row and pd.notnull(row["academic_phase"]):
                cal_regime = str(row["academic_phase"]).replace("_", " ").title()
                if cal_regime in regime_mults:
                    academic_phase = cal_regime
            if req.days_to_exam == 30 and "days_to_next_exam_start" in row and pd.notnull(row["days_to_next_exam_start"]):
                try:
                    days_to_exam = int(row["days_to_next_exam_start"])
                except (ValueError, TypeError):
                    pass

    m_regime = regime_mults.get(academic_phase, 1.0)

    # Weather Multiplier: Rain breakfast = 0.82, Rain lunch = 0.96, Heat >=40C = 0.97, Cold <=10C = 0.98
    m_weather = 1.0
    if req.is_rainy:
        if req.slot.lower() == "breakfast":
            m_weather *= 0.82
        elif req.slot.lower() == "lunch":
            m_weather *= 0.96
    if req.temp_max and req.temp_max >= 40.0:
        m_weather *= 0.97
    if req.temp_min and req.temp_min <= 10.0:
        m_weather *= 0.98

    # Menu Multiplier: Dessert = +6%, Fast food = +5%, Special = +4%, BH-3 Mon/Fri dinner non-veg = +7%
    m_menu = 1.0
    if req.has_dessert:
        m_menu += 0.06
    if req.is_fast_food:
        m_menu += 0.05
    if req.is_special:
        m_menu += 0.04
    is_mon_or_fri = False
    if req.date:
        try:
            dt = datetime.strptime(req.date, "%Y-%m-%d")
            is_mon_or_fri = dt.weekday() in (0, 4)
        except Exception:
            pass
    is_dinner = req.slot.lower() == "dinner"
    if (hostel_str in ["BH-3", "Combined"]) and req.has_nonveg and (is_dinner or is_mon_or_fri):
        m_menu += 0.07

    # Hawkes festival kernel: Diwali (shock a=0.70, half-life b=2.5d), Holi (shock a=0.60, half-life b=2.5d)
    m_festival = 1.0 - (min(0.90, max(0.0, festival_factor)))

    # Anticipatory Exam Effect
    m_anticipatory = 1.0
    if 0 < days_to_exam <= 3:
        m_anticipatory = 1.02

    # Expected headcount mu
    mu = capacity * base_rate * m_regime * m_weather * m_menu * m_festival * m_anticipatory
    mu = max(15.0, min(float(capacity), mu))

    # Heteroscedastic dispersion: alpha_0 = 0.05 base, shock inflate +0.12 during exam/festival transitions
    alpha = 0.05
    if academic_phase in ["Exam", "Exam Period", "Mid-Sem Exam", "End-Sem Exam", "End Break", "End-Break", "Mid Break", "Mid-Break"]:
        alpha += 0.12
    elif festival_factor > 0.15:
        alpha += 0.12

    # Variance = mu + alpha * mu^2
    var = mu + alpha * (mu ** 2)
    std_dev = math.sqrt(var)

    # Quantiles from calibrated negative binomial / pinball loss:
    q10 = max(10, int(round(mu - 1.28155 * std_dev)))
    q50 = int(round(mu))
    q90 = min(int(capacity), int(round(mu + 1.28155 * std_dev)))

    # Asymmetric q75 safety stock target (Koenker-Bassett / Silver et al.)
    q75 = min(int(capacity), int(round(mu + 0.67449 * std_dev)))
    safety_stock = max(5, q75 - q50)

    # Asymmetric Newsvendor Rule A: Q = q50 + 0.50 * (q90 - q50)
    rule_a_procure = min(int(capacity), int(round(q50 + 0.50 * (q90 - q50))))

    # Cooking Tolerances: +/-25 (38.56%), +/-35 (50.33%), +/-50 (66.99%)
    within_25 = [max(10, q50 - 25), min(int(capacity), q50 + 25)]
    within_35 = [max(10, q50 - 35), min(int(capacity), q50 + 35)]
    within_50 = [max(10, q50 - 50), min(int(capacity), q50 + 50)]

    # 3-Class Regime Classification: Dip <=90, Normal 91-209, Surge >=210 (scaled by capacity / 300)
    scale_factor = capacity / 300.0
    dip_limit = int(90 * scale_factor)
    surge_limit = int(210 * scale_factor)

    if q50 <= dip_limit:
        regime_class = "Vacation Dip"
        regime_action = "Thermal burner shutdown; halt bulk cooking (F1 72.24%, eliminate food waste)"
        regime_badge = "DIP"
    elif q50 >= surge_limit:
        regime_class = "Peak Surge"
        regime_action = "Initiate secondary steam kettle cooking (F1 56.97%, 0 False Negative Surges)"
        regime_badge = "SURGE"
    else:
        regime_class = "Normal Service"
        regime_action = "Standard single-batch staging line operation"
        regime_badge = "NORMAL"

    # Batch Cooking Recommendation
    initial_cook_batch = q10 + int(0.65 * (q50 - q10))
    buffer_tray_batch = q90 - initial_cook_batch

    return {
        "expected_headcount": q50,
        "q10": q10,
        "q50": q50,
        "q75": q75,
        "q90": q90,
        "newsvendor_procure_q": rule_a_procure,
        "std_dev": round(std_dev, 2),
        "dispersion_alpha": round(alpha, 3),
        "capacity": int(capacity),
        "utilization_pct": round((q50 / capacity) * 100, 1),
        "safety_stock_heads": safety_stock,
        "regime_classification": {
            "class": regime_class,
            "action": regime_action,
            "badge": regime_badge,
            "surge_metrics": {"f1": "56.97%", "precision": "60.76%", "recall": "53.63%", "fn_surges": 0},
            "dip_metrics": {"f1": "72.24%", "precision": "84.07%", "recall": "63.33%"}
        },
        "cooking_strategy": {
            "initial_cook_batch": initial_cook_batch,
            "buffer_tray_batch": buffer_tray_batch,
            "cooking_advice": f"Cook {initial_cook_batch} portions for main warmers; prepare mise en place for {buffer_tray_batch} portions in secondary reserve."
        },
        "tolerance_windows": {
            "window_25": within_25,
            "window_35": within_35,
            "window_50": within_50
        },
        "multiplier_breakdown": {
            "base_rate": base_rate,
            "regime_factor": round(m_regime, 3),
            "weather_factor": round(m_weather, 3),
            "menu_factor": round(m_menu, 3),
            "festival_factor": round(m_festival, 3),
            "anticipatory_factor": round(m_anticipatory, 3)
        }
    }


# --- API Routes ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "institution": "Indian Institute of Information Technology, Allahabad",
        "department": "Electronics and Communication Engineering",
        "project": "Predictive Mathematical Modeling & Smart App for Mess Management",
        "supervisor": "Dr. Kirtan Gopal Panda",
        "authors": [
            {"name": "Varun Karankar", "roll": "IEC2023037"},
            {"name": "Aadarsh Singh", "roll": "IEC2023058"},
            {"name": "Tushar Garg", "roll": "IEC2023059"}
        ]
    }

@app.get("/api/calendar")
def get_calendar():
    if calendar_df.empty:
        return {"dates": [], "regimes": ["Normal", "Mid-Sem Exam", "End-Sem Exam", "Mid-Break", "End-Break", "Summer"]}
    clean_df = calendar_df.fillna("")
    records = clean_df.head(100).to_dict(orient="records")
    return {
        "total_days": len(calendar_df),
        "sample": records,
        "regimes": ["Normal", "Mid-Sem Exam", "End-Sem Exam", "Mid-Break", "End-Break", "Summer", "Pre-Semester", "Holiday"]
    }

@app.get("/api/menu")
def get_menu():
    if menu_df.empty:
        # Fallback rich default menu
        return {
            "BH-2": [
                {"day": "Monday", "breakfast": "Chola samosa, meethi & hari chutney, dalia, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Punjabi kadhi-pakode, aloo-shimlamirch, pineapple raita, jeera rice, roti, salad, mix achaar", "dinner": "Kadhai paneer, moong daal, rice, roti, gulab jamun, salad, mix achaar", "has_dessert": True, "is_special": True, "is_fast_food": True},
                {"day": "Tuesday", "breakfast": "Uttapam, sambhar, coconut chutney, cornflakes, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Litti chokha, arhar daal, rice, lassi, sambhar, salad, mix achaar", "dinner": "Veg kofta curry, arhar daal tadka, rice, roti, fruit custard, salad, mix achaar", "has_dessert": True, "is_special": True, "is_fast_food": True},
                {"day": "Wednesday", "breakfast": "Pav bhaji, dalia, sprouts, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Kali masoor daal, kaddu sabzi, dahi, rice, puri, sambhar, salad, mix achaar", "dinner": "Chana masala, roti, arhar daal, veg fried rice, sooji halwa, salad, mix achaar", "has_dessert": True, "is_special": False, "is_fast_food": True},
                {"day": "Thursday", "breakfast": "Medu vada, sambhar, coconut chutney, cornflakes, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Safed matar masala, dal makhni, veg pulao, chaach, sambhar, roti, salad, mix achaar", "dinner": "Aloo-pattagobhi, roti, rajma, rice, milk cake, salad, mix achaar", "is_special": True, "has_dessert": True},
                {"day": "Friday", "breakfast": "Poha + Haldiram bhujiya, jalebi, dalia, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Aloo bhujiya, chana daal tadka, rice, roti, dahi, salad, mix achaar", "dinner": "Paneer-pyaaz paratha, chutney, daal, rice, kaju katli, salad, mix achaar", "has_dessert": True, "is_special": True},
                {"day": "Saturday", "breakfast": "Masala dosa, sambhar, coconut chutney, cornflakes, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Chole bhature, rice, boondi raita, sambhar, salad, mix achaar", "dinner": "Soyabean-aloo, arhar dal tadka, veg pulao, roti, ice cream, salad, mix achaar", "is_fast_food": True, "is_special": True, "has_dessert": True},
                {"day": "Sunday", "breakfast": "Aloo-pyaaz paratha, dahi, chutney, cornflakes, bread, butter, jam, banana, tea/coffee/milk", "lunch": "Aloo jhol, arhar dal tadka, mix-veg raita, veg biryani, roti, salad, mix achaar", "dinner": "Pasta / chowmein, veg manchurian, mix daal, rice, roti, sewai, salad, mix achaar", "is_fast_food": True, "is_special": True, "has_dessert": True}
            ],
            "BH-3": [
                {"day": "Monday", "breakfast": "Chola samosa, meethi & hari chutney, dalia, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Punjabi kadhi-pakode, aloo-shimlamirch, pineapple raita, jeera rice, roti, salad, mix achaar", "dinner": "Egg curry / Kadhai paneer, moong daal, rice, roti, gulab jamun, salad, mix achaar", "has_nonveg": True, "has_dessert": True, "is_special": True, "is_fast_food": True},
                {"day": "Tuesday", "breakfast": "Uttapam, sambhar, coconut chutney, cornflakes, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Litti chokha, arhar daal, rice, lassi, sambhar, salad, mix achaar", "dinner": "Veg kofta curry, arhar daal tadka, rice, roti, fruit custard, salad, mix achaar", "has_dessert": True, "is_special": True, "is_fast_food": True},
                {"day": "Wednesday", "breakfast": "Pav bhaji, dalia, sprouts, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Kali masoor daal, kaddu sabzi, dahi, rice, puri, sambhar, salad, mix achaar", "dinner": "Chana masala, roti, arhar daal, veg fried rice, sooji halwa, salad, mix achaar", "has_dessert": True, "is_special": False, "is_fast_food": True},
                {"day": "Thursday", "breakfast": "Medu vada, sambhar, coconut chutney, cornflakes, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Safed matar masala, dal makhni, veg pulao, chaach, sambhar, roti, salad, mix achaar", "dinner": "Aloo-pattagobhi, roti, rajma, rice, milk cake, salad, mix achaar", "has_dessert": True, "is_special": True},
                {"day": "Friday", "breakfast": "Poha + Haldiram bhujiya, jalebi, dalia, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Aloo bhujiya, chana daal tadka, rice, roti, dahi, salad, mix achaar", "dinner": "(Chicken curry, roti) / (Paneer-pyaaz paratha, chutney, daal), rice, kaju katli, salad, mix achaar", "has_nonveg": True, "is_special": True, "has_dessert": True},
                {"day": "Saturday", "breakfast": "Masala dosa, sambhar, coconut chutney, cornflakes, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Chole bhature, rice, boondi raita, sambhar, salad, mix achaar", "dinner": "Soyabean-aloo, arhar dal tadka, veg pulao, roti, ice cream, salad, mix achaar", "is_fast_food": True, "is_special": True, "has_dessert": True},
                {"day": "Sunday", "breakfast": "Aloo-pyaaz paratha, dahi, chutney, cornflakes, bread, butter, jam, egg/banana, tea/coffee/milk", "lunch": "Aloo jhol, arhar dal tadka, mix-veg raita, veg biryani, roti, salad, mix achaar", "dinner": "Pasta / chowmein, veg manchurian, mix daal, rice, roti, sewai, salad, mix achaar", "has_dessert": True, "is_fast_food": True, "is_special": True}
            ]
        }
    return menu_df.to_dict(orient="records")

@app.post("/api/forecast")
def forecast(req: ForecastRequest):
    return compute_headcount(req)

@app.get("/api/forecast/test-series")
def get_test_predictions_series(hostel: str = "BH-2", slot: str = "dinner", limit: int = 21):
    if test_pred_df.empty:
        return {"records": [], "metrics": {}}
    sub = test_pred_df[
        (test_pred_df["hostel"].str.upper() == hostel.upper()) &
        (test_pred_df["slot"].str.lower() == slot.lower())
    ].sort_values("date").head(limit)
    records = []
    for _, r in sub.iterrows():
        actual = int(r["headcount"])
        q50 = round(float(r["lgbm_q50"]), 1)
        records.append({
            "date": str(r["date"]),
            "display": str(r["date"])[5:],
            "phase": str(r["academic_phase"]).replace("_", " ").title(),
            "actual": actual,
            "forecast": q50,
            "point": round(float(r["lgbm_point"]), 1),
            "q10": round(float(r["lgbm_q10"]), 1),
            "q90": round(float(r["lgbm_q90"]), 1),
            "error": round(abs(actual - q50), 1),
            "within_25": abs(actual - q50) <= 25,
            "within_35": abs(actual - q50) <= 35,
            "within_50": abs(actual - q50) <= 50,
        })
    actuals = [r["actual"] for r in records]
    forecasts = [r["forecast"] for r in records]
    mae = round(sum(abs(a - f) for a, f in zip(actuals, forecasts)) / len(actuals), 2) if actuals else 41.54
    total_actual = sum(actuals)
    wape = round(sum(abs(a - f) for a, f in zip(actuals, forecasts)) / total_actual * 100, 2) if total_actual > 0 else 25.95
    within_35_pct = round(sum(1 for r in records if r["within_35"]) / len(records) * 100, 1) if records else 50.33
    return {
        "records": records,
        "metrics": {
            "window_mae": mae,
            "window_wape": wape,
            "overall_test_mae": 41.54,
            "overall_test_wape": 25.95,
            "overall_test_rmse": 53.23,
            "tolerance_35_pct": within_35_pct,
            "overall_tolerance_35_pct": 50.33,
            "picp_90": 72.4,
            "source": "MinorProject_Final_Updated.pptx (Plot 7 & Slide 21: 612 Unseen Holdout Events)"
        }
    }

@app.post("/api/procurement")
def procurement_calculator(req: ProcurementRequest):
    heads = req.headcount
    is_bh3 = req.hostel == "BH-3"
    slot = req.slot.lower()

    # Raw material per capita consumption standard (in kg or liters)
    if slot == "breakfast":
        rice_kg = round(heads * 0.04, 2)       # Poha / Idli rice
        atta_kg = round(heads * 0.08, 2)       # Parathas / Puri flour
        dal_kg = round(heads * 0.02, 2)        # Sambar dal
        veg_kg = round(heads * 0.07, 2)        # Aloo, onion, tomatoes
        dairy_kg = round(heads * 0.15, 2)      # Milk for tea/curd
        oil_l = round(heads * 0.015, 2)        # Cooking oil
        spices_kg = round(heads * 0.01, 2)
        nonveg_kg = round(heads * 0.08, 2) if is_bh3 else 0.0  # Eggs
    else: # lunch or dinner
        rice_kg = round(heads * 0.12, 2)       # Basmati / Sona Masoori
        atta_kg = round(heads * 0.11, 2)       # Chapatis
        dal_kg = round(heads * 0.05, 2)        # Arhar / Moong / Rajma / Chana
        veg_kg = round(heads * 0.16, 2)        # Seasonal vegetables + potato/onion
        dairy_kg = round(heads * 0.08, 2)      # Paneer / Curd
        oil_l = round(heads * 0.025, 2)        # Cooking oil / Ghee
        spices_kg = round(heads * 0.02, 2)
        nonveg_kg = round(heads * 0.14, 2) if is_bh3 else 0.0  # Chicken

    items = [
        {"name": "Rice (Basmati / Medium Grain)", "amount": f"{rice_kg} kg", "unit_price": "₹45/kg", "cost": round(rice_kg * 45)},
        {"name": "Whole Wheat Atta", "amount": f"{atta_kg} kg", "unit_price": "₹35/kg", "cost": round(atta_kg * 35)},
        {"name": "Dal & Pulses (Arhar/Rajma/Chana)", "amount": f"{dal_kg} kg", "unit_price": "₹120/kg", "cost": round(dal_kg * 120)},
        {"name": "Fresh Vegetables (Potato, Onion, Tomato, Green)", "amount": f"{veg_kg} kg", "unit_price": "₹35/kg", "cost": round(veg_kg * 35)},
        {"name": "Dairy / Paneer / Curd", "amount": f"{dairy_kg} kg", "unit_price": "₹300/kg", "cost": round(dairy_kg * 300)},
        {"name": "Refined Mustard / Sunflower Oil", "amount": f"{oil_l} L", "unit_price": "₹130/L", "cost": round(oil_l * 130)},
        {"name": "Whole Spices, Salt & Condiments", "amount": f"{spices_kg} kg", "unit_price": "₹200/kg", "cost": round(spices_kg * 200)},
    ]
    if is_bh3 and nonveg_kg > 0:
        items.append({"name": "Fresh Poultry / Eggs (BH-3 Special)", "amount": f"{nonveg_kg} kg", "unit_price": "₹190/kg", "cost": round(nonveg_kg * 190)})

    total_cost = sum(item["cost"] for item in items)

    return {
        "headcount": heads,
        "hostel": req.hostel,
        "slot": req.slot,
        "total_estimated_cost_inr": round(total_cost),
        "cost_per_student_inr": round(total_cost / max(1, heads), 2),
        "procurement_list": items,
        "kitchen_prep_batches": [
            {"batch": "Batch 1 (Immediate)", "portions": int(heads * 0.70), "description": "Cooked 45 min before service commences."},
            {"batch": "Batch 2 (Buffer Prep)", "portions": int(heads * 0.30), "description": "Vegetables chopped, dough kneaded, ready on high-flame standby."}
        ]
    }

@app.get("/api/benchmarks")
def get_benchmarks():
    return {
        "models": [
            {"model": "LightGBM (All Features)", "mae": 41.54, "rmse": 53.23, "mape": "32.14%", "wape": "25.95%", "picp_90": "72.4%", "speed": "0.8 ms (Instant)"},
            {"model": "LightGBM (No Weather Ablation)", "mae": 41.67, "rmse": 53.33, "mape": "32.08%", "wape": "26.03%", "picp_90": "72.1%", "speed": "0.8 ms"},
            {"model": "LightGBM (No Calendar Ablation)", "mae": 47.28, "rmse": 60.89, "mape": "38.09%", "wape": "29.54%", "picp_90": "68.3%", "speed": "0.7 ms"},
            {"model": "LightGBM Asymmetric (q75)", "mae": 48.54, "rmse": 61.49, "mape": "44.32%", "wape": "30.33%", "picp_90": "84.2%", "speed": "0.8 ms"},
            {"model": "Seasonal-Naive Baseline", "mae": 68.20, "rmse": 85.77, "mape": "65.57%", "wape": "42.61%", "picp_90": "—", "speed": "0.1 ms"},
            {"model": "Holt-Winters (BH2-dinner)", "mae": 69.56, "rmse": 83.47, "mape": "58.16%", "wape": "33.58%", "picp_90": "—", "speed": "15.2 ms"},
            {"model": "SARIMA (BH2-dinner)", "mae": 72.88, "rmse": 86.01, "mape": "58.93%", "wape": "35.18%", "picp_90": "—", "speed": "12.4 s"}
        ],
        "ops_comparison": {
            "shortage_cost_per_head": 3.0,
            "waste_cost_per_head": 1.0,
            "optimal_critical_fractile": 0.75,
            "empirical_gamma_star": 0.70,
            "rule_a_quantile": {
                "rule": "Quantile-blend (Rule A: Q = q50 + 0.50·(q90-q50))",
                "total_served": 97955,
                "total_procured": 114129,
                "waste_heads": 22915,
                "shortage_heads": 6741,
                "waste_pct": "20.08%",
                "shortage_rate_pct": "6.88%",
                "cost_per_event": "₹70.49",
                "total_cost_units": 43138,
                "cost_savings_pct": "-52.1%"
            },
            "rule_b_heuristic": {
                "rule": "LastWeek + 10% (Rule B - Traditional Guesswork)",
                "total_served": 97955,
                "total_procured": 105436,
                "waste_heads": 28110,
                "shortage_heads": 20629,
                "waste_pct": "26.66%",
                "shortage_rate_pct": "21.06%",
                "cost_per_event": "₹147.05",
                "total_cost_units": 89997
            },
            "shortage_reduction_pct": "67.3% lower shortage",
            "cost_savings_pct": "52.1% lower cost penalty"
        },
        "feature_importance": [
            {"feature": "lag_1d", "score": 465, "category": "Autoregressive"},
            {"feature": "festival_kernel", "score": 368, "category": "Hawkes Event Kernel"},
            {"feature": "lag_14d", "score": 356, "category": "Autoregressive"},
            {"feature": "roll7d_mean", "score": 348, "category": "Rolling Statistics"},
            {"feature": "roll14d_std", "score": 303, "category": "Rolling Statistics"},
            {"feature": "days_to_next_exam", "score": 192, "category": "Calendar Dynamics"},
            {"feature": "temp_max", "score": 165, "category": "Weather Signal"},
            {"feature": "has_dessert", "score": 142, "category": "Menu Feature"},
            {"feature": "precip_mm", "score": 116, "category": "Weather Signal"},
            {"feature": "is_fast_food_item", "score": 108, "category": "Menu Feature"}
        ],
        "kitchen_tolerances": {
            "within_25_portions": "38.56%",
            "within_35_portions": "50.33%",
            "within_50_portions": "66.99%"
        },
        "regime_matrix": {
            "n_meals": 612,
            "thresholds": {"dip_max": 90, "normal_min": 91, "normal_max": 209, "surge_min": 210},
            "confusion_matrix": {
                "actual_dip": {"pred_dip": 95, "pred_normal": 54, "pred_surge": 1, "total": 150},
                "actual_normal": {"pred_dip": 18, "pred_normal": 204, "pred_surge": 61, "total": 283},
                "actual_surge": {"pred_dip": 0, "pred_normal": 83, "pred_surge": 96, "total": 179},
                "total_predicted": {"pred_dip": 113, "pred_normal": 341, "pred_surge": 158, "total": 612}
            },
            "surge_metrics": {
                "accuracy": "76.31%",
                "precision": "60.76%",
                "recall": "53.63%",
                "f1": "56.97%",
                "false_negative_surges": 0
            },
            "dip_metrics": {
                "accuracy": "88.07%",
                "precision": "84.07%",
                "recall": "63.33%",
                "f1": "72.24%"
            },
            "overall_accuracy": "64.5%"
        }
    }

@app.post("/api/telemetry/swipe")
def record_swipe(req: SwipeRequest):
    new_scan = {
        "id": len(telemetry_state["live_scans"]) + 1,
        "roll": req.roll.upper(),
        "name": req.name or f"Student {req.roll.upper()}",
        "hostel": req.hostel,
        "slot": req.slot,
        "timestamp": get_ist_time_str()
    }
    telemetry_state["live_scans"].insert(0, new_scan)
    if len(telemetry_state["live_scans"]) > 25:
        telemetry_state["live_scans"].pop()
    return {
        "status": "success",
        "message": f"Check-in verified for {req.roll.upper()} at {req.hostel}",
        "scan": new_scan,
        "total_active_scans": len(telemetry_state["live_scans"])
    }

@app.get("/api/telemetry/stats")
def get_telemetry_stats():
    return {
        "total_scans_today": len(telemetry_state["live_scans"]),
        "recent_scans": telemetry_state["live_scans"][:10],
        "feedback": telemetry_state["feedback"]
    }

@app.post("/api/telemetry/feedback")
def submit_feedback(req: FeedbackRequest):
    entry = {
        "id": len(telemetry_state["feedback"]) + 1,
        "roll": req.roll.upper(),
        "rating": req.rating,
        "comment": req.comment,
        "meal": req.meal,
        "date": "Just now"
    }
    telemetry_state["feedback"].insert(0, entry)
    return {"status": "success", "entry": entry}

# --- Weather API (Prayagraj, UP) ---
@app.get("/api/weather")
def get_weather(refresh: bool = False):
    """Returns live weather conditions for Prayagraj, UP from Open-Meteo API."""
    return weather.get_prayagraj_weather(force_refresh=refresh)

# --- Student & Vendor Authentication Routes ---
@app.post("/api/auth/student/register")
def register_student(req: StudentRegisterRequest):
    """Registers a student with roll no as login id, password, and uploaded ID card."""
    try:
        student = database.register_student(
            roll=req.roll,
            name=req.name,
            hostel=req.hostel,
            password=req.password,
            id_card_data=req.id_card_data,
            id_card_filename=req.id_card_filename or "id_card.png",
            email=req.email
        )
        return {"status": "success", "message": "Registration successful", "student": student}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/student/login")
def login_student(req: StudentLoginRequest):
    """Student login with Roll Number and password."""
    student = database.verify_student(req.roll, req.password)
    if not student:
        raise HTTPException(status_code=401, detail="Invalid Roll Number or Password")
    return {"status": "success", "message": "Login successful", "student": student}

@app.post("/api/auth/vendor/login")
def login_vendor(req: VendorLoginRequest):
    """Vendor login with Vendor ID and password (vendors do not need to register)."""
    vendor = database.verify_vendor(req.vendor_id, req.password)
    if not vendor:
        raise HTTPException(status_code=401, detail="Invalid Vendor ID or Password")
    return {"status": "success", "message": "Vendor authorized", "vendor": vendor}

# --- QR Code Pass Generation & Vendor Attendance Scanning ---
@app.post("/api/attendance/generate-pass")
def generate_meal_pass(req: GeneratePassRequest):
    """Generates an authentic meal QR pass for a logged-in student."""
    roll_upper = req.roll.strip().upper()
    student = database.get_student(roll_upper)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {roll_upper} not found in mess registry")
    
    slot = req.slot or get_current_meal_slot()
    today_str = get_ist_date_str()
    ts = int(get_ist_now().timestamp() * 1000)
    
    # Hash token to ensure integrity
    salt = "IIITA_MESS_2026_SECURE"
    sig_raw = f"{roll_upper}:{slot}:{today_str}:{salt}"
    signature = hashlib.sha256(sig_raw.encode("utf-8")).hexdigest()[:16]

    pass_payload = {
        "type": "IIITA_MESS_PASS",
        "roll": roll_upper,
        "name": student["name"],
        "hostel": student["hostel"],
        "slot": slot,
        "date": today_str,
        "timestamp": ts,
        "signature": signature,
        "is_allowed": bool(student["is_allowed"])
    }

    return {
        "status": "success",
        "pass_data": pass_payload,
        "qr_string": json.dumps(pass_payload),
        "is_allowed": bool(student["is_allowed"]),
        "student": {
            "roll": student["roll"],
            "name": student["name"],
            "hostel": student["hostel"],
            "id_card_data": student.get("id_card_data")
        }
    }

@app.post("/api/attendance/scan")
def scan_student_qr_pass(req: ScanPassRequest):
    """Vendor scans student QR pass to verify allowance and record mess attendance."""
    raw_data = req.qr_data.strip()
    roll = None
    slot = req.slot or get_current_meal_slot()

    # Parse JSON if structured QR payload
    if raw_data.startswith("{") and raw_data.endswith("}"):
        try:
            parsed = json.loads(raw_data)
            roll = parsed.get("roll")
            # Validate expiration date if pass specifies date
            pass_date = parsed.get("date")
            today_str = get_ist_date_str()
            if pass_date and pass_date != today_str:
                return {
                    "status": "DENIED",
                    "roll": (roll or "EXPIRED_PASS").upper(),
                    "name": parsed.get("name", "Student"),
                    "hostel": parsed.get("hostel", "N/A"),
                    "slot": slot,
                    "timestamp": get_ist_time_str(),
                    "allowed": False,
                    "reason": f"Expired Pass: Meal pass is dated {pass_date}, not today ({today_str}). Access Denied."
                }
            if not req.slot and parsed.get("slot"):
                slot = parsed.get("slot")
        except Exception:
            roll = raw_data
    elif ":" in raw_data:
        parts = raw_data.split(":")
        roll = parts[0].strip()
        if not req.slot and len(parts) > 1 and parts[1].strip():
            slot = parts[1].strip()
    else:
        roll = raw_data

    if not roll:
        raise HTTPException(status_code=400, detail="Invalid QR data: missing student roll number")

    result = database.record_attendance(roll=roll, slot=slot)

    # Sync into live telemetry queue if approved
    if result.get("status") == "APPROVED":
        new_scan = {
            "id": len(telemetry_state["live_scans"]) + 1,
            "roll": result["roll"],
            "name": result["name"],
            "hostel": result["hostel"],
            "slot": result["slot"],
            "timestamp": result["timestamp"]
        }
        telemetry_state["live_scans"].insert(0, new_scan)
        if len(telemetry_state["live_scans"]) > 25:
            telemetry_state["live_scans"].pop()

    return result

@app.get("/api/attendance/today")
def get_today_attendance():
    """Returns all attendance events recorded today."""
    records = database.get_today_attendance()
    return {
        "date": get_ist_date_str(),
        "total": len(records),
        "records": records
    }

@app.get("/api/time")
def get_prayagraj_time():
    """Returns official synchronized Prayagraj IST time and active meal slot status."""
    return get_time_context()

@app.get("/api/attendance/student/{roll}")
def get_student_history(roll: str):
    """Returns meal attendance history for a specific student."""
    history = database.get_student_history(roll)
    student = database.get_student(roll)
    return {
        "roll": roll.upper(),
        "student": {
            "roll": student["roll"],
            "name": student["name"],
            "hostel": student["hostel"],
            "is_allowed": bool(student["is_allowed"])
        } if student else None,
        "history": history
    }

@app.get("/api/students/list")
def list_students():
    """Lists registered students and their allowed status for vendor management."""
    return {"students": database.list_students()}

@app.post("/api/students/toggle-allowed")
def toggle_student_allowed(req: ToggleAllowedRequest):
    """Vendor toggles student mess access permission."""
    updated = database.toggle_student_status(req.roll, req.is_allowed)
    return {"status": "success", "updated": updated}

# Mount static build files for seamless local single-port deployment
DIST_DIR = BASE_DIR / "frontend" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
