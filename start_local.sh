#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "  IIITA MESA — Intelligent Institutional Dining System"
echo "  Department of ECE, IIIT Allahabad — Local Launcher"
echo "================================================================="
echo ""

# Choose python: check .venv first, then python3
if [ -f "$DIR/.venv/bin/python" ]; then
  PYTHON="$DIR/.venv/bin/python"
elif command -v python3 &>/dev/null; then
  PYTHON="python3"
else
  PYTHON="python"
fi

if [ ! -d "frontend/dist" ] || [ ! -f "frontend/dist/index.html" ]; then
  echo "Building React frontend for local deployment..."
  cd "$DIR/frontend"
  npm run build
  cd "$DIR"
  echo "Frontend build complete."
  echo ""
fi

echo "Starting Unified FastAPI Server on http://127.0.0.1:8000 ..."
"$PYTHON" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "Starting Vite Frontend Dev Server on http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!
cd "$DIR"

cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo ""
echo "🚀 Application is LIVE!"
echo "   ➜ Frontend (Vite Dev Server): http://localhost:5173"
echo "   ➜ Unified Web App & API:      http://127.0.0.1:8000"
echo "   ➜ Interactive Swagger Docs:   http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."
wait
