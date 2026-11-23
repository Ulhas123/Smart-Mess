import sqlite3
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.time_utils import get_ist_now, get_ist_date_str, get_ist_time_str

DB_PATH = Path(__file__).resolve().parent / "mess_system.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Create students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        roll TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        hostel TEXT NOT NULL,
        password TEXT NOT NULL,
        id_card_data TEXT,
        id_card_filename TEXT,
        is_allowed INTEGER NOT NULL DEFAULT 1,
        registered_at TEXT NOT NULL
    )
    """)

    # Create vendors table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vendors (
        vendor_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hostel TEXT NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # Create attendance table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll TEXT NOT NULL,
        name TEXT NOT NULL,
        hostel TEXT NOT NULL,
        slot TEXT NOT NULL,
        date TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT
    )
    """)

    # Seed initial vendors if empty
    cursor.execute("SELECT COUNT(*) FROM vendors")
    if cursor.fetchone()[0] == 0:
        initial_vendors = [
            ("vendor", "Central Mess Supervisor", "BH-2", "vendor123"),
            ("bh2_vendor", "BH-2 Caterer & Manager", "BH-2", "vendor123"),
            ("bh3_vendor", "BH-3 Dining Head", "BH-3", "vendor123"),
            ("admin", "Mess Warden / Admin", "All Hostels", "admin123"),
        ]
        cursor.executemany(
            "INSERT INTO vendors (vendor_id, name, hostel, password) VALUES (?, ?, ?, ?)",
            initial_vendors
        )

    # Seed initial students if empty
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
        default_id_card = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'><rect width='300' height='180' rx='10' fill='%231a365d'/><text x='150' y='35' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>IIIT ALLAHABAD</text><text x='150' y='55' fill='%23cbd5e1' font-family='sans-serif' font-size='11' text-anchor='middle'>STUDENT IDENTITY CARD</text><rect x='20' y='70' width='60' height='75' rx='6' fill='%23ffffff'/><circle cx='50' cy='95' r='18' fill='%2394a3b8'/><path d='M30 140 C30 115 70 115 70 140 Z' fill='%2394a3b8'/><text x='100' y='90' fill='%23ffffff' font-family='sans-serif' font-size='12' font-weight='bold'>MESS AUTHORIZED</text><text x='100' y='110' fill='%2394a3b8' font-family='sans-serif' font-size='11'>ECE Department</text><text x='100' y='130' fill='%2338bdf8' font-family='sans-serif' font-size='11'>Valid: 2023-2027</text></svg>"
        initial_students = [
            ("IEC2023059", "Tushar Garg", "iec2023059@iiita.ac.in", "BH-2", "student123", default_id_card, "iec2023059_id.svg", 1, "2026-01-10T10:00:00"),
            ("IEC2023037", "Varun Karankar", "iec2023037@iiita.ac.in", "BH-2", "student123", default_id_card, "iec2023037_id.svg", 1, "2026-01-10T10:00:00"),
            ("IEC2023058", "Aadarsh Singh", "iec2023058@iiita.ac.in", "BH-3", "student123", default_id_card, "iec2023058_id.svg", 1, "2026-01-10T10:00:00"),
            ("IEC2023012", "Rohan Sharma", "iec2023012@iiita.ac.in", "BH-2", "student123", default_id_card, "iec2023012_id.svg", 1, "2026-01-10T10:00:00"),
            ("IEC2023088", "Priya Verma", "iec2023088@iiita.ac.in", "GH-1", "student123", default_id_card, "iec2023088_id.svg", 1, "2026-01-10T10:00:00"),
            ("IEC2023999", "Rahul Malviya", "iec2023999@iiita.ac.in", "BH-1", "student123", default_id_card, "iec2023999_id.svg", 0, "2026-01-10T10:00:00"),
        ]
        cursor.executemany(
            """INSERT INTO students 
               (roll, name, email, hostel, password, id_card_data, id_card_filename, is_allowed, registered_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            initial_students
        )

    # Seed sample attendance for today if empty
    cursor.execute("SELECT COUNT(*) FROM attendance")
    if cursor.fetchone()[0] == 0:
        today_str = get_ist_date_str()
        initial_attendance = [
            ("IEC2023037", "Varun Karankar", "BH-2", "Lunch", today_str, "12:45:10", "APPROVED", "Entry Authorized"),
            ("IEC2023058", "Aadarsh Singh", "BH-3", "Lunch", today_str, "12:50:35", "APPROVED", "Entry Authorized"),
            ("IEC2023012", "Rohan Sharma", "BH-2", "Lunch", today_str, "13:02:15", "APPROVED", "Entry Authorized"),
        ]
        cursor.executemany(
            """INSERT INTO attendance 
               (roll, name, hostel, slot, date, timestamp, status, reason) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            initial_attendance
        )

    conn.commit()
    conn.close()

