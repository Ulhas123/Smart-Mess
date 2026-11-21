import os
import math
import yaml
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

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


# --- Core Mathematical Simulator Functions ---
def compute_headcount(req: ForecastRequest) -> Dict[str, Any]:
    capacity = 300.0
    base_rates = {"breakfast": 0.42, "lunch": 0.67, "dinner": 0.76}
    base_rate = base_rates.get(req.slot.lower(), 0.67)

    # Academic Regime Multiplier
    regime_mults = {
        "Normal": 1.0,
        "Mid-Sem Exam": 1.06,
        "End-Sem Exam": 1.07,
        "Mid-Break": 0.35,
        "End-Break": 0.15,
        "Summer": 0.30,
        "Pre-Semester": 0.25,
        "Holiday": 0.82,
    }

    academic_phase = req.academic_phase or "Normal"
    days_to_exam = req.days_to_exam if req.days_to_exam is not None else 30
    festival_factor = req.festival_factor if req.festival_factor is not None else 0.0

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

    # Weather Multiplier
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

    # Menu Multiplier
    m_menu = 1.0
    if req.has_dessert:
        m_menu += 0.06
    if req.is_fast_food:
        m_menu += 0.05
    if req.is_special:
        m_menu += 0.04
    if req.hostel == "BH-3" and req.has_nonveg:
        m_menu += 0.07

    # Festival Decay Multiplier
    m_festival = 1.0 - (0.75 * min(1.0, max(0.0, festival_factor)))

    # Anticipatory Exam Effect
    m_anticipatory = 1.0
    if 0 < days_to_exam <= 3:
        m_anticipatory = 1.02

    # Expected headcount mu
    mu = capacity * base_rate * m_regime * m_weather * m_menu * m_festival * m_anticipatory
    mu = max(15.0, min(float(capacity), mu))

    # Heteroscedastic dispersion alpha
    # In exams and festival transitions, uncertainty (dispersion) increases
    alpha = 0.08
    if academic_phase in ["Mid-Sem Exam", "End-Sem Exam"]:
        alpha = 0.05  # More predictable attendance
    elif academic_phase in ["Mid-Break", "End-Break", "Summer"]:
        alpha = 0.18  # High relative dispersion during breaks
    if festival_factor > 0.2:
        alpha += 0.10

    # Variance = mu + alpha * mu^2
    var = mu + alpha * (mu ** 2)
    std_dev = math.sqrt(var)

    # Quantiles from calibrated negative binomial / pinball loss:
    # q10 ≈ mu - 1.28*std, q90 ≈ mu + 1.28*std
    q10 = max(10, int(round(mu - 1.28155 * std_dev)))
    q50 = int(round(mu))
    q90 = min(int(capacity), int(round(mu + 1.28155 * std_dev)))

    # Asymmetric q75 safety stock target (Koenker-Bassett / Silver et al.)
    q75 = min(int(capacity), int(round(mu + 0.67449 * std_dev)))
    safety_stock = max(5, q75 - q50)

    # Tolerances
    within_25 = [max(10, q50 - 25), min(int(capacity), q50 + 25)]
    within_35 = [max(10, q50 - 35), min(int(capacity), q50 + 35)]
    within_50 = [max(10, q50 - 50), min(int(capacity), q50 + 50)]

    # Batch Cooking Recommendation
    initial_cook_batch = q10 + int(0.65 * (q50 - q10))
    buffer_tray_batch = q90 - initial_cook_batch

    return {
        "expected_headcount": q50,
        "q10": q10,
        "q50": q50,
        "q75": q75,
        "q90": q90,
        "std_dev": round(std_dev, 2),
        "dispersion_alpha": round(alpha, 3),
        "capacity": int(capacity),
        "utilization_pct": round((q50 / capacity) * 100, 1),
        "safety_stock_heads": safety_stock,
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
                {"day": "Monday", "breakfast": "Poha, Jalebi, Tea/Milk", "lunch": "Rajma, Rice, Chapati, Mixed Veg, Salad", "dinner": "Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun", "has_dessert": True, "is_special": True},
                {"day": "Tuesday", "breakfast": "Aloo Paratha, Curd, Pickle, Tea", "lunch": "Kadhi Pakora, Steamed Rice, Aloo Gobi, Chapati", "dinner": "Matar Paneer, Yellow Dal, Chapati, Rice, Kheer", "has_dessert": True, "is_special": False},
                {"day": "Wednesday", "breakfast": "Idli Sambar, Coconut Chutney, Tea", "lunch": "Chole Bhature, Pulao, Boondi Raita, Onion Salad", "dinner": "Mix Veg Curry, Dal Tadka, Chapati, Rice, Custard", "is_fast_food": True, "has_dessert": True},
                {"day": "Thursday", "breakfast": "Veg Upma, Banana, Tea/Coffee", "lunch": "Black Chana Masala, Rice, Bhindi Do Pyaza, Chapati", "dinner": "Shahi Paneer, Dal Fry, Naan/Chapati, Pulao, Ice Cream", "is_special": True, "has_dessert": True},
                {"day": "Friday", "breakfast": "Puri Sabzi, Halwa, Tea", "lunch": "Dal Makhani, Rice, Chapati, Aloo Jeera, Salad", "dinner": "Dum Aloo Kashmiri, Dal Tadka, Tandoori Roti, Pulao, Rasgulla", "has_dessert": True},
                {"day": "Saturday", "breakfast": "Masala Dosa, Sambhar, Chutney", "lunch": "Kashmiri Pulao, Paneer Bhurji, Dal, Chapati", "dinner": "Veg Biryani, Mirchi Ka Salan, Raita, Rasmalai", "is_fast_food": True, "is_special": True, "has_dessert": True},
                {"day": "Sunday", "breakfast": "Pav Bhaji, Boiled Egg/Sprouts, Tea", "lunch": "Special Thali: Paneer Lababdar, Dal Tadka, Puri, Pulao, Sweet", "dinner": "Aloo Matar, Dal Fry, Rice, Chapati, Fruit Salad", "is_fast_food": True, "is_special": True}
            ],
            "BH-3": [
                {"day": "Monday", "breakfast": "Poha, Boiled Eggs / Banana, Tea", "lunch": "Rajma Masala, Rice, Chapati, Seasonal Veg", "dinner": "Chicken Curry / Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun", "has_nonveg": True, "has_dessert": True, "is_special": True},
                {"day": "Tuesday", "breakfast": "Egg Bhurji / Aloo Paratha, Curd, Tea", "lunch": "Kadhi Pakora, Steamed Rice, Aloo Gobi, Chapati", "dinner": "Matar Paneer, Yellow Dal, Chapati, Rice, Kheer", "has_dessert": True},
                {"day": "Wednesday", "breakfast": "Idli Sambar, Omelette / Coconut Chutney, Tea", "lunch": "Chole Bhature, Pulao, Boondi Raita, Salad", "dinner": "Mix Veg Curry, Dal Tadka, Chapati, Rice, Custard", "is_fast_food": True, "has_dessert": True},
                {"day": "Thursday", "breakfast": "Bread Omelette / Veg Sandwich, Tea", "lunch": "Egg Curry / Black Chana, Rice, Bhindi Masala, Chapati", "dinner": "Shahi Paneer, Dal Fry, Chapati, Pulao, Ice Cream", "has_nonveg": True, "has_dessert": True},
                {"day": "Friday", "breakfast": "Puri Sabzi, Halwa, Tea", "lunch": "Dal Makhani, Rice, Chapati, Aloo Jeera, Salad", "dinner": "Hyderabadi Chicken Biryani / Veg Biryani, Mirchi Ka Salan, Raita, Rasgulla", "has_nonveg": True, "is_special": True, "has_dessert": True},
                {"day": "Saturday", "breakfast": "Masala Dosa, Sambhar, Chutney", "lunch": "Egg Fried Rice / Veg Pulao, Dal, Chapati", "dinner": "Veg Kolhapuri, Dal Tadka, Chapati, Pulao, Sweet", "is_fast_food": True},
                {"day": "Sunday", "breakfast": "Egg Roll / Pav Bhaji, Tea", "lunch": "Sunday Feast: Chicken Roast / Paneer Lababdar, Pulao, Puri, Ice Cream", "dinner": "Light Khichdi / Aloo Matar, Curd, Chapati", "has_nonveg": True, "is_special": True, "has_dessert": True}
            ]
        }
    return menu_df.to_dict(orient="records")

