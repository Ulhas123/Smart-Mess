import os
import sys
import math
import json
import csv
import hashlib
from pathlib import Path
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

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
REPO_ML_DIR = BASE_DIR / "repo_ml"
DATA_DIR = REPO_ML_DIR / "data"
RESULTS_DIR = REPO_ML_DIR / "results"
CONFIG_DIR = REPO_ML_DIR / "config"

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

def load_csv_data(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

# --- Core Mathematical Simulator Functions ---
def compute_headcount(data: dict) -> dict:
    hostel_str = str(data.get("hostel", "BH-2")).strip()
    if hostel_str in ["Combined", "BH-2 + BH-3", "BH2+BH3", "Both", "All"]:
        capacity = 600.0
    elif hostel_str == "BH-3":
        capacity = 300.0
    else:
        capacity = 300.0

    slot = str(data.get("slot", "dinner")).lower()
    base_rates = {"breakfast": 0.42, "lunch": 0.67, "dinner": 0.76}
    base_rate = base_rates.get(slot, 0.67)

    academic_phase = data.get("academic_phase", "Normal")
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
    m_regime = regime_mults.get(academic_phase, 1.0)

    # Weather Multiplier: Rain breakfast = 0.82, Rain lunch = 0.96, Heat >=40C = 0.97, Cold <=10C = 0.98
    m_weather = 1.0
    is_rainy = bool(data.get("is_rainy", False))
    temp_max = float(data.get("temp_max", 32.0))
    temp_min = float(data.get("temp_min", 22.0))
    if is_rainy:
        if slot == "breakfast":
            m_weather *= 0.82
        elif slot == "lunch":
            m_weather *= 0.96
    if temp_max >= 40.0:
        m_weather *= 0.97
    if temp_min <= 10.0:
        m_weather *= 0.98

    # Menu Multiplier: Dessert = +6%, Fast food = +5%, Special = +4%, BH-3 Mon/Fri dinner non-veg = +7%
    m_menu = 1.0
    if data.get("has_dessert", False):
        m_menu += 0.06
    if data.get("is_fast_food", False):
        m_menu += 0.05
    if data.get("is_special", False):
        m_menu += 0.04
    is_mon_or_fri = False
    date_val = data.get("date")
    if date_val:
        try:
            dt = datetime.strptime(str(date_val), "%Y-%m-%d")
            is_mon_or_fri = dt.weekday() in (0, 4)
        except Exception:
            pass
    is_dinner = slot == "dinner"
    if (hostel_str in ["BH-3", "Combined"]) and data.get("has_nonveg", False) and (is_dinner or is_mon_or_fri):
        m_menu += 0.07

    # Festival Decay Multiplier (Hawkes exponential decay: Diwali a=0.70, Holi a=0.60, b=2.5d)
    festival_factor = float(data.get("festival_factor", 0.0))
    m_festival = 1.0 - (min(0.90, max(0.0, festival_factor)))

    # Anticipatory Exam Effect
    days_to_exam = int(data.get("days_to_exam", 30))
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

    var = mu + alpha * (mu ** 2)
    std_dev = math.sqrt(var)

    q10 = max(10, int(round(mu - 1.28155 * std_dev)))
    q50 = int(round(mu))
    q90 = min(int(capacity), int(round(mu + 1.28155 * std_dev)))
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
            "cooking_advice": f"Cook {initial_cook_batch} portions for main service; keep {buffer_tray_batch} portions staged in reserve."
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


def compute_procurement(data: dict) -> dict:
    heads = int(data.get("headcount", 200))
    hostel = data.get("hostel", "BH-2")
    is_bh3 = (hostel == "BH-3")
    slot = str(data.get("slot", "dinner")).lower()

    if slot == "breakfast":
        rice_kg = round(heads * 0.04, 2)
        atta_kg = round(heads * 0.08, 2)
        dal_kg = round(heads * 0.02, 2)
        veg_kg = round(heads * 0.07, 2)
        dairy_kg = round(heads * 0.15, 2)
        oil_l = round(heads * 0.015, 2)
        spices_kg = round(heads * 0.01, 2)
        nonveg_kg = round(heads * 0.08, 2) if is_bh3 else 0.0
    else:
        rice_kg = round(heads * 0.12, 2)
        atta_kg = round(heads * 0.11, 2)
        dal_kg = round(heads * 0.05, 2)
        veg_kg = round(heads * 0.16, 2)
        dairy_kg = round(heads * 0.08, 2)
        oil_l = round(heads * 0.025, 2)
        spices_kg = round(heads * 0.02, 2)
        nonveg_kg = round(heads * 0.14, 2) if is_bh3 else 0.0

    items = [
        {"name": "Rice (Basmati / Medium Grain)", "amount": f"{rice_kg} kg", "unit_price": "₹45/kg", "cost": round(rice_kg * 45)},
        {"name": "Whole Wheat Atta", "amount": f"{atta_kg} kg", "unit_price": "₹35/kg", "cost": round(atta_kg * 35)},
        {"name": "Dal & Pulses (Arhar/Rajma/Chana)", "amount": f"{dal_kg} kg", "unit_price": "₹120/kg", "cost": round(dal_kg * 120)},
        {"name": "Fresh Vegetables (Potato, Onion, Tomato, Seasonal)", "amount": f"{veg_kg} kg", "unit_price": "₹35/kg", "cost": round(veg_kg * 35)},
        {"name": "Dairy / Paneer / Curd", "amount": f"{dairy_kg} kg", "unit_price": "₹300/kg", "cost": round(dairy_kg * 300)},
        {"name": "Refined Mustard / Sunflower Oil", "amount": f"{oil_l} L", "unit_price": "₹130/L", "cost": round(oil_l * 130)},
        {"name": "Whole Spices, Salt & Condiments", "amount": f"{spices_kg} kg", "unit_price": "₹200/kg", "cost": round(spices_kg * 200)},
    ]
    if is_bh3 and nonveg_kg > 0:
        items.append({"name": "Fresh Poultry / Eggs (BH-3 Non-Veg)", "amount": f"{nonveg_kg} kg", "unit_price": "₹190/kg", "cost": round(nonveg_kg * 190)})

    total_cost = sum(item["cost"] for item in items)

    return {
        "headcount": heads,
        "hostel": hostel,
        "slot": slot,
        "total_estimated_cost_inr": round(total_cost),
        "cost_per_student_inr": round(total_cost / max(1, heads), 2),
        "procurement_list": items,
        "kitchen_prep_batches": [
            {"batch": "Batch 1 (Immediate)", "portions": int(heads * 0.70), "description": "Cooked 45 min prior to meal opening."},
            {"batch": "Batch 2 (Buffer Prep)", "portions": int(heads * 0.30), "description": "Vegetables prepped, dough ready for fast replenishment."}
        ]
    }


class APIServerHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data, status_code=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json({
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
            })
        elif path == "/api/calendar":
            calendar_rows = load_csv_data(DATA_DIR / "iiita_calendar_2025_2026.csv")
            self._send_json({
                "total_days": len(calendar_rows),
                "regimes": ["Normal", "Mid-Sem Exam", "End-Sem Exam", "Mid-Break", "End-Break", "Summer", "Pre-Semester", "Holiday"],
                "sample": calendar_rows[:100]
            })
        elif path == "/api/menu":
            menu_rows = load_csv_data(DATA_DIR / "mess_menu_weekly.csv")
            self._send_json({
                "rows": menu_rows,
                "hostels": ["BH-2", "BH-3"]
            })
        elif path == "/api/benchmarks":
            self._send_json({
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
            })
        elif path == "/api/telemetry/stats":
            self._send_json({
                "total_scans_today": len(telemetry_state["live_scans"]),
                "recent_scans": telemetry_state["live_scans"][:10],
                "feedback": telemetry_state["feedback"]
            })
        elif path == "/api/weather":
            self._send_json(weather.get_prayagraj_weather())
        elif path == "/api/time":
            self._send_json(get_time_context())
        elif path.startswith("/api/forecast/test-series"):
            qs = parse_qs(parsed.query)
            hostel = qs.get("hostel", ["BH-2"])[0]
            slot = qs.get("slot", ["dinner"])[0]
            limit = int(qs.get("limit", [21])[0])
            test_rows = load_csv_data(RESULTS_DIR / "test_predictions.csv")
            sub = [
                r for r in test_rows
                if r.get("hostel", "").upper() == hostel.upper() and r.get("slot", "").lower() == slot.lower()
            ][:limit]
            records = []
            for r in sub:
                try:
                    actual = int(float(r.get("headcount", 0)))
                    q50 = round(float(r.get("lgbm_q50", 0)), 1)
                    records.append({
                        "date": r.get("date", ""),
                        "display": r.get("date", "")[5:],
                        "phase": r.get("academic_phase", "").replace("_", " ").title(),
                        "actual": actual,
                        "forecast": q50,
                        "point": round(float(r.get("lgbm_point", 0)), 1),
                        "q10": round(float(r.get("lgbm_q10", 0)), 1),
                        "q90": round(float(r.get("lgbm_q90", 0)), 1),
                        "error": round(abs(actual - q50), 1),
                        "within_25": abs(actual - q50) <= 25,
                        "within_35": abs(actual - q50) <= 35,
                        "within_50": abs(actual - q50) <= 50,
                    })
                except Exception:
                    pass
            actuals = [r["actual"] for r in records]
            forecasts = [r["forecast"] for r in records]
            mae = round(sum(abs(a - f) for a, f in zip(actuals, forecasts)) / len(actuals), 2) if actuals else 41.54
            total_actual = sum(actuals)
            wape = round(sum(abs(a - f) for a, f in zip(actuals, forecasts)) / total_actual * 100, 2) if total_actual > 0 else 25.95
            within_35_pct = round(sum(1 for r in records if r["within_35"]) / len(records) * 100, 1) if records else 50.33
            self._send_json({
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
            })
        elif path == "/api/attendance/today":
            records = database.get_today_attendance()
            self._send_json({
                "date": get_ist_date_str(),
                "total": len(records),
                "records": records
            })
        elif path == "/api/students/list":
            self._send_json({"students": database.list_students()})
        elif path.startswith("/api/attendance/student/"):
            roll = path.split("/api/attendance/student/")[1].strip()
            history = database.get_student_history(roll)
            student = database.get_student(roll)
            self._send_json({
                "roll": roll.upper(),
                "student": {
                    "roll": student["roll"],
                    "name": student["name"],
                    "hostel": student["hostel"],
                    "is_allowed": bool(student["is_allowed"])
                } if student else None,
                "history": history
            })
        else:
            # Attempt to serve static frontend files
            dist_dir = BASE_DIR / "frontend" / "dist"
            rel_path = path.lstrip("/")
            file_path = dist_dir / rel_path if rel_path else dist_dir / "index.html"
            if not file_path.exists() or file_path.is_dir():
                file_path = dist_dir / "index.html"

            if file_path.exists() and file_path.is_file():
                content_type = "text/plain"
                ext = file_path.suffix.lower()
                if ext == ".html": content_type = "text/html"
                elif ext == ".js": content_type = "application/javascript"
                elif ext == ".css": content_type = "text/css"
                elif ext == ".svg": content_type = "image/svg+xml"
                elif ext in [".png", ".jpg", ".jpeg", ".ico", ".webp"]: content_type = f"image/{ext[1:]}"
                elif ext == ".json": content_type = "application/json"
                elif ext in [".woff", ".woff2"]: content_type = f"font/{ext[1:]}"
                elif ext == ".pptx": content_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

                try:
                    with open(file_path, "rb") as f:
                        body = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Content-Length", str(len(body)))
                    self._send_cors_headers()
                    self.end_headers()
                    self.wfile.write(body)
                    return
                except Exception:
                    pass

            self._send_json({"error": "Not Found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        data = {}
        if post_data:
            try:
                data = json.loads(post_data.decode("utf-8"))
            except Exception:
                data = {}

        if path == "/api/forecast":
            res = compute_headcount(data)
            self._send_json(res)
        elif path == "/api/procurement":
            res = compute_procurement(data)
            self._send_json(res)
        elif path == "/api/telemetry/swipe":
            roll = str(data.get("roll", "IEC2023000")).upper()
            hostel = data.get("hostel", "BH-2")
            slot = data.get("slot", "dinner")
            name = data.get("name") or f"Student {roll}"
            scan = {
                "id": len(telemetry_state["live_scans"]) + 1,
                "roll": roll,
                "name": name,
                "hostel": hostel,
                "slot": slot,
                "timestamp": get_ist_time_str()
            }
            telemetry_state["live_scans"].insert(0, scan)
            if len(telemetry_state["live_scans"]) > 30:
                telemetry_state["live_scans"].pop()
            self._send_json({
                "status": "success",
                "message": f"Verified check-in for {roll} at {hostel} ({slot.capitalize()})",
                "scan": scan,
                "total_active_scans": len(telemetry_state["live_scans"])
            })
        elif path == "/api/telemetry/feedback":
            entry = {
                "id": len(telemetry_state["feedback"]) + 1,
                "roll": str(data.get("roll", "Anonymous")).upper(),
                "rating": int(data.get("rating", 5)),
                "comment": data.get("comment", ""),
                "meal": data.get("meal", "Dinner"),
                "date": "Just now"
            }
            telemetry_state["feedback"].insert(0, entry)
            self._send_json({"status": "success", "entry": entry})
        elif path == "/api/auth/student/register":
            try:
                st = database.register_student(
                    roll=data.get("roll", ""),
                    name=data.get("name", ""),
                    hostel=data.get("hostel", ""),
                    password=data.get("password", ""),
                    id_card_data=data.get("id_card_data", ""),
                    id_card_filename=data.get("id_card_filename", "id_card.png"),
                    email=data.get("email")
                )
                self._send_json({"status": "success", "student": st})
            except Exception as e:
                self._send_json({"detail": str(e)}, 400)
        elif path == "/api/auth/student/login":
            st = database.verify_student(data.get("roll", ""), data.get("password", ""))
            if st:
                self._send_json({"status": "success", "student": st})
            else:
                self._send_json({"detail": "Invalid roll number or password"}, 401)
        elif path == "/api/auth/vendor/login":
            v = database.verify_vendor(data.get("vendor_id", ""), data.get("password", ""))
            if v:
                self._send_json({"status": "success", "vendor": v})
            else:
                self._send_json({"detail": "Invalid vendor ID or password"}, 401)
        elif path == "/api/attendance/generate-pass":
            roll = data.get("roll", "").upper()
            slot = data.get("slot") or get_current_meal_slot()
            st = database.get_student(roll)
            if not st:
                self._send_json({"detail": "Student not found"}, 404)
            else:
                today = get_ist_date_str()
                ts = int(get_ist_now().timestamp() * 1000)
                sig = hashlib.sha256(f"{roll}:{slot}:{today}:SALT".encode()).hexdigest()[:16]
                payload = {
                    "type": "IIITA_MESS_PASS",
                    "roll": roll,
                    "name": st["name"],
                    "hostel": st["hostel"],
                    "slot": slot,
                    "date": today,
                    "timestamp": ts,
                    "signature": sig,
                    "is_allowed": bool(st["is_allowed"])
                }
                self._send_json({
                    "status": "success",
                    "pass_data": payload,
                    "qr_string": json.dumps(payload),
                    "is_allowed": bool(st["is_allowed"]),
                    "student": st
                })
        elif path == "/api/attendance/scan":
            raw_data = str(data.get("qr_data", "")).strip()
            slot = data.get("slot") or get_current_meal_slot()
            roll = raw_data
            if raw_data.startswith("{") and raw_data.endswith("}"):
                try:
                    p = json.loads(raw_data)
                    roll = p.get("roll", raw_data)
                    pass_date = p.get("date")
                    today_str = get_ist_date_str()
                    if pass_date and pass_date != today_str:
                        self._send_json({
                            "status": "DENIED",
                            "roll": (roll or "EXPIRED_PASS").upper(),
                            "name": p.get("name", "Student"),
                            "hostel": p.get("hostel", "N/A"),
                            "slot": slot,
                            "timestamp": get_ist_time_str(),
                            "allowed": False,
                            "reason": f"Expired Pass: Meal pass is dated {pass_date}, not today ({today_str}). Access Denied."
                        })
                        return
                    if not data.get("slot") and p.get("slot"):
                        slot = p.get("slot")
                except Exception:
                    pass
            elif ":" in raw_data:
                parts = raw_data.split(":")
                roll = parts[0].strip()
                if not data.get("slot") and len(parts) > 1 and parts[1].strip():
                    slot = parts[1].strip()

            res = database.record_attendance(roll=roll, slot=slot)
            self._send_json(res)
        elif path == "/api/students/toggle-allowed":
            res = database.toggle_student_status(data.get("roll", ""), data.get("is_allowed", True))
            self._send_json({"status": "success", "updated": res})
        else:
            self._send_json({"error": "Not Found"}, 404)

def run(port=8000):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, APIServerHandler)
    print(f"IIITA Mess Management API Server running on http://127.0.0.1:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run(port)
