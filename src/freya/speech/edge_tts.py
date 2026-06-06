"""Edge TTS backend — free cloud TTS via Microsoft Edge TTS API.

Uses edge-tts CLI for zero-latency synthesis (avoids Python async overhead).
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path
from typing import List

from freya.core.registry import TTSRegistry
from freya.speech.tts import TTSBackend, TTSResult


@TTSRegistry.register("edge")
class EdgeTTSBackend(TTSBackend):
    """Text-to-speech using Microsoft Edge's free TTS API.

    Uses edge-tts CLI subprocess for minimal latency (~200ms for short text).
    """

    VOICES = [
        "id-ID-GadisNeural",
        "id-ID-ArdiNeural",
        "en-US-JennyNeural",
        "en-US-GuyNeural",
        "ja-JP-NanamiNeural",
        "zh-CN-XiaoxiaoNeural",
    ]

    def __init__(self, voice: str = "id-ID-GadisNeural", speed: float = 1.0):
        self._voice = voice
        self._speed = speed

    @property
    def available(self) -> bool:
        try:
            subprocess.run(["edge-tts", "--version"], capture_output=True, timeout=3)
            return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def list_voices(self) -> List[str]:
        return self.VOICES

    def synthesize(
        self, text: str, voice: str | None = None, speed: float | None = None
    ) -> TTSResult:
        """Synthesize text to speech using edge-tts CLI (fast subprocess)."""
        selected_voice = voice or self._voice
        selected_speed = speed if speed is not None else self._speed

        rate = f"{int(selected_speed * 100 - 100):+d}%"

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            out_path = f.name

        try:
            subprocess.run(
                [
                    "edge-tts",
                    "--voice", selected_voice,
                    "--rate", rate,
                    "--text", text,
                    "--write-media", out_path,
                ],
                capture_output=True,
                timeout=30,
                check=True,
            )
            audio_data = Path(out_path).read_bytes()
        finally:
            try:
                Path(out_path).unlink()
            except OSError:
                pass

        return TTSResult(
            audio=audio_data,
            format="mp3",
            voice=selected_voice,
        )

    @property
    def default_voice(self) -> str:
        return self._voice
