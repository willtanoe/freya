#!/usr/bin/env bash
# install.sh — Freya cloud-first installer (macOS / Linux / WSL2)
#
# Usage:
#   curl -fsSL https://willtanoe.github.io/freya/install.sh | bash
#
# Flags:
#   --force    Re-run all steps even if already done

set -euo pipefail

FORCE=0
for arg in "$@"; do
    case "$arg" in
        --force) FORCE=1 ;;
        *) echo "install.sh: unknown arg: $arg" >&2; exit 2 ;;
    esac
done

# ── Non-WSL Windows refusal ──
case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*|CYGWIN*)
        cat >&2 <<'EOF'
install.sh: native Windows (Git Bash / MSYS2) is not supported.
Use install.ps1 for native Windows PowerShell, or WSL2 for Linux support.
EOF
        exit 1
        ;;
esac

# ── Root refusal ──
if [[ "$(id -u)" -eq 0 ]]; then
    echo "install.sh: don't run as root. Re-run as your regular user." >&2
    exit 1
fi

# ── Helpers ──
info()  { echo "[info]  $*"; }
ok()    { echo "[ok]    $*"; }
warn()  { echo "[warn]  $*"; }
fail()  { echo "[fail]  $*" >&2; exit 1; }

need() {
    if command -v "$1" >/dev/null 2>&1; then return 0; fi
    case "$(uname -s)" in
        Darwin)
            if [[ -z "${SSH_TTY:-}" ]]; then
                xcode-select --install 2>/dev/null || true
                local waited=0
                while ! command -v "$1" >/dev/null 2>&1; do
                    if (( waited >= 300 )); then fail "'$1' still missing after 5 min"; fi
                    sleep 5; waited=$((waited + 5))
                done
            else
                fail "'$1' not found in headless SSH. Install manually then re-run."
            fi
            ;;
        Linux)
            if command -v apt-get >/dev/null 2>&1; then
                sudo apt-get update -q || true; sudo apt-get install -y "$1"
            elif command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y "$1"
            elif command -v pacman >/dev/null 2>&1; then
                sudo pacman -S --noconfirm "$1"
            else
                fail "'$1' not found and no supported package manager detected."
            fi
            ;;
        *) fail "'$1' not found." ;;
    esac
}

# ── Env ──
FREYA_HOME="${FREYA_HOME:-$HOME/.freya}"
FREYA_REPO_URL="${FREYA_REPO_URL:-https://github.com/willtanoe/freya.git}"
SRC_DIR="$FREYA_HOME/src"
STATE_DIR="$FREYA_HOME/.state"
STATE_FILE="$STATE_DIR/install-state.json"

mkdir -p "$FREYA_HOME" "$STATE_DIR"

state_done() { [[ -f "$STATE_FILE" ]] && grep -q "\"$1\":[[:space:]]*true" "$STATE_FILE"; }
mark_done() {
    local key="$1"
    if state_done "$key"; then return 0; fi
    if [[ ! -f "$STATE_FILE" ]] || [[ ! -s "$STATE_FILE" ]]; then echo '{}' > "$STATE_FILE"; fi
    local tmp="${STATE_FILE}.tmp.$$"
    awk -v k="$key" '
    BEGIN { printf "{\n" }
    END   { printf "  \"%s\": true\n}\n", k }
    ' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

step() {
    local name="$1" desc="$2"; shift 2
    if [[ "$FORCE" -ne 1 ]] && state_done "$name"; then
        ok "$desc (already done)"; return 0
    fi
    info "$desc"
    "$@"
    mark_done "$name"
    ok "$desc"
}

# ── 1. Prereqs ──
need git
need curl

PY_CMD="python3"
command -v python3 >/dev/null 2>&1 || PY_CMD="python"
if ! command -v "$PY_CMD" >/dev/null 2>&1; then
    fail "Python 3 not found. Install from https://python.org"
fi
ok "Python found ($PY_CMD)"

# ── 2. uv ──
install_uv() {
    if command -v uv >/dev/null 2>&1; then return 0; fi
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
}

# ── 3. Node.js ──
check_node() {
    if command -v node >/dev/null 2>&1; then
        local v; v=$(node --version | sed 's/v//' | cut -d. -f1)
        if [[ "$v" -ge 18 ]]; then return 0; fi
    fi
    warn "Node.js 18+ not found. Install from https://nodejs.org"
    warn "Frontend won't build until Node.js is installed."
}

# ── 4. Clone ──
clone_repo() {
    if [[ -d "$SRC_DIR/.git" ]]; then
        if [[ "$FORCE" -eq 1 ]]; then
            git -C "$SRC_DIR" pull --ff-only
        else
            echo "    repo already at $SRC_DIR"
        fi
        return 0
    fi
    git clone --depth 1 "$FREYA_REPO_URL" "$SRC_DIR"
}

# ── 5. Python deps ──
install_python_deps() {
    cd "$SRC_DIR"
    uv sync --extra server --extra inference-cloud
}

# ── 6. Frontend deps ──
install_frontend_deps() {
    if [[ -d "$SRC_DIR/frontend" ]]; then
        cd "$SRC_DIR/frontend"
        npm install --silent 2>/dev/null || npm install
    fi
}

# ── 7. CLI symlink ──
install_symlink() {
    mkdir -p "$HOME/.local/bin"
    local wrapper="$HOME/.local/bin/freya"
    cat > "$wrapper" <<'WRAPPER'
#!/usr/bin/env bash
SRC="$HOME/.freya/src"
exec uv run --project "$SRC" freya "$@"
WRAPPER
    chmod +x "$wrapper"

    case ":$PATH:" in
        *":$HOME/.local/bin:"*) ;;
        *)
            local rc="$HOME/.bashrc"
            [[ "$SHELL" == */zsh ]] && rc="$HOME/.zshrc"
            if ! grep -q "Freya" "$rc" 2>/dev/null; then
                echo '' >> "$rc"
                echo '# Freya' >> "$rc"
                echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc"
            fi
            ;;
    esac
}

# ── Run ──
echo "Freya cloud-first installer"
echo "  install dir: $FREYA_HOME"
echo

step install_uv             "Install uv"                install_uv
step check_node             "Check Node.js"             check_node
step clone_repo             "Clone repository"          clone_repo
step install_python_deps    "Install Python deps"       install_python_deps
step install_frontend_deps  "Install frontend deps"     install_frontend_deps
step install_symlink        "Install CLI symlink"       install_symlink

echo
echo "Done! Start the backend:"
echo "  freya serve"
echo
echo "In another terminal, start the frontend:"
echo "  cd $SRC_DIR/frontend && npm run dev"
echo
echo "Then open http://localhost:5173 and configure your cloud API keys."
echo
