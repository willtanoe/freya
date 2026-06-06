<div align="center">
  <img alt="Freya" src="assets/freya_landscape.png" width="400">

  <p><i>Personal AI, On Personal Devices.</i></p>

  <p>
    <a href="https://scalingintelligence.stanford.edu/blogs/freya/"><img src="https://img.shields.io/badge/project-Freya-blue" alt="Project"></a>
    <a href="https://willtanoe.github.io/freya/"><img src="https://img.shields.io/badge/docs-mkdocs-blue" alt="Docs"></a>
    <img src="https://img.shields.io/badge/python-%3E%3D3.10-blue" alt="Python">
    <img src="https://img.shields.io/badge/license-Apache%202.0-green" alt="License">
    <a href="https://discord.gg/6ZtCB94h5p"><img src="https://img.shields.io/badge/discord-join-7289da?logo=discord&logoColor=white" alt="Discord"></a>
    <a href="https://x.com/FreyaAI"><img src="https://img.shields.io/badge/X-@FreyaAI-black?logo=x&logoColor=white" alt="X / Twitter"></a>
  </p>
</div>

---

---

> **[Documentation](https://willtanoe.github.io/freya/)**
>
> **[Project Site](https://scalingintelligence.stanford.edu/blogs/freya/)**
>
> **[Leaderboard](https://willtanoe.github.io/freya/leaderboard/)**
>
> **[Roadmap](https://willtanoe.github.io/freya/development/roadmap/)**

## Why Freya?

Personal AI agents are exploding in popularity, but nearly all of them still route intelligence through cloud APIs. Your "personal" AI continues to depend on someone else's server. At the same time, our [Intelligence Per Watt](https://www.intelligence-per-watt.ai/) research showed that local language models already handle 88.7% of single-turn chat and reasoning queries, with intelligence efficiency improving 5.3× from 2023 to 2025. The models and hardware are increasingly ready. What has been missing is the software stack to make local-first personal AI practical.

Freya is that stack. It is a framework for local-first personal AI, built around three core ideas: shared primitives for building on-device agents; evaluations that treat energy, FLOPs, latency, and dollar cost as first-class constraints alongside accuracy; and a learning loop that improves models using local trace data. The goal is simple: make it possible to build personal AI agents that run locally by default, calling the cloud only when truly necessary. Freya aims to be both a research platform and a production foundation for local AI, in the spirit of PyTorch.

## Installation

Pick your platform and run one command. Each installer handles [uv](https://docs.astral.sh/uv/), the Python venv, Ollama, and a starter model — about 3 minutes on broadband.

| Platform | One-liner |
|---|---|
| **macOS · Linux · WSL2** | `curl -fsSL https://willtanoe.github.io/freya/install.sh \| bash` |
| **Native Windows** | `irm https://willtanoe.github.io/freya/install.ps1 \| iex` |
| **Desktop GUI** | Download `.exe` / `.dmg` / `.deb` / `.rpm` / `.AppImage` from the [latest release](https://github.com/willtanoe/freya/releases) |

Then `freya` to start. The Rust extension and larger models continue downloading in the background; `freya doctor` shows status.

Platform-specific notes (WSL2 setup, native-Windows scheduled-task service, desktop prerequisites, manual / contributor install): see the [installation docs](https://willtanoe.github.io/freya/getting-started/install/).

## Quick Start

```bash
freya                          # start chatting (default: chat-simple)
freya init --preset <name>     # switch to a starter config
```

> Prefix `freya ...` with `uv run`, or `source .venv/bin/activate` first.

| Preset | What it does |
|---|---|
| `morning-digest-mac` / `morning-digest-linux` / `morning-digest-minimal` | Spoken daily briefing from email, calendar, health, news |
| `deep-research` | Multi-hop research across indexed docs with citations |
| `code-assistant` | Agent with code execution, file I/O, and shell access |
| `scheduled-monitor` | Stateful agent on a schedule with memory |
| `chat-simple` | Lightweight conversation, no tools |

Example:

```bash
freya init --preset morning-digest-mac
freya connect gdrive          # one OAuth covers Gmail / Calendar / Tasks
freya digest --fresh          # generate and play your first briefing
```

Per-preset deep dives: [morning digest](https://willtanoe.github.io/freya/user-guide/morning-digest/) · [deep research](https://willtanoe.github.io/freya/user-guide/deep-research/) · [code assistant](https://willtanoe.github.io/freya/user-guide/code-assistant/) · [scheduled monitor](https://willtanoe.github.io/freya/user-guide/scheduled-monitor/) · [chat simple](https://willtanoe.github.io/freya/user-guide/chat-simple/) · or the full [quickstart guide](https://willtanoe.github.io/freya/getting-started/quickstart/).

### Skills

Skills teach agents how to better use tools and improve their reasoning. Every skill is a tool — agents discover them from a catalog and invoke them on demand.

```bash
# Install skills from public sources
freya skill install hermes:arxiv
freya skill sync hermes --category research

# Use skills with any agent
freya ask "Use the code-explainer skill to explain this Python code: for i in range(5): print(i*2)"

# Optimize skills from your trace history
freya optimize skills --policy dspy

# Benchmark the impact
freya bench skills --max-samples 5 --seeds 42
```

Import from [Hermes Agent](https://github.com/NousResearch/hermes-agent) (~150 skills), [OpenClaw](https://github.com/openclaw/skills) (~13,700 community skills), or any GitHub repo. Skills follow the [agentskills.io](https://agentskills.io/specification) open standard.

See the [Skills User Guide](https://willtanoe.github.io/freya/user-guide/skills/) and [Skills Tutorial](https://willtanoe.github.io/freya/tutorials/skills-workflow/) for details.

### Built-in Agents

Freya ships with eight built-in agents across three execution modes (on-demand, scheduled, continuous):

| Agent | Type | What it does |
|-------|------|-------------|
| `morning_digest` | Scheduled | Daily briefing from email, calendar, health, news — with TTS audio |
| `deep_research` | On-demand | Multi-hop research with citations across web and local docs |
| `monitor_operative` | Continuous | Long-horizon monitoring with memory, compression, and retrieval |
| `orchestrator` | On-demand | Multi-turn reasoning with automatic tool selection |
| `native_react` | On-demand | ReAct (Thought-Action-Observation) loop agent |
| `operative` | Continuous | Persistent autonomous agent with state management |
| `native_openhands` | On-demand | CodeAct — generates and executes Python code |
| `simple` | On-demand | Single-turn chat, no tools |

See the [User Guide](https://willtanoe.github.io/freya/user-guide/morning-digest/) and [Tutorials](https://willtanoe.github.io/freya/tutorials/) for detailed setup instructions.

Full documentation — including Docker deployment, cloud engines, development setup, and tutorials — at **[freya-ai.github.io/Freya](https://willtanoe.github.io/freya/)**.

## Community

- **GitHub:** [github.com/freya-ai/Freya](https://github.com/willtanoe/freya)
- **Discord:** [discord.gg/YZZRxCAhmm](https://discord.gg/YZZRxCAhmm)
- **X / Twitter:** [@FreyaAI](https://x.com/FreyaAI)
- **Docs:** [freya-ai.github.io/Freya](https://willtanoe.github.io/freya/)

## Contributing

We welcome contributions! See the [Contributing Guide](CONTRIBUTING.md) for incentives, contribution types, and the PR process.

Quick start for contributors:

```bash
git clone https://github.com/willtanoe/freya.git
cd Freya
uv sync --extra dev
uv run pre-commit install
uv run pytest tests/ -v
```

Browse the [Roadmap](https://willtanoe.github.io/freya/development/roadmap/) for areas where help is needed. Comment **"take"** on any issue to get auto-assigned.

## About

Freya is part of [Intelligence Per Watt](https://www.intelligence-per-watt.ai/), a research initiative studying the intelligence efficiency of AI systems. The project is developed at [Hazy Research](https://hazyresearch.stanford.edu/) and the [Scaling Intelligence Lab](https://scalingintelligence.stanford.edu/) at [Stanford SAIL](https://ai.stanford.edu/).

## Sponsors

<p>
  <a href="https://www.laude.org/">Laude Institute</a> &bull;
  <a href="https://datascience.stanford.edu/marlowe">Stanford Marlowe</a> &bull;
  <a href="https://cloud.google.com/">Google Cloud Platform</a> &bull;
  <a href="https://lambda.ai/">Lambda Labs</a> &bull;
  <a href="https://ollama.com/">Ollama</a> &bull;
  <a href="https://research.ibm.com/">IBM Research</a> &bull;
  <a href="https://hai.stanford.edu/">Stanford HAI</a>
</p>

## Citation
```bibtex
@misc{saadfalcon2026freyapersonalaipersonal,
      title={Freya: Personal AI, On Personal Devices}, 
      author={Jon Saad-Falcon and Avanika Narayan and Robby Manihani and Tanvir Bhathal and Herumb Shandilya and Hakki Orhun Akengin and Gabriel Bo and Andrew Park and Matthew Hart and Caia Costello and Chuan Li and Christopher Ré and Azalia Mirhoseini},
      year={2026},
      eprint={2605.17172},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/2605.17172}, 
}
```

## License

[Apache 2.0](LICENSE)

---

*Freya is a community fork of [OpenJarvis](https://github.com/open-jarvis/OpenJarvis) by [Willtanoe](https://github.com/willtanoe). We are grateful to the original OpenJarvis authors for their foundational work.*
