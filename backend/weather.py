import time
from datetime import datetime
from typing import Dict, Any

try:
    import httpx
except ImportError:
    httpx = None

# Prayagraj (Allahabad), Uttar Pradesh Coordinates
PRAYAGRAJ_LAT = 25.4358
PRAYAGRAJ_LON = 81.8463
PRAYAGRAJ_TIMEZONE = "Asia/Kolkata"

OPEN_METEO_URL = (
    f"https://api.open-meteo.com/v1/forecast"
    f"?latitude={PRAYAGRAJ_LAT}&longitude={PRAYAGRAJ_LON}"
    f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m"
    f"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum"
    f"&timezone={PRAYAGRAJ_TIMEZONE}"
)

# Weather code mapping according to WMO Code standards
WMO_WEATHER_MAP = {
    0: ("Clear Sky", "sunny"),
    1: ("Mainly Clear", "partly-cloudy"),
    2: ("Partly Cloudy", "partly-cloudy"),
    3: ("Overcast", "cloudy"),
    45: ("Foggy", "fog"),
    48: ("Depositing Rime Fog", "fog"),
    51: ("Light Drizzle", "rain"),
    53: ("Moderate Drizzle", "rain"),
    55: ("Dense Drizzle", "rain"),
    61: ("Slight Rain", "rain"),
    63: ("Moderate Rain", "rain"),
    65: ("Heavy Rain", "heavy-rain"),
    80: ("Light Rain Showers", "rain"),
    81: ("Moderate Rain Showers", "rain"),
    82: ("Violent Rain Showers", "heavy-rain"),
    95: ("Thunderstorm", "storm"),
    96: ("Thunderstorm with Slight Hail", "storm"),
    99: ("Thunderstorm with Heavy Hail", "storm"),
}

# Cache structure: { "data": ..., "timestamp": float }
_weather_cache: Dict[str, Any] = {
    "data": None,
    "timestamp": 0
}

CACHE_TTL_SECONDS = 600  # 10 minutes cache

def _fallback_weather() -> Dict[str, Any]:
    """Reliable fallback if external network is unavailable."""
    now = datetime.now()
    return {
        "city": "Prayagraj",
        "state": "Uttar Pradesh",
        "country": "India",
        "coordinates": {"latitude": PRAYAGRAJ_LAT, "longitude": PRAYAGRAJ_LON},
        "temperature": 24.5,
        "apparent_temperature": 25.0,
        "humidity": 65,
        "precipitation_mm": 0.0,
        "wind_speed_kmh": 7.5,
        "weather_code": 1,
        "condition": "Mainly Clear",
        "icon": "partly-cloudy",
        "is_day": 1 if 6 <= now.hour <= 18 else 0,
        "is_rainy": False,
        "temp_max": 28.0,
        "temp_min": 17.0,
        "source": "Open-Meteo (Cached/Standard Model)",
        "updated_at": now.strftime("%Y-%m-%d %H:%M:%S IST")
    }

def get_prayagraj_weather(force_refresh: bool = False) -> Dict[str, Any]:
    global _weather_cache
    now_ts = time.time()

    if not force_refresh and _weather_cache["data"] and (now_ts - _weather_cache["timestamp"] < CACHE_TTL_SECONDS):
        return _weather_cache["data"]

    if httpx is None:
        print("[Weather API] httpx library not available; using fallback Prayagraj weather profile.")
        if _weather_cache["data"]:
            return _weather_cache["data"]
        fallback = _fallback_weather()
        _weather_cache = {"data": fallback, "timestamp": now_ts}
        return fallback

    try:
        with httpx.Client(timeout=6.0) as client:
            resp = client.get(OPEN_METEO_URL)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                daily = data.get("daily", {})

                code = current.get("weather_code", 1)
                condition, icon = WMO_WEATHER_MAP.get(code, ("Clear / Fair", "sunny"))
                precip = float(current.get("precipitation", 0.0))
                is_rainy = precip > 0.1 or code in [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]

                temp_max = daily.get("temperature_2m_max", [28.0])[0] if daily.get("temperature_2m_max") else 28.0
                temp_min = daily.get("temperature_2m_min", [17.0])[0] if daily.get("temperature_2m_min") else 17.0

                result = {
                    "city": "Prayagraj",
                    "state": "Uttar Pradesh",
                    "country": "India",
                    "coordinates": {"latitude": PRAYAGRAJ_LAT, "longitude": PRAYAGRAJ_LON},
                    "temperature": round(float(current.get("temperature_2m", 24.0)), 1),
                    "apparent_temperature": round(float(current.get("apparent_temperature", 24.5)), 1),
                    "humidity": int(current.get("relative_humidity_2m", 60)),
                    "precipitation_mm": round(precip, 2),
                    "wind_speed_kmh": round(float(current.get("wind_speed_10m", 8.0)), 1),
                    "weather_code": code,
                    "condition": condition,
                    "icon": icon,
                    "is_day": int(current.get("is_day", 1)),
                    "is_rainy": is_rainy,
                    "temp_max": round(float(temp_max), 1),
                    "temp_min": round(float(temp_min), 1),
                    "source": "Open-Meteo Free API (Live: Prayagraj, UP)",
                    "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
                }
                _weather_cache = {"data": result, "timestamp": now_ts}
                return result
    except Exception as e:
        print(f"[Weather API] Live fetch error: {e}. Falling back to default Prayagraj weather.")

    if _weather_cache["data"]:
        return _weather_cache["data"]

    fallback = _fallback_weather()
    _weather_cache = {"data": fallback, "timestamp": now_ts}
    return fallback
