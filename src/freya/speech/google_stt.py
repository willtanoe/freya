"""Google STT backend — free cloud speech-to-text via SpeechRecognition."""

from __future__ import annotations

import tempfile
from typing import List, Optional

from freya.core.registry import SpeechRegistry
from freya.speech._stubs import Segment, SpeechBackend, TranscriptionResult


@SpeechRegistry.register("google-stt")
class GoogleSTTBackend(SpeechBackend):
    """Free cloud speech-to-text using Google Web Speech API via SpeechRecognition.

    No API key required. Works with any audio format that SpeechRecognition supports:
    wav, flac, aiff, etc. Falls back gracefully if unavailable.
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

        # Write audio bytes to temp file (SpeechRecognition needs a file)
        suffix = f".{format}" if format else ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio)
            tmp_path = f.name

        try:
            with sr.AudioFile(tmp_path) as source:
                audio_data = recognizer.record(source)

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
                return TranscriptionResult(
                    text="",
                    language=lang,
                    confidence=0.0,
                    duration_seconds=0.0,
                )
            except sr.RequestError as e:
                return TranscriptionResult(
                    text="",
                    language=lang,
                    confidence=0.0,
                    duration_seconds=0.0,
                )
        finally:
            import os
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    def health(self) -> bool:
        try:
            import speech_recognition
            return True
        except ImportError:
            return False

    def supported_formats(self) -> List[str]:
        return ["wav", "flac", "aiff"]
