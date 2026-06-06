"""Freya Server — standalone entry point for PyInstaller bundling."""
import uvicorn
from freya.server.app import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
