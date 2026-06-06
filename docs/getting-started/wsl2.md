# WSL2 Install

Freya on Windows installs two ways: **WSL2** (this page — the
recommended path; identical to native Linux) or **[native Windows
(advanced)](windows-native.md)** (Phase-1; PowerShell installer, no
WSL2 / no Docker). Pick WSL2 for the smoothest experience.

## One-time WSL setup

In an admin PowerShell:

```powershell
wsl --install
```

Then open the Ubuntu (or Debian) shell that gets installed.

## Install Freya

```bash
curl -fsSL https://willtanoe.github.io/freya/install.sh | bash
```

About 3 minutes. Type `freya` to start.

## WSL-specific notes

- The installer detects WSL via `/proc/sys/kernel/osrelease` and uses `nohup freya serve &` instead of systemd to start the Freya server daemon (WSL2 doesn't ship systemd by default).
- The first time you run `freya`, the WSL kernel may show a "process running in background" notification — that's the bg-orchestrator detaching. It's expected.
- Models are stored in WSL's filesystem (`~/.freya/`), not your Windows drive. To free up space later: `freya-uninstall` removes everything.

## See also

- [Full installer reference](installation.md)
