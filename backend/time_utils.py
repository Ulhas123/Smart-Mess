"""
backend/time_utils.py - Prayagraj Timezone (Asia/Kolkata) Synchronization Utilities

Official Mess Service Schedule (KMK Global Limited, IIIT Prayagraj BH-2 & BH-3):
- Breakfast: Mon-Fri (07:30 - 09:30 IST), Sat-Sun (08:30 - 10:30 IST)
- Lunch: Everyday (13:00 - 15:00 IST)
- Dinner: Mon-Sat (19:30 - 21:30 IST), Sun (20:00 - 21:30 IST)

Note: The obsolete 'Snacks' slot has been fully decommissioned.
"""

from datetime import datetime, time
from typing import Optional, Dict, Any, Tuple
from zoneinfo import ZoneInfo

PRAYAGRAJ_TZ = ZoneInfo("Asia/Kolkata")
IST = PRAYAGRAJ_TZ

# Official KMK Global IIIT Prayagraj BH-2 & BH-3 Mess Timings
MEAL_SCHEDULE: Dict[str, Dict[str, Tuple[time, time]]] = {
    "weekday": {  # Mon-Fri (0-4)
        "breakfast": (time(7, 30), time(9, 30)),
        "lunch": (time(13, 0), time(15, 0)),
        "dinner": (time(19, 30), time(21, 30)),
    },
    "saturday": {  # Sat (5)
        "breakfast": (time(8, 30), time(10, 30)),
        "lunch": (time(13, 0), time(15, 0)),
        "dinner": (time(19, 30), time(21, 30)),
    },
    "sunday": {  # Sun (6)
        "breakfast": (time(8, 30), time(10, 30)),
        "lunch": (time(13, 0), time(15, 0)),
        "dinner": (time(20, 0), time(21, 30)),
    },
}


def get_ist_now() -> datetime:
    """Return the current datetime in Prayagraj timezone (Asia/Kolkata)."""
    return datetime.now(IST)


def ensure_ist(dt: Optional[datetime] = None) -> datetime:
    """Ensure datetime is timezone-aware and set to Asia/Kolkata."""
    if dt is None:
        return get_ist_now()
    if dt.tzinfo is None:
        return dt.replace(tzinfo=IST)
    return dt.astimezone(IST)


def get_ist_date_str(dt: Optional[datetime] = None) -> str:
    """Return date string 'YYYY-MM-DD' in Prayagraj timezone."""
    return ensure_ist(dt).strftime("%Y-%m-%d")


def get_ist_time_str(dt: Optional[datetime] = None) -> str:
    """Return time string 'HH:MM:SS' in Prayagraj timezone."""
    return ensure_ist(dt).strftime("%H:%M:%S")


def get_active_meal_slot(dt: Optional[datetime] = None) -> Optional[str]:
    """
    Return 'Breakfast', 'Lunch', or 'Dinner' if dt falls strictly inside the
    official serving hours, else None.
    """
    now = ensure_ist(dt)
    t = now.time()
    wd = now.weekday()

    if wd < 5:
        sched = MEAL_SCHEDULE["weekday"]
    elif wd == 5:
        sched = MEAL_SCHEDULE["saturday"]
    else:
        sched = MEAL_SCHEDULE["sunday"]

    for slot, (start, end) in sched.items():
        if start <= t <= end:
            return slot.capitalize()
    return None


def get_current_meal_slot(dt: Optional[datetime] = None) -> str:
    """
    Return the operational meal slot ('Breakfast', 'Lunch', or 'Dinner').
    If currently within active serving hours, returns that slot.
    Otherwise maps to the active or upcoming slot:
      - Before 10:30 (weekdays) / 11:00 (weekends) -> Breakfast
      - 10:30 / 11:00 to 16:00 -> Lunch
      - 16:00 onwards -> Dinner
    The obsolete 'Snacks' slot is not returned.
    """
    now = ensure_ist(dt)
    t = now.time()
    wd = now.weekday()

    active = get_active_meal_slot(now)
    if active:
        return active

    breakfast_cutoff = time(11, 0) if wd >= 5 else time(10, 30)
    lunch_cutoff = time(16, 0)

    if t < breakfast_cutoff:
        return "Breakfast"
    elif t < lunch_cutoff:
        return "Lunch"
    else:
        return "Dinner"


def is_meal_slot_active(slot: str, dt: Optional[datetime] = None) -> bool:
    """Check if the given meal slot is currently being served in Prayagraj."""
    active = get_active_meal_slot(dt)
    if not active:
        return False
    return active.lower() == slot.strip().lower()


def get_slot_timing_display(slot: str, dt: Optional[datetime] = None) -> str:
    """Return the human-readable serving timing for the slot on the current day."""
    now = ensure_ist(dt)
    wd = now.weekday()
    slot_key = slot.strip().lower()

    if slot_key == "breakfast":
        return "08:30 – 10:30 IST" if wd >= 5 else "07:30 – 09:30 IST"
    elif slot_key == "lunch":
        return "13:00 – 15:00 IST"
    elif slot_key == "dinner":
        return "20:00 – 21:30 IST" if wd == 6 else "19:30 – 21:30 IST"
    return "N/A"


def get_time_context(dt: Optional[datetime] = None) -> Dict[str, Any]:
    """Return complete Prayagraj time synchronization context for APIs & UI."""
    now = ensure_ist(dt)
    active = get_active_meal_slot(now)
    current = get_current_meal_slot(now)
    return {
        "timezone": "Asia/Kolkata",
        "city": "Prayagraj",
        "iso": now.isoformat(),
        "date": get_ist_date_str(now),
        "time": get_ist_time_str(now),
        "weekday": now.strftime("%A"),
        "is_weekend": now.weekday() >= 5,
        "active_slot": active,
        "current_slot": current,
        "active_timing": get_slot_timing_display(current, now),
        "is_active_serving": active is not None,
    }
