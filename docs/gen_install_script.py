"""Publish install scripts into the docs site.

Serves installers at:
    https://willtanoe.github.io/freya/install.sh   (Linux / macOS / WSL2)
    https://willtanoe.github.io/freya/install.ps1  (native Windows)

Canonical scripts live in docs/install.sh and docs/install.ps1.
"""

from pathlib import Path

import mkdocs_gen_files

_SCRIPTS = [
    (Path("docs/install.sh"), "install.sh"),
    (Path("docs/install.ps1"), "install.ps1"),
]

for src, dest in _SCRIPTS:
    if src.exists():
        with mkdocs_gen_files.open(dest, "wb") as out:
            out.write(src.read_bytes())
