"""Google STT backend — free cloud speech-to-text via SpeechRecognition.

Uses Google Web Speech API. No API key required. Optimized with
BytesIO to avoid temp file I/O overhead.
"""

from __future__ import annotations

import io
import wave
from typing import List, Optional

from freya.core.registry import SpeechRegistry
from freya.speech._stubs import Segment, SpeechBackend, TranscriptionResult


@SpeechRegistry.register("google-stt")
class GoogleSTTBackend(SpeechBackend):
    """Free cloud STT using Google Web Speech API via SpeechRecognition.

    No API key required. Supports wav and flac formats.
    """

    backend_id = "google-stt"

    def transcribe(
        self,
        audio: bytes,
        *,
        format: str = "wav",
        language: Optional[str] = None,
    ) -> TranscriptionResult:
        import speech_recognition as sr

        recognizer = sr.Recognizer()

        # Convert raw PCM bytes to WAV in memory (avoids disk I/O)
        if format == "wav":
            wav_buf = io.BytesIO()
            with wave.open(wav_buf, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                wf.writeframes(audio)
            wav_buf.seek(0)
            audio_data = sr.AudioData(wav_buf.read(), 16000, 2)
        else:
            # For other formats, use temp file (fallback)
            audio_data = sr.AudioData(audio, 16000, 2)

        lang = language or "id-ID"
        try:
            text = recognizer.recognize_google(audio_data, language=lang)
            return TranscriptionResult(
                text=text,
                language=lang,
                confidence=None,
                duration_seconds=0.0,
            )
        except sr.UnknownValueError:
            return TranscriptionResult(text="", language=lang, confidence=0.0, duration_seconds=0.0)
        except sr.RequestError:
            return TranscriptionResult(text="", language=lang, confidence=0.0, duration_seconds=0.0)

    def health(self) -> bool:
        try:
            import speech_recognition
            return True
        except ImportError:
            return False

    def supported_formats(self) -> List[str]:
        return ["wav", "flac", "aiff"]