# Initialize DB on module import
init_db()

# --- Student Queries ---
def get_student(roll: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE UPPER(roll) = UPPER(?)", (roll.strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def register_student(roll: str, name: str, hostel: str, password: str, 
                     id_card_data: str, id_card_filename: str = "id_card.png", 
                     email: Optional[str] = None) -> Dict[str, Any]:
    roll_upper = roll.strip().upper()
    existing = get_student(roll_upper)
    if existing:
        raise ValueError(f"Student with Roll Number {roll_upper} is already registered. Please log in.")

    email_val = email.strip() if email else f"{roll_upper.lower()}@iiita.ac.in"
    reg_time = get_ist_now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO students 
           (roll, name, email, hostel, password, id_card_data, id_card_filename, is_allowed, registered_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)""",
        (roll_upper, name.strip(), email_val, hostel.strip(), password.strip(), id_card_data, id_card_filename, reg_time)
    )
    conn.commit()
    conn.close()

    return {
        "roll": roll_upper,
        "name": name.strip(),
        "email": email_val,
        "hostel": hostel.strip(),
        "is_allowed": True,
        "id_card_filename": id_card_filename,
        "registered_at": reg_time
    }

def verify_student(roll: str, password: str) -> Optional[Dict[str, Any]]:
    student = get_student(roll)
    if not student:
        return None
    if student["password"] == password.strip():
        # Return student profile without password
        return {
            "roll": student["roll"],
            "name": student["name"],
            "email": student["email"],
            "hostel": student["hostel"],
            "is_allowed": bool(student["is_allowed"]),
            "id_card_data": student["id_card_data"],
            "id_card_filename": student["id_card_filename"],
            "registered_at": student["registered_at"]
        }
    return None

def list_students() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT roll, name, email, hostel, is_allowed, id_card_filename, registered_at, id_card_data FROM students ORDER BY roll ASC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "roll": r["roll"],
            "name": r["name"],
            "email": r["email"],
            "hostel": r["hostel"],
            "is_allowed": bool(r["is_allowed"]),
            "id_card_filename": r["id_card_filename"],
            "id_card_data": r["id_card_data"],
            "registered_at": r["registered_at"]
        }
        for r in rows
    ]

def toggle_student_status(roll: str, is_allowed: bool) -> Dict[str, Any]:
    roll_upper = roll.strip().upper()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE students SET is_allowed = ? WHERE UPPER(roll) = UPPER(?)", (1 if is_allowed else 0, roll_upper))
    conn.commit()
    conn.close()
    return {"roll": roll_upper, "is_allowed": is_allowed}

# --- Vendor Queries ---
def verify_vendor(vendor_id: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vendors WHERE LOWER(vendor_id) = LOWER(?)", (vendor_id.strip(),))
    row = cursor.fetchone()
    conn.close()
    if row and row["password"] == password.strip():
        return {
            "vendor_id": row["vendor_id"],
            "name": row["name"],
            "hostel": row["hostel"]
        }
    return None

# --- Attendance Queries ---
def record_attendance(roll: str, slot: str, force_date: Optional[str] = None) -> Dict[str, Any]:
    roll_upper = roll.strip().upper()
    student = get_student(roll_upper)
    date_str = force_date or get_ist_date_str()
    time_str = get_ist_time_str()

    # 1. Check if student exists
    if not student:
        reason = f"Roll Number {roll_upper} is not registered in the institutional mess registry. Student must register first."
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO attendance (roll, name, hostel, slot, date, timestamp, status, reason)
               VALUES (?, ?, ?, ?, ?, ?, 'DENIED', ?)""",
            (roll_upper, "Unknown Student", "N/A", slot, date_str, time_str, reason)
        )
        conn.commit()
        conn.close()
        return {
            "status": "DENIED",
            "roll": roll_upper,
            "name": "Unknown Student",
            "hostel": "N/A",
            "slot": slot,
            "timestamp": time_str,
            "allowed": False,
            "reason": reason
        }

    # 2. Check if student is allowed
    if not student["is_allowed"]:
        reason = f"Access Denied: Student {student['roll']} ({student['name']}) is NOT AUTHORIZED to enter the mess (status: Barred/Unpaid mess dues)."
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO attendance (roll, name, hostel, slot, date, timestamp, status, reason)
               VALUES (?, ?, ?, ?, ?, ?, 'DENIED', ?)""",
            (student["roll"], student["name"], student["hostel"], slot, date_str, time_str, reason)
        )
        conn.commit()
        conn.close()
        return {
            "status": "DENIED",
            "roll": student["roll"],
            "name": student["name"],
            "hostel": student["hostel"],
            "slot": slot,
            "timestamp": time_str,
            "allowed": False,
            "reason": reason,
            "id_card_data": student.get("id_card_data")
        }

    # 3. Check for duplicate scan today for this slot
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT timestamp FROM attendance WHERE UPPER(roll) = UPPER(?) AND date = ? AND LOWER(slot) = LOWER(?) AND status = 'APPROVED'",
        (roll_upper, date_str, slot)
    )
    dup = cursor.fetchone()
    if dup:
        reason = f"Duplicate Entry Blocked: Meal pass already claimed for {slot} at {dup[0]} today."
        cursor.execute(
            """INSERT INTO attendance (roll, name, hostel, slot, date, timestamp, status, reason)
               VALUES (?, ?, ?, ?, ?, ?, 'DUPLICATE', ?)""",
            (student["roll"], student["name"], student["hostel"], slot, date_str, time_str, reason)
        )
        conn.commit()
        conn.close()
        return {
            "status": "DUPLICATE",
            "roll": student["roll"],
            "name": student["name"],
            "hostel": student["hostel"],
            "slot": slot,
            "timestamp": time_str,
            "allowed": False,
            "claimed_at": dup[0],
            "reason": reason,
            "id_card_data": student.get("id_card_data")
        }

    # 4. Valid and allowed -> Record approved attendance
    cursor.execute(
        """INSERT INTO attendance (roll, name, hostel, slot, date, timestamp, status, reason)
           VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', 'Entry Authorized')""",
        (student["roll"], student["name"], student["hostel"], slot, date_str, time_str)
    )
    conn.commit()
    conn.close()

    return {
        "status": "APPROVED",
        "roll": student["roll"],
        "name": student["name"],
        "hostel": student["hostel"],
        "slot": slot,
        "timestamp": time_str,
        "allowed": True,
        "reason": "Entry Authorized: Meal verified and recorded.",
        "id_card_data": student.get("id_card_data")
    }

def get_today_attendance(date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    today = date_str or get_ist_date_str()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attendance WHERE date = ? ORDER BY id DESC", (today,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_student_history(roll: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attendance WHERE UPPER(roll) = UPPER(?) ORDER BY id DESC LIMIT 50", (roll.strip(),))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
