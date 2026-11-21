<#
.SYNOPSIS
    One-click local deployment script for IIIT Allahabad Mess Demand Forecasting System.

.DESCRIPTION
    Builds the React frontend (if needed) and starts the unified FastAPI application
    serving both the REST API (/api/*) and the React SPA UI on http://127.0.0.1:8000.
    Optionally starts Vite dev server with HMR when passed -Dev.

.EXAMPLE
    .\start_local.ps1          # Starts unified production server on port 8000
    .\start_local.ps1 -Dev     # Starts Vite dev server (5173) + FastAPI (8000)
    .\start_local.ps1 -Build   # Forces a clean rebuild of the frontend before launch
#>

param (
    [switch]$Dev,
    [switch]$Build
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  IIITA Mess Management & Demand Forecasting System" -ForegroundColor Green
Write-Host "  Department of ECE, Indian Institute of Information Technology, Allahabad" -ForegroundColor DarkCyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Environment Verification
Write-Host "`n[1/3] Checking environment..." -ForegroundColor Yellow
try {
    $pyVer = & python --version 2>&1
    Write-Host "  Python detected: $pyVer" -ForegroundColor Gray
} catch {
    Write-Error "Python is not installed or not in PATH."
}

try {
    $nodeVer = & node --version 2>&1
    Write-Host "  Node.js detected: $nodeVer" -ForegroundColor Gray
} catch {
    Write-Error "Node.js is not installed or not in PATH."
}

# 2. Frontend Build Verification
$distIndex = Join-Path $ScriptDir "frontend\dist\index.html"
$needsBuild = $Build -or (-not (Test-Path $distIndex))

if ($needsBuild) {
    Write-Host "`n[2/3] Building React production bundle..." -ForegroundColor Yellow
    Push-Location "frontend"
    try {
        & npm run build
        Write-Host "  Frontend compiled successfully to frontend\dist." -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "`n[2/3] Existing frontend build detected in frontend\dist." -ForegroundColor Green
}

# 3. Launching Services
Write-Host "`n[3/3] Starting services..." -ForegroundColor Yellow

if ($Dev) {
    Write-Host "  Starting in DUAL DEVELOPMENT MODE:" -ForegroundColor Magenta
    Write-Host "  -> Backend API:  http://127.0.0.1:8000/api" -ForegroundColor Gray
    Write-Host "  -> Frontend Dev: http://localhost:5173" -ForegroundColor Gray

    # Start FastAPI in background job or new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir'; Write-Host 'FastAPI Backend Running on http://127.0.0.1:8000' -ForegroundColor Green; python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
    
    # Start Vite in current session
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:5173"
    Set-Location "$ScriptDir\frontend"
    & npm run dev
} else {
    Write-Host "  Starting in UNIFIED LOCAL MODE:" -ForegroundColor Green
    Write-Host "  -> Web Application & API: http://127.0.0.1:8000" -ForegroundColor Cyan
    Write-Host "  -> Interactive API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor Gray
    Write-Host "`n  Press Ctrl+C to stop the server.`n" -ForegroundColor Yellow

    # Launch browser after 1 second
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 1
        Start-Process "http://127.0.0.1:8000"
    } | Out-Null

    # Start FastAPI server
    & python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
}
