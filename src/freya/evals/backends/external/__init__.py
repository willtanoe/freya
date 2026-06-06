"""External-framework subprocess backends (Hermes Agent, OpenClaw)."""

from freya.evals.backends.external.hermes_agent import HermesBackend
from freya.evals.backends.external.openclaw import OpenClawBackend

__all__ = ["HermesBackend", "OpenClawBackend"]
