# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['src\\freya\\server_standalone.py'],
    pathex=[],
    binaries=[],
    datas=[('src/freya', 'freya')],
    hiddenimports=['uvicorn', 'fastapi', 'openai', 'httpx', 'google.genai', 'anthropic', 'freya.engine.cloud', 'freya.server.app', 'freya.server.routes', 'freya.server.api_routes', 'freya.server.cloud_router', 'freya.agents.operative', 'freya.tools.builtin', 'freya.tools.file_read', 'freya.tools.shell_exec', 'freya.tools.web_search', 'freya.tools.calculator', 'freya.speech.edge_tts', 'freya.speech.google_stt'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='freya-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
