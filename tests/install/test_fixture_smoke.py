"""Smoke test that the tmp_freya_home fixture works."""

from __future__ import annotations

from pathlib import Path

from freya.core import config as config_mod


def test_fixture_redirects_default_config_dir(tmp_freya_home: Path) -> None:
    assert config_mod.DEFAULT_CONFIG_DIR == tmp_freya_home
    assert tmp_freya_home.exists()
    assert (tmp_freya_home / ".state").exists()
    assert (tmp_freya_home / ".state" / "models").exists()


def test_fixture_redirects_config_path(tmp_freya_home: Path) -> None:
    assert config_mod.DEFAULT_CONFIG_PATH == tmp_freya_home / "config.toml"
