#!/usr/bin/env bash
set -euo pipefail

# ── Freya Quickstart — Cloud-First ──────────────────────────────
# One-command development setup. Installs deps, starts backend
# and frontend, then opens the browser.
#
# Usage:
#   git clone https://github.com/willtanoe/freya.git
#   cd freya
#   ./scripts/quickstart.sh
# ────────────────────────────────────────────────────────────────

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

info()  { echo -e "${BLUE}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail()  { echo -e "${RED}[fail]${NC}  $*"; exit 1; }

CLEANUP_PIDS=()
cleanup() {
  echo ""
  info "Shutting down..."
  for pid in "${CLEANUP_PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  ok "Done."
}
trap cleanup EXIT INT TERM

# ── Navigate to repo root ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo -e "${BOLD}"
echo "  ┌──────────────────────────────────────┐"
echo "  │        Freya Quickstart              │"
echo "  └──────────────────────────────────────┘"
echo -e "${NC}"

# ── 1. Python ──
info "Checking Python..."
if command -v python3 &>/dev/null; then
  PY_CMD="python3"
elif command -v python &>/dev/null; then
  PY_CMD="python"
else
  fail "Python 3 not found. Install from https://python.org"
fi
PY_VERSION=$("$PY_CMD" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
ok "Python $PY_VERSION"

# ── 2. uv ──
info "Checking uv..."
if ! command -v uv &>/dev/null; then
  warn "uv not found — installing..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
ok "uv ready"

# ── 3. Node.js ──
info "Checking Node.js..."
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version)
  ok "Node.js $NODE_VERSION"
else
  fail "Node.js not found. Install from https://nodejs.org"
fi

# ── 4. Python deps ──
info "Installing Python dependencies..."
uv sync --extra server --extra inference-cloud --quiet 2>/dev/null || uv sync --extra server --extra inference-cloud
ok "Python dependencies installed"

# ── 5. Frontend deps ──
info "Installing frontend dependencies..."
(cd frontend && npm install --silent 2>/dev/null || npm install)
ok "Frontend dependencies installed"

# ── 6. Backend ──
info "Starting backend API server on port 8000..."
uv run freya serve --port 8000 &
CLEANUP_PIDS+=($!)
sleep 3

if curl -sf http://localhost:8000/health &>/dev/null; then
  ok "Backend running at http://localhost:8000"
else
  warn "Backend may still be starting..."
fi

# ── 7. Frontend ──
info "Starting frontend on port 5173..."
(cd frontend && npm run dev) &
CLEANUP_PIDS+=($!)
sleep 3
ok "Frontend running at http://localhost:5173"

# ── 8. Browser ──
URL="http://localhost:5173"
info "Opening $URL ..."
case "$(uname -s)" in
  Darwin) open "$URL" ;;
  Linux)  xdg-open "$URL" 2>/dev/null || true ;;
  MINGW*|MSYS*|CYGWIN*) cmd /c start "" "$URL" 2>/dev/null || true ;;
  *)      true ;;
esac

echo ""
echo -e "${GREEN}${BOLD}  Freya is running!${NC}"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo ""
echo "  On first launch, you'll be guided through cloud API key setup."
echo "  No local models required — bring your own OpenAI / Anthropic /"
echo "  DeepSeek / Groq / OpenRouter API keys."
echo ""
echo "  Press Ctrl+C to stop all services."
echo ""

wait
