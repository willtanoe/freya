<div align="center">
  <img alt="Freya" src="assets/freya_landscape.png" width="400">

  <p><i>Personal AI, On Personal Devices.</i></p>
</div>

---

## Credits

Freya is a community fork of **[OpenJarvis](https://github.com/open-jarvis/OpenJarvis)** — a research project from the [Scaling Intelligence Lab](https://scalingintelligence.stanford.edu/) at Stanford SAIL, developed at [Hazy Research](https://hazyresearch.stanford.edu/) as part of the [Intelligence Per Watt](https://www.intelligence-per-watt.ai/) initiative.

**Original authors:** Jon Saad-Falcon, Avanika Narayan, Robby Manihani, Tanvir Bhathal, Herumb Shandilya, Hakki Orhun Akengin, Gabriel Bo, Andrew Park, Matthew Hart, Caia Costello, Chuan Li, Christopher Ré, Azalia Mirhoseini.

**Paper:** [OpenJarvis: Personal AI, On Personal Devices](https://arxiv.org/abs/2605.17172) (arXiv:2605.17172)

Fork maintained by **[Willtanoe](https://github.com/willtanoe)**.

## Cara Pakai

### Install

```powershell
# Windows
irm https://willtanoe.github.io/freya/install.ps1 | iex
```

```bash
# macOS / Linux / WSL2
curl -fsSL https://willtanoe.github.io/freya/install.sh | bash
```

### Commands

```bash
freya                          # mulai chat (default: chat-simple)
freya ask "pertanyaan"         # tanya langsung
freya serve                    # jalanin web server (localhost:8000)
freya doctor                   # cek status
freya init --preset <nama>     # ganti preset konfigurasi
```

Preset yang tersedia: `chat-simple`, `code-assistant`, `deep-research`, `morning-digest-mac`, `morning-digest-linux`, `morning-digest-minimal`, `scheduled-monitor`

### Development

```bash
git clone https://github.com/willtanoe/freya.git
cd freya
uv sync --extra dev
uv run pre-commit install
uv run pytest tests/ -v
```

## License

[Apache 2.0](LICENSE)
