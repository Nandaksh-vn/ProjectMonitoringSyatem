from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "InfraWatch AI ML Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
