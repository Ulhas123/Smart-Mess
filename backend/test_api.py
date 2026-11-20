import sys
from pathlib import Path

# Add current dir to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import compute_headcount, ForecastRequest

req = ForecastRequest(
    date="2026-03-15",
    hostel="BH-2",
    slot="dinner",
    academic_phase="Mid-Sem Exam"
)
res = compute_headcount(req)
print(f"Test Successful! Expected: {res['q50']}, bounds: [{res['q10']}, {res['q90']}], Initial batch: {res['cooking_strategy']['initial_cook_batch']}")
