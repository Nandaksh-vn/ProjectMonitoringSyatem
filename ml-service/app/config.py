"""Runtime configuration and filesystem paths for the ML service.

Paths are resolved relative to this file rather than the process working
directory. The previous implementation used bare relative paths such as
`models/v2_dataset/...`, which silently degraded to `models_loaded: false`
whenever the service was started from anywhere other than `ml-service/`
(the exception handler swallowed the error and the API still booted healthy).
"""

from __future__ import annotations

import os
from pathlib import Path

SERVICE_ROOT: Path = Path(__file__).resolve().parent.parent
MODELS_DIR: Path = SERVICE_ROOT / "models"
DEFAULT_MODEL_SET: str = os.getenv("ML_MODEL_SET", "v3_full")

MODEL_SETS: dict[str, str] = {
    "v1_synthetic": "v1_synthetic",
    "v2_dataset": "v2_dataset",
    "v3_full": "v3_full",
}

MODEL_VERSION: str = "3.0.0"
API_VERSION: str = "1.0.0"

DELAY_THRESHOLD_MONTHS: float = 3.0