@app.post("/api/forecast")
def forecast(req: ForecastRequest):
    return compute_headcount(req)

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
            {"model": "LightGBM (All Features)", "mae": 41.54, "rmse": 53.23, "mape": "32.14%", "wape": "25.95%", "picp_90": "72.4%", "speed": "0.4 ms (Instant)"},
            {"model": "LightGBM (No Weather Ablation)", "mae": 41.67, "rmse": 53.33, "mape": "32.08%", "wape": "26.03%", "picp_90": "72.1%", "speed": "0.4 ms"},
            {"model": "LightGBM (No Calendar Ablation)", "mae": 47.28, "rmse": 60.89, "mape": "38.09%", "wape": "29.54%", "picp_90": "68.3%", "speed": "0.3 ms"},
            {"model": "LightGBM Asymmetric (q75)", "mae": 48.54, "rmse": 61.49, "mape": "44.32%", "wape": "30.33%", "picp_90": "84.2%", "speed": "0.4 ms"},
            {"model": "Seasonal-Naive Baseline", "mae": 68.20, "rmse": 85.77, "mape": "65.57%", "wape": "42.61%", "picp_90": "—", "speed": "0.1 ms"},
            {"model": "Holt-Winters Smoothing", "mae": 69.56, "rmse": 83.47, "mape": "58.16%", "wape": "33.58%", "picp_90": "—", "speed": "12.3 ms"},
            {"model": "SARIMA (2,1,1)(1,1,1)", "mae": 72.88, "rmse": 86.01, "mape": "58.93%", "wape": "35.18%", "picp_90": "—", "speed": "145.0 ms"}
        ],
        "ops_comparison": {
            "rule_a_quantile": {
                "rule": "Quantile-blend (Rule A - Proposed)",
                "total_served": 97955,
                "total_procured": 114129,
                "waste_heads": 22915,
                "shortage_heads": 6741,
                "waste_pct": "20.08%",
                "shortage_rate_pct": "6.88%",
                "cost_per_event": "₹70.49",
                "total_cost_units": 43138
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
        "timestamp": datetime.now().strftime("%H:%M:%S")
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

# Mount static build files for seamless local single-port deployment
DIST_DIR = BASE_DIR / "frontend" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
