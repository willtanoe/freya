"""Skill source resolvers — Hermes, OpenClaw, generic GitHub."""

from freya.skills.sources.base import ResolvedSkill, SourceResolver
from freya.skills.sources.github import GitHubResolver
from freya.skills.sources.hermes import HERMES_REPO_URL, HermesResolver
from freya.skills.sources.openclaw import OPENCLAW_REPO_URL, OpenClawResolver

__all__ = [
    "GitHubResolver",
    "HERMES_REPO_URL",
    "HermesResolver",
    "OPENCLAW_REPO_URL",
    "OpenClawResolver",
    "ResolvedSkill",
    "SourceResolver",
]
