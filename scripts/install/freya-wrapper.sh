#!/usr/bin/env bash
# freya-wrapper.sh — symlinked to ~/.local/bin/freya.
# Activates the managed venv and execs the real freya CLI.

FREYA_HOME="${FREYA_HOME:-$HOME/.freya}"
VENV="$FREYA_HOME/.venv"

if [[ ! -d "$VENV" ]]; then
    echo "freya: venv not found at $VENV" >&2
    echo "Re-run the installer: curl -fsSL https://freya.github.io/Freya/install.sh | bash" >&2
    exit 1
fi

exec "$VENV/bin/freya" "$@"
