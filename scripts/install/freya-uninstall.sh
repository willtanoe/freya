#!/usr/bin/env bash
# freya-uninstall.sh — clean removal of Freya from $HOME.
#
# Removes:
#   ~/.freya/
#   ~/.local/bin/freya
#   ~/.local/bin/freya-uninstall
#
# Does NOT remove: ollama, uv, or the Rust toolchain.

set -euo pipefail

FREYA_HOME="${FREYA_HOME:-$HOME/.freya}"

if [[ -f "$FREYA_HOME/.state/bg.pid" ]]; then
    pid=$(cat "$FREYA_HOME/.state/bg.pid" 2>/dev/null || echo "")
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        echo "Stopping background work (pid=$pid)..."
        kill "$pid" 2>/dev/null || true
    fi
fi

if command -v ollama >/dev/null 2>&1; then
    ollama stop >/dev/null 2>&1 || true
fi

if [[ -d "$FREYA_HOME" ]]; then
    rm -rf "$FREYA_HOME"
    echo "Removed $FREYA_HOME"
fi

for f in "$HOME/.local/bin/freya" "$HOME/.local/bin/freya-uninstall"; do
    if [[ -L "$f" ]] || [[ -f "$f" ]]; then
        rm -f "$f"
        echo "Removed $f"
    fi
done

cat <<EOF

Freya removed.

Left intact (may be used by other tools):
  - Ollama       (uninstall: brew uninstall ollama  /  rm -f /usr/local/bin/ollama)
  - uv           (uninstall: rm -rf ~/.local/share/uv ~/.cargo/bin/uv)
  - Rust toolchain (uninstall: rustup self uninstall)
EOF
