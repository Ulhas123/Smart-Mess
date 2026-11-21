@echo off
setlocal
cd /d "%~dp0"

echo =================================================================
echo   IIITA Mess Management ^& Demand Forecasting System
echo   Department of ECE, IIIT Allahabad - Local Launcher
echo =================================================================
echo.

if not exist "frontend\dist\index.html" (
    echo Building React frontend for local deployment...
    cd frontend
    call npm run build
    cd ..
    echo Frontend build complete.
    echo.
)

echo Starting Unified Server at http://127.0.0.1:8000 ...
echo [API Docs available at http://127.0.0.1:8000/docs]
echo.

start "" "http://127.0.0.1:8000"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

pause
