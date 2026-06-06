"""Edge TTS backend — free cloud TTS via Microsoft Edge TTS API."""

from __future__ import annotations

import asyncio
import io
import tempfile
from typing import List

from freya.core.registry import TTSRegistry
from freya.speech.tts import TTSBackend, TTSResult


@TTSRegistry.register("edge")
class EdgeTTSBackend(TTSBackend):
    """Text-to-speech using Microsoft Edge's free TTS API."""

    VOICES = [
        "id-ID-GadisNeural",     # Indonesian female
        "id-ID-ArdiNeural",      # Indonesian male
        "en-US-JennyNeural",     # English female
        "en-US-GuyNeural",       # English male
        "ja-JP-NanamiNeural",    # Japanese female
        "zh-CN-XiaoxiaoNeural",  # Chinese female
    ]

    def __init__(self, voice: str = "id-ID-GadisNeural", speed: float = 1.0):
        self._voice = voice
        self._speed = speed

    @property
    def available(self) -> bool:
        try:
            import edge_tts
            return True
        except ImportError:
            return False

    def list_voices(self) -> List[str]:
        return self.VOICES

    def synthesize(self, text: str, voice: str | None = None, speed: float | None = None) -> TTSResult:
        """Synthesize text to speech using Edge TTS."""
        import edge_tts

        selected_voice = voice or self._voice
        selected_speed = speed if speed is not None else self._speed

        # Build SSML for speed control
        rate = f"{selected_speed * 100:.0f}%"
        ssml = (
            f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en">'
            f'<voice name="{selected_voice}">'
            f'<prosody rate="{rate}">{text}</prosody>'
            f'</voice>'
            f'</speak>'
        )

        async def _run():
            communicate = edge_tts.Communicate(ssml, selected_voice)
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])
            return b"".join(audio_chunks)

        audio_data = asyncio.run(_run())

        return TTSResult(
            audio=audio_data,
            format="mp3",
            voice=selected_voice,
        )

    @property
    def default_voice(self) -> str:
        return self._voice
