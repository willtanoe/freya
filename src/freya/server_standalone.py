"""Freya Server — standalone entry point for PyInstaller bundling."""
import logging
import sys

import uvicorn
from rich.console import Console

from freya.core.config import load_config
from freya.core.events import EventBus
from freya.engine import discover_engines, discover_models, get_engine
from freya.intelligence import merge_discovered_models, register_builtin_models
from freya.server.app import create_app

logger = logging.getLogger(__name__)


def main() -> None:
    console = Console(stderr=True)

    try:
        from fastapi import FastAPI  # noqa: F401
    except ImportError:
        console.print("[red bold]Server dependencies not installed.[/red bold]")
        sys.exit(1)

    config = load_config()

    # Set up engine
    register_builtin_models()
    bus = EventBus(record_history=False)

    resolved = get_engine(config)
    if resolved is None:
        console.print("[red bold]No inference engine available.[/red bold]")
        sys.exit(1)

    engine_name, engine = resolved

    # Discover models
    all_engines = discover_engines(config)
    all_models = discover_models(all_engines)
    for ek, model_ids in all_models.items():
        merge_discovered_models(ek, model_ids)

    # Resolve model
    model_name = config.server.model or config.intelligence.default_model
    if not model_name:
        engine_models = all_models.get(engine_name, [])
        if engine_models:
            model_name = engine_models[0]
        else:
            console.print("[red]No model available on engine.[/red]")
            sys.exit(1)

    # Resolve agent
    agent = None
    agent_key = config.server.agent
    if agent_key:
        try:
            import freya.agents  # noqa: F401
            from freya.core.registry import AgentRegistry

            if AgentRegistry.contains(agent_key):
                agent_cls = AgentRegistry.get(agent_key)
                agent = agent_cls(engine, model_name, bus=bus)
        except Exception as exc:
            logger.debug("Agent init failed: %s", exc)

    # Speech backend
    speech_backend = None
    try:
        from freya.speech._discovery import get_speech_backend

        speech_backend = get_speech_backend(config)
    except Exception as exc:
        logger.debug("Speech backend init failed: %s", exc)

    # Memory backend
    memory_backend = None
    try:
        import freya.tools.storage  # noqa: F401
        from freya.core.registry import MemoryRegistry

        if config.agent.context_from_memory:
            mem_key = config.memory.default_backend
            if MemoryRegistry.contains(mem_key):
                memory_backend = MemoryRegistry.create(
                    mem_key, db_path=config.memory.db_path,
                )
    except Exception as exc:
        logger.debug("Memory backend init failed: %s", exc)

    # Agent manager + scheduler
    agent_manager = None
    agent_scheduler = None
    if config.agent_manager.enabled:
        try:
            from pathlib import Path

            from freya.agents.manager import AgentManager

            am_db = config.agent_manager.db_path or str(
                Path("~/.freya/agents.db").expanduser()
            )
            agent_manager = AgentManager(db_path=am_db, clear_stale_running=True)

            from freya.agents.executor import AgentExecutor
            from freya.agents.scheduler import AgentScheduler

            executor = AgentExecutor(manager=agent_manager, event_bus=bus)
            from freya.system import SystemBuilder

            system = SystemBuilder(config).build()
            executor.set_system(system)

            agent_scheduler = AgentScheduler(
                manager=agent_manager, executor=executor, event_bus=bus,
            )
            for ag in agent_manager.list_agents():
                sched_type = ag.get("config", {}).get("schedule_type", "manual")
                if sched_type in ("cron", "interval") and ag["status"] not in (
                    "archived", "error",
                ):
                    agent_scheduler.register_agent(ag["id"])
            agent_scheduler.start()
        except Exception as exc:
            logger.debug("Agent scheduler init failed: %s", exc)

    # API key
    import os

    api_key = os.environ.get("FREYA_API_KEY", "")
    if not api_key:
        try:
            import tomllib

            _cfg_path = str(
                __import__("pathlib").Path.home() / ".freya" / "config.toml"
            )
            with open(_cfg_path, "rb") as _f:
                _raw = tomllib.load(_f)
            api_key = _raw.get("server", {}).get("auth", {}).get("api_key", "")
        except (FileNotFoundError, ImportError):
            pass

    webhook_config = {
        "twilio_auth_token": os.environ.get("TWILIO_AUTH_TOKEN", ""),
        "bluebubbles_password": os.environ.get("BLUEBUBBLES_PASSWORD", ""),
        "whatsapp_verify_token": os.environ.get("WHATSAPP_VERIFY_TOKEN", ""),
        "whatsapp_app_secret": os.environ.get("WHATSAPP_APP_SECRET", ""),
    }

    app = create_app(
        engine,
        model_name,
        agent=agent,
        bus=bus,
        engine_name=engine_name,
        agent_name=agent_key or "",
        config=config,
        memory_backend=memory_backend,
        speech_backend=speech_backend,
        agent_manager=agent_manager,
        agent_scheduler=agent_scheduler,
        api_key=api_key,
        webhook_config=webhook_config,
        cors_origins=config.server.cors_origins,
    )

    console.print(
        f"[green]Starting Freya API server[/green]\n"
        f"  Engine: [cyan]{engine_name}[/cyan]\n"
        f"  Model:  [cyan]{model_name}[/cyan]\n"
        f"  Agent:  [cyan]{agent_key or 'none'}[/cyan]\n"
        f"  URL:    [cyan]http://{config.server.host}:{config.server.port}[/cyan]"
    )

    uvicorn.run(
        app,
        host=config.server.host,
        port=config.server.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
