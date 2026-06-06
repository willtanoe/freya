"""Tests for speech configuration."""

from freya.core.config import FreyaConfig, SpeechConfig


def test_speech_config_defaults():
    cfg = SpeechConfig()
    assert cfg.backend == "auto"
    assert cfg.model == "base"
    assert cfg.language == ""
    assert cfg.device == "auto"
    assert cfg.compute_type == "float16"


def test_freya_config_has_speech():
    cfg = FreyaConfig()
    assert hasattr(cfg, "speech")
    assert isinstance(cfg.speech, SpeechConfig)
    assert cfg.speech.backend == "auto"


def test_freya_system_has_speech_backend():
    """FreyaSystem has a speech_backend attribute."""
    from freya.system import FreyaSystem

    assert "speech_backend" in FreyaSystem.__dataclass_fields__
