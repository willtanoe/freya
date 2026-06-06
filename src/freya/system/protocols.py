"""Structural protocols for substituting fakes in place of FreyaSystem."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, List, Optional, Protocol

if TYPE_CHECKING:
    from freya.core.config import FreyaConfig
    from freya.core.events import EventBus
    from freya.engine._stubs import InferenceEngine
    from freya.security.capabilities import CapabilityPolicy
    from freya.sessions.session import SessionStore
    from freya.tools._stubs import BaseTool
    from freya.tools.storage._stubs import MemoryBackend
    from freya.traces.collector import TraceCollector
    from freya.traces.store import TraceStore


class OrchestratorDeps(Protocol):
    """Minimum surface of FreyaSystem that QueryOrchestrator depends on.

    Tests can satisfy this with a lightweight class — no need to construct
    the full FreyaSystem dataclass or materialize every subsystem.
    """

    config: FreyaConfig
    bus: EventBus
    engine: InferenceEngine
    engine_key: str
    model: str
    agent_name: str
    tools: List[BaseTool]
    memory_backend: Optional[MemoryBackend]
    capability_policy: Optional[CapabilityPolicy]
    session_store: Optional[SessionStore]
    trace_store: Optional[TraceStore]
    trace_collector: Optional[TraceCollector]  # written by _run_agent

    # Optional attribute (getattr with default) — declared for type clarity.
    _skill_few_shot_examples: Any
