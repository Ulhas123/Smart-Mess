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

def test_api_weather():
    res = client.get("/api/weather")
    assert res.status_code == 200
    data = res.json()
    assert data["city"] == "Prayagraj"
    assert data["state"] == "Uttar Pradesh"
    assert "temperature" in data
    assert "humidity" in data
    assert "condition" in data
    print(f"[PASS] GET /api/weather -> Prayagraj, UP: {data['temperature']}°C, {data['condition']}")

def test_api_auth_student():
    # 1. Login with seeded student
    res = client.post("/api/auth/student/login", json={"roll": "IEC2023059", "password": "student123"})
    assert res.status_code == 200
    student = res.json()["student"]
    assert student["roll"] == "IEC2023059"
    assert student["is_allowed"] is True
    print("[PASS] POST /api/auth/student/login (Seed student verified)")

    # 2. Invalid password
    res_bad = client.post("/api/auth/student/login", json={"roll": "IEC2023059", "password": "wrong"})
    assert res_bad.status_code == 401
    print("[PASS] POST /api/auth/student/login (Bad credentials rejected)")

    # 3. Register new student with ID Card
    import time
    new_roll = f"IEC2023{int(time.time()) % 1000:03d}"
    fake_id_card = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    reg_payload = {
        "roll": new_roll,
        "name": "Arjun Patel",
        "hostel": "BH-2",
        "password": "mySecurePass123",
        "id_card_data": fake_id_card,
        "id_card_filename": "arjun_id_card.png"
    }
    res_reg = client.post("/api/auth/student/register", json=reg_payload)
    assert res_reg.status_code == 200
    assert res_reg.json()["student"]["roll"] == new_roll
    print(f"[PASS] POST /api/auth/student/register ({new_roll} registered with uploaded ID card)")

    # 4. Duplicate registration rejected
    res_dup = client.post("/api/auth/student/register", json=reg_payload)
    assert res_dup.status_code == 400
    print("[PASS] POST /api/auth/student/register (Duplicate roll rejection confirmed)")

def test_api_auth_vendor():
    # Valid vendor
    res = client.post("/api/auth/vendor/login", json={"vendor_id": "vendor", "password": "vendor123"})
    assert res.status_code == 200
    assert res.json()["vendor"]["vendor_id"] == "vendor"
    print("[PASS] POST /api/auth/vendor/login (Vendor verified)")

    # Invalid vendor
    res_bad = client.post("/api/auth/vendor/login", json={"vendor_id": "unknown_vendor", "password": "123"})
    assert res_bad.status_code == 401
    print("[PASS] POST /api/auth/vendor/login (Invalid vendor rejected)")

def test_api_qr_attendance():
    import uuid
    test_slot = f"Slot_{uuid.uuid4().hex[:6]}"

    # 1. Student generates pass
    gen_res = client.post("/api/attendance/generate-pass", json={"roll": "IEC2023037", "slot": test_slot})
    assert gen_res.status_code == 200
    pass_data = gen_res.json()["pass_data"]
    qr_str = gen_res.json()["qr_string"]
    assert pass_data["roll"] == "IEC2023037"
    assert pass_data["slot"] == test_slot
    print(f"[PASS] POST /api/attendance/generate-pass (Generated QR pass for {test_slot})")

    # 2. Vendor scans pass - first time -> APPROVED
    scan_res = client.post("/api/attendance/scan", json={"qr_data": qr_str, "slot": test_slot})
    assert scan_res.status_code == 200
    assert scan_res.json()["status"] == "APPROVED"
    assert scan_res.json()["allowed"] is True
    print(f"[PASS] POST /api/attendance/scan -> APPROVED for allowed student in {test_slot}")

    # 3. Vendor scans again -> DUPLICATE rejected & blocked
    dup_res = client.post("/api/attendance/scan", json={"qr_data": qr_str, "slot": test_slot})
    assert dup_res.status_code == 200
    assert dup_res.json()["status"] == "DUPLICATE"
    assert dup_res.json()["allowed"] is False
    print("[PASS] POST /api/attendance/scan -> DUPLICATE correctly caught and blocked")

    # 4. Barred student (IEC2023999 is barred) -> DENIED
    barred_res = client.post("/api/attendance/scan", json={"qr_data": "IEC2023999", "slot": test_slot})
    assert barred_res.status_code == 200
    assert barred_res.json()["status"] == "DENIED"
    assert barred_res.json()["allowed"] is False
    print("[PASS] POST /api/attendance/scan -> DENIED for disallowed student")

    # 5. Unregistered student -> DENIED
    unreg_res = client.post("/api/attendance/scan", json={"qr_data": "IEC9999999", "slot": test_slot})
    assert unreg_res.status_code == 200
    assert unreg_res.json()["status"] == "DENIED"
    assert unreg_res.json()["allowed"] is False
    print("[PASS] POST /api/attendance/scan -> DENIED for unregistered roll number")

    # 6. Expired pass from yesterday -> DENIED
    expired_pass = json.dumps({
        "type": "IIITA_MESS_PASS",
        "roll": "IEC2023037",
        "name": "Varun Karankar",
        "hostel": "BH-2",
        "slot": test_slot,
        "date": "2025-01-01",
        "timestamp": 123456789
    })
    exp_res = client.post("/api/attendance/scan", json={"qr_data": expired_pass, "slot": test_slot})
    assert exp_res.status_code == 200
    assert exp_res.json()["status"] == "DENIED"
    assert "Expired" in exp_res.json()["reason"]
    print("[PASS] POST /api/attendance/scan -> DENIED for expired date pass")

    # 7. Audit log ledger verification: GET /api/attendance/today contains the recorded scans
    today_res = client.get("/api/attendance/today")
    assert today_res.status_code == 200
    records = today_res.json()["records"]
    assert len(records) > 0
    statuses = {r["status"] for r in records}
    assert "APPROVED" in statuses
    assert "DUPLICATE" in statuses
    assert "DENIED" in statuses
    print("[PASS] GET /api/attendance/today -> All audit records logged (APPROVED, DUPLICATE, DENIED)")

    # 8. GET /api/attendance/student/{roll}
    hist_res = client.get("/api/attendance/student/IEC2023037")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["roll"] == "IEC2023037"
    assert hist_data["student"] is not None
    assert isinstance(hist_data["history"], list)
    print(f"[PASS] GET /api/attendance/student/IEC2023037 -> Student profile & history fetched ({len(hist_data['history'])} records)")

