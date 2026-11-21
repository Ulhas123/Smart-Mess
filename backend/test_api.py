import sys
import json
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from backend.main import app, compute_headcount, ForecastRequest

client = TestClient(app)

def test_direct_computation():
    req = ForecastRequest(
        date="2026-03-15",
        hostel="BH-2",
        slot="dinner",
        academic_phase="Mid-Sem Exam"
    )
    res = compute_headcount(req)
    assert res["q10"] <= res["q50"] <= res["q90"], "Quantile bounds must be monotonic"
    print(f"[PASS] Direct compute_headcount: q50={res['q50']}, bounds=[{res['q10']}, {res['q90']}]")

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    print("[PASS] GET /api/health (200 OK)")

def test_api_calendar():
    res = client.get("/api/calendar")
    assert res.status_code == 200
    data = res.json()
    assert "total_days" in data
    assert len(data["sample"]) > 0
    # Ensure no NaN errors in JSON
    json_str = res.text
    assert "NaN" not in json_str, "Calendar output must not contain NaN"
    print(f"[PASS] GET /api/calendar (200 OK, total_days={data['total_days']})")

def test_api_menu():
    res = client.get("/api/menu")
    assert res.status_code == 200
    print("[PASS] GET /api/menu (200 OK)")

def test_api_forecast():
    payload = {
        "date": "2026-03-15",
        "hostel": "BH-2",
        "slot": "dinner",
        "academic_phase": "Mid-Sem Exam"
    }
    res = client.post("/api/forecast", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["q10"] <= data["q50"] <= data["q75"] <= data["q90"]
    print(f"[PASS] POST /api/forecast (200 OK, q10={data['q10']}, q50={data['q50']}, q90={data['q90']})")

def test_api_procurement():
    for hostel in ["BH-2", "BH-3"]:
        payload = {"headcount": 200, "hostel": hostel, "slot": "dinner"}
        res = client.post("/api/procurement", json=payload)
        assert res.status_code == 200
        data = res.json()
        item_sum = sum(x["cost"] for x in data["procurement_list"])
        total_cost = data["total_estimated_cost_inr"]
        assert item_sum == total_cost, f"Discrepancy for {hostel}: item sum {item_sum} != total {total_cost}"
        print(f"[PASS] POST /api/procurement {hostel}: Item sum ₹{item_sum} == Total ₹{total_cost} (Zero discrepancy)")

def test_api_benchmarks():
    res = client.get("/api/benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert len(data["models"]) > 0
    print("[PASS] GET /api/benchmarks (200 OK)")

def test_api_telemetry():
    swipe_res = client.post("/api/telemetry/swipe", json={
        "roll": "IEC2023059",
        "name": "Tushar Garg",
        "hostel": "BH-3",
        "slot": "lunch"
    })
    assert swipe_res.status_code == 200
    print("[PASS] POST /api/telemetry/swipe (200 OK)")

    fb_res = client.post("/api/telemetry/feedback", json={
        "roll": "IEC2023059",
        "rating": 5,
        "comment": "Paneer was great!",
        "meal": "Lunch"
    })
    assert fb_res.status_code == 200
    print("[PASS] POST /api/telemetry/feedback (200 OK)")

    stats_res = client.get("/api/telemetry/stats")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_scans_today"] > 0
    print("[PASS] GET /api/telemetry/stats (200 OK)")

def test_frontend_static_serving():
    res = client.get("/")
    assert res.status_code == 200
    assert "html" in res.headers.get("content-type", "").lower()
    print("[PASS] GET / (200 OK - React Frontend SPA served directly from FastAPI)")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  RUNNING BACKEND VERIFICATION SUITE")
    print("="*60)
    test_direct_computation()
    test_api_health()
    test_api_calendar()
    test_api_menu()
    test_api_forecast()
    test_api_procurement()
    test_api_benchmarks()
    test_api_telemetry()
    test_frontend_static_serving()
    print("="*60)
    print("  ALL BACKEND TESTS PASSED SUCCESSFULLY!")
    print("="*60 + "\n")
