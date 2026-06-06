from __future__ import annotations

from pathlib import Path

from freya.core.config import MemoryFilesConfig, SystemPromptConfig


def test_base_agent_uses_builder(tmp_path: Path):
    soul = tmp_path / "SOUL.md"
    soul.write_text("I am Freya.")
    memory = tmp_path / "MEMORY.md"
    memory.write_text("- User likes Python")

    from freya.prompt.builder import SystemPromptBuilder

    builder = SystemPromptBuilder(
        agent_template="You are a helpful assistant.",
        memory_files_config=MemoryFilesConfig(
            soul_path=str(soul),
            memory_path=str(memory),
            user_path=str(tmp_path / "USER.md"),
        ),
        system_prompt_config=SystemPromptConfig(),
    )
    prompt = builder.build()
    assert "Freya" in prompt
    assert "Python" in prompt
    assert "helpful assistant" in prompt
