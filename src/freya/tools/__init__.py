"""Tools primitive — tool system with ABC interface and built-in tools."""

from __future__ import annotations

from freya.tools._stubs import BaseTool, ToolExecutor, ToolSpec

# Import built-in tools to trigger @ToolRegistry.register() decorators.
# Each is wrapped in try/except so the package loads even before the
# individual tool modules are created.
try:
    import freya.tools.calculator  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.think  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.retrieval  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.llm_tool  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.file_read  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.web_search  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.code_interpreter  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.code_interpreter_docker  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.repl  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.storage_tools  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.mcp_adapter  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.channel_tools  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.http_request  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.docker_shell_exec  # noqa: F401
    import freya.tools.shell_exec  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.memory_manage  # noqa: F401
except ImportError:
    pass
try:
    import freya.tools.user_profile_manage  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.skill_manage  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.file_write  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.apply_patch  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.git_tool  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.db_query  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.pdf_tool  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.image_tool  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.audio_tool  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.knowledge_tools  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.text_to_speech  # noqa: F401
except ImportError:
    pass

try:
    import freya.tools.digest_collect  # noqa: F401
except ImportError:
    pass

__all__ = ["BaseTool", "ToolExecutor", "ToolSpec"]