def test_api_dynamic_admission_control():
    # Toggle student from allowed -> barred -> check scan -> toggle back -> check scan
    import uuid
    slot = f"Slot_{uuid.uuid4().hex[:6]}"
    test_roll = "IEC2023088"

    # Ensure student is currently allowed
    client.post("/api/students/toggle-allowed", json={"roll": test_roll, "is_allowed": True})

    # Bar the student
    b_res = client.post("/api/students/toggle-allowed", json={"roll": test_roll, "is_allowed": False})
    assert b_res.status_code == 200

    # Scan barred student -> DENIED
    scan_b = client.post("/api/attendance/scan", json={"qr_data": test_roll, "slot": slot})
    assert scan_b.json()["status"] == "DENIED"
    assert scan_b.json()["allowed"] is False
    print(f"[PASS] Dynamic Admission: Barred student {test_roll} denied turnstile access")

    # Re-allow the student
    a_res = client.post("/api/students/toggle-allowed", json={"roll": test_roll, "is_allowed": True})
    assert a_res.status_code == 200

    # Scan allowed student -> APPROVED
    scan_a = client.post("/api/attendance/scan", json={"qr_data": test_roll, "slot": slot})
    assert scan_a.json()["status"] == "APPROVED"
    assert scan_a.json()["allowed"] is True
    print(f"[PASS] Dynamic Admission: Re-allowed student {test_roll} approved for entrance")

def test_api_student_management():
    # 1. List students
    res = client.get("/api/students/list")
    assert res.status_code == 200
    students = res.json()["students"]
    assert len(students) >= 6
    print(f"[PASS] GET /api/students/list ({len(students)} students listed)")

    # 2. Toggle student status
    toggle_res = client.post("/api/students/toggle-allowed", json={"roll": "IEC2023012", "is_allowed": False})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["updated"]["is_allowed"] is False

    # Restore
    client.post("/api/students/toggle-allowed", json={"roll": "IEC2023012", "is_allowed": True})
    print("[PASS] POST /api/students/toggle-allowed (Vendor can manage access rights)")

def test_frontend_static_serving():
    res = client.get("/")
    assert res.status_code == 200
    assert "html" in res.headers.get("content-type", "").lower()
    print("[PASS] GET / (200 OK - React Frontend SPA served directly from FastAPI)")

def test_fallback_server_parity():
    # Test that backend/server.py handlers correctly process routes
    from backend import server
    # Verify server module imports and critical functions exist
    assert hasattr(server, "APIServerHandler")
    assert hasattr(server, "compute_headcount")
    assert hasattr(server, "compute_procurement")
    # Test compute_headcount
    hc = server.compute_headcount({"slot": "lunch", "academic_phase": "Normal"})
    assert "q50" in hc and hc["q10"] <= hc["q50"] <= hc["q90"]
    # Test compute_procurement
    proc = server.compute_procurement({"headcount": 150, "slot": "lunch", "hostel": "BH-2"})
    assert "total_estimated_cost_inr" in proc
    print("[PASS] Fallback Server Parity (server.py compute and data bindings verified)")

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
    test_api_weather()
    test_api_auth_student()
    test_api_auth_vendor()
    test_api_qr_attendance()
    test_api_dynamic_admission_control()
    test_api_student_management()
    test_frontend_static_serving()
    test_fallback_server_parity()
    print("="*60)
    print("  ALL BACKEND TESTS PASSED SUCCESSFULLY!")
    print("="*60 + "\n")
