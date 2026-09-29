import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import the main app from app.main to get all routes
from app.main import app as ml_app

load_dotenv()

# We can just run ml_app directly, but we need to add health_router if it's not there,
# or we can mount it. Actually, app.main has @app.get("/health") and @app.post("/ml/predict/cost").
# So we can just use ml_app as the primary application.

ml_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@ml_app.get("/")
def root():
    return {
        "message": "Welcome to InfraWatch AI ML Service API",
        "health_check": "/health",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:ml_app", host=host, port=port, reload=True)
