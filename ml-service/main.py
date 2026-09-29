"""Entry point for the InfraWatch ML Service.

    python main.py

Listens on $PORT (default 8000) and $HOST (default 0.0.0.0).
"""

from __future__ import annotations

import os

import uvicorn

from app.main import app

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=ENVIRONMENT != "production")
