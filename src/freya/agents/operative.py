"""OperativeAgent — persistent, scheduled agent for autonomous operation.

Extends ToolUsingAgent with built-in session persistence and state recall.
Designed for Operators: autonomous agents that run on a schedule with
automatic state management between ticks.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, List, Optional

from freya.agents._stubs import AgentContext, AgentResult, ToolUsingAgent
from freya.core.events import EventBus
from freya.core.registry import AgentRegistry
from freya.core.types import Message, Role, ToolCall, ToolResult
from freya.engine._stubs import InferenceEngine
from freya.tools._stubs import BaseTool

logger = logging.getLogger(__name__)


@AgentRegistry.register("operative")
class OperativeAgent(ToolUsingAgent):
    """Persistent autonomous agent with built-in state management.

    The Operative agent extends the standard tool-calling loop with:

    1. **Session loading** — restores conversation history from previous ticks.
    2. **State recall** — retrieves previous state JSON from memory backend.
    3. **System prompt** — injects the operator's protocol instructions.
    4. **Tool loop** — standard function-calling loop (same as Orchestrator).
    5. **Session save** — persists the tick's prompt and response.
    6. **State persistence** — auto-persists state if the agent didn't do it
       explicitly via memory_store tool.
    """

    agent_id = "operative"
    accepts_tools = True
    _default_temperature = 0.3
    _default_max_tokens = 2048
    _default_max_turns = 20

    def __init__(
        self,
        engine: InferenceEngine,
        model: str,
        *,
        tools: Optional[List[BaseTool]] = None,
        bus: Optional[EventBus] = None,
        max_turns: Optional[int] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
        operator_id: Optional[str] = None,
        session_store: Optional[Any] = None,
        memory_backend: Optional[Any] = None,
        interactive: bool = False,
        confirm_callback=None,
        **kwargs: Any,
    ) -> None:
        super().__init__(
            engine,
            model,
            tools=tools,
            bus=bus,
            max_turns=max_turns,
            temperature=temperature,
            max_tokens=max_tokens,
            interactive=interactive,
            confirm_callback=confirm_callback,
            prompt_builder=kwargs.get("prompt_builder"),
        )
        self._system_prompt = system_prompt or ""
        self._operator_id = operator_id
        self._session_store = session_store
        self._memory_backend = memory_backend

    def run(
        self,
        input: str,
        context: Optional[AgentContext] = None,
        **kwargs: Any,
    ) -> AgentResult:
        """Execute a single operator tick."""
        self._emit_turn_start(input)

        # 1. Build system prompt with state context
        sys_parts: list[str] = []
        if self._system_prompt:
            sys_parts.append(self._system_prompt)

        # 2. State recall from memory backend
        previous_state = self._recall_state()
        if previous_state:
            sys_parts.append(f"\n## Previous State\n{previous_state}")

        # 3. Prompt-based tool definitions (fallback for models without native tool calling)
        prompt_tools = self._get_prompt_tool_defs()

        system_prompt = "\n\n".join(sys_parts) if sys_parts else None
        # Honor SOUL.md / MEMORY.md / USER.md persona files like `freya ask`,
        # appended so the operative's own instructions are preserved (#376).
        system_prompt = self._apply_persona(system_prompt)

        # Append prompt-based tool definitions to system prompt
        if prompt_tools:
            system_prompt = (system_prompt or "") + "\n\n" + prompt_tools

        # 4. Load session history
        session_messages = self._load_session()

        # 5. Build messages
        messages = self._build_operative_messages(
            input,
            context,
            system_prompt=system_prompt,
            session_messages=session_messages,
        )

        # 6. Run function-calling tool loop
        openai_tools = self._executor.get_openai_tools() if self._tools else []
        all_tool_results: list[ToolResult] = []
        turns = 0
        content = ""
        state_stored_by_tool = False
        total_usage: dict[str, int] = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        }

        for _turn in range(self._max_turns):
            turns += 1

            if self._loop_guard:
                messages = self._loop_guard.compress_context(messages)

            gen_kwargs: dict[str, Any] = {}
            if openai_tools:
                gen_kwargs["tools"] = openai_tools

            result = self._generate(messages, **gen_kwargs)
            usage = result.get("usage", {})
            for k in total_usage:
                total_usage[k] += usage.get(k, 0)
            content = result.get("content", "")
            raw_tool_calls = result.get("tool_calls", [])

            # Fallback: parse prompt-based XML tool calls if native tools didn't fire
            if not raw_tool_calls and content:
                parsed = self._parse_prompt_tool_calls(content)
                if parsed:
                    raw_tool_calls = [
                        {
                            "id": f"prompt_{i}",
                            "name": tc["name"],
                            "arguments": json.dumps(tc.get("parameters", {})),
                        }
                        for i, tc in enumerate(parsed)
                    ]

            if not raw_tool_calls:
                content = self._check_continuation(result, messages)
                break

            tool_calls = [
                ToolCall(
                    id=tc.get("id", f"call_{i}"),
                    name=tc.get("name", ""),
                    arguments=tc.get("arguments", "{}"),
                )
                for i, tc in enumerate(raw_tool_calls)
            ]

            messages.append(
                Message(
                    role=Role.ASSISTANT,
                    content=content,
                    tool_calls=tool_calls,
                )
            )

            for tc in tool_calls:
                # Loop guard check
                if self._loop_guard:
                    verdict = self._loop_guard.check_call(tc.name, tc.arguments)
                    if verdict.blocked:
                        tool_result = ToolResult(
                            tool_name=tc.name,
                            content=f"Loop guard: {verdict.reason}",
                            success=False,
                        )
                        all_tool_results.append(tool_result)
                        messages.append(
                            Message(
                                role=Role.TOOL,
                                content=tool_result.content,
                                tool_call_id=tc.id,
                                name=tc.name,
                            )
                        )
                        continue

                tool_result = self._executor.execute(tc)
                all_tool_results.append(tool_result)

                # Track if agent stored state via memory_store
                if tc.name == "memory_store" and self._operator_id:
                    try:
                        args = json.loads(tc.arguments)
                        state_key = f"operator:{self._operator_id}:state"
                        if args.get("key", "") == state_key:
                            state_stored_by_tool = True
                    except (json.JSONDecodeError, TypeError):
                        pass

                messages.append(
                    Message(
                        role=Role.TOOL,
                        content=tool_result.content,
                        tool_call_id=tc.id,
                        name=tc.name,
                    )
                )
        else:
            # Max turns exceeded
            self._save_session(input, content)
            meta = dict(total_usage)
            meta["max_turns_exceeded"] = True
            return AgentResult(
                content=content or "Maximum turns reached without a final answer.",
                tool_results=all_tool_results,
                turns=turns,
                metadata=meta,
            )

        # 6. Save session
        self._save_session(input, content)

        # 7. Auto-persist state if agent didn't do it explicitly
        if not state_stored_by_tool:
            self._auto_persist_state(content)

        self._emit_turn_end(turns=turns, content_length=len(content))
        return AgentResult(
            content=content,
            tool_results=all_tool_results,
            turns=turns,
            metadata=total_usage,
        )

    def _build_operative_messages(
        self,
        input: str,
        context: Optional[AgentContext],
        *,
        system_prompt: Optional[str] = None,
        session_messages: Optional[list[Message]] = None,
    ) -> list[Message]:
        """Build message list with system prompt, session history, and input."""
        messages: list[Message] = []
        if system_prompt:
            messages.append(Message(role=Role.SYSTEM, content=system_prompt))
        # Inject session history (recent messages from previous ticks)
        if session_messages:
            messages.extend(session_messages)
        # Context conversation (e.g. memory injection)
        if context and context.conversation.messages:
            messages.extend(context.conversation.messages)
        messages.append(Message(role=Role.USER, content=input))
        return messages

    def _get_prompt_tool_defs(self) -> str:
        """Build prompt-based tool definitions for models without native tool calling.

        Returns XML-formatted tool instructions that teach the model to output
        <execute_tool> blocks, compatible with any LLM (DeepSeek, Groq, etc).
        """
        if not self._tools:
            return ""

        tool_lines: list[str] = []
        tool_lines.append("## FORMAT PEMANGGILAN TOOL (XML):")
        tool_lines.append("Setiap kali menggunakan tool, output HARUS dalam format:")
        tool_lines.append("<execute_tool>")
        tool_lines.append("<tool_name>nama_tool</tool_name>")
        tool_lines.append("<parameters>{\"param\": \"value\"}</parameters>")
        tool_lines.append("</execute_tool>")
        tool_lines.append("")
        tool_lines.append("Daftar tool yang tersedia:")
        for tool in self._tools:
            name = getattr(tool, "name", getattr(tool, "__class__", tool).__name__)
            desc = getattr(tool, "description", "")[:120]
            tool_lines.append(f"- {name}: {desc}")
        tool_lines.append("")
        tool_lines.append("JANGAN pakai markdown codeblock untuk XML tool call.")
        return "\n".join(tool_lines)

    def _parse_prompt_tool_calls(self, content: str) -> list[dict] | None:
        """Parse <execute_tool> XML blocks from model response text.

        Returns list of {name, parameters} dicts, or None if no tools found.
        """
        pattern = (
            r'<execute_tool>\s*<tool_name>(.*?)</tool_name>\s*'
            r'<parameters>\s*(.*?)\s*</parameters>\s*</execute_tool>'
        )
        matches = re.findall(pattern, content, re.DOTALL)
        if not matches:
            return None
        tools = []
        for name, params_str in matches:
            try:
                params = json.loads(params_str.strip())
                tools.append({"name": name.strip(), "parameters": params})
            except json.JSONDecodeError:
                continue
        return tools if tools else None

    def _recall_state(self) -> str:
        """Retrieve previous operator state from memory backend."""
        if not self._memory_backend or not self._operator_id:
            return ""
        state_key = f"operator:{self._operator_id}:state"
        try:
            result = self._memory_backend.retrieve(state_key)
            if result:
                return result if isinstance(result, str) else str(result)
        except Exception:
            logger.debug("No previous state for operator %s", self._operator_id)
        return ""

    def _load_session(self) -> list[Message]:
        """Load recent session history for this operator."""
        if not self._session_store or not self._operator_id:
            return []
        session_id = f"operator:{self._operator_id}"
        try:
            session = self._session_store.get_or_create(session_id)
            if hasattr(session, "messages") and session.messages:
                # Return last 10 messages to avoid context overflow
                recent = session.messages[-10:]
                return [
                    Message(
                        role=Role(m.get("role", "user")),
                        content=m.get("content", ""),
                    )
                    for m in recent
                    if isinstance(m, dict)
                ]
        except Exception:
            logger.debug("Could not load session for operator %s", self._operator_id)
        return []

    def _save_session(self, input_text: str, response: str) -> None:
        """Save the tick's prompt and response to the session store."""
        if not self._session_store or not self._operator_id:
            return
        session_id = f"operator:{self._operator_id}"
        try:
            self._session_store.save_message(
                session_id,
                {"role": "user", "content": input_text},
            )
            self._session_store.save_message(
                session_id,
                {"role": "assistant", "content": response},
            )
        except Exception:
            logger.debug("Could not save session for operator %s", self._operator_id)

    def _auto_persist_state(self, content: str) -> None:
        """Auto-persist a state summary if the agent didn't store state explicitly."""
        if not self._memory_backend or not self._operator_id:
            return
        state_key = f"operator:{self._operator_id}:state"
        try:
            # Store a summary of the agent's response as state
            summary = content[:1000] if content else ""
            self._memory_backend.store(state_key, summary)
        except Exception:
            logger.debug(
                "Could not auto-persist state for operator %s",
                self._operator_id,
            )


__all__ = ["OperativeAgent"]
