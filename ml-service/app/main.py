from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import shap
import os

app = FastAPI(title="InfraWatch AI ML Service")

MODEL_VERSION = "2.0.0"

# Load models and preprocessing objects
try:
    scaler_cost = joblib.load('models/v2_dataset/scaler_cost_overrun_risk.joblib')
    model_cost = joblib.load('models/v2_dataset/best_cost_overrun_risk_model.joblib')
    MODELS_LOADED = True
except Exception as e:
    print(f"Warning: Models not loaded. Run train_and_evaluate.py first. Error: {e}")
    MODELS_LOADED = False

class ProjectData(BaseModel):
    Budget: float
    MaterialCost: float
    LaborCost: float
    EquipmentCost: float
    progress_pct: float = 0.5

def preprocess_input(data: ProjectData):
    if not MODELS_LOADED:
        raise HTTPException(status_code=503, detail="Models are not loaded.")
        
    total_expenditure = data.MaterialCost + data.LaborCost + data.EquipmentCost
    ratio = total_expenditure / max(data.Budget, 1)
    
    features = [
        data.Budget,
        data.MaterialCost,
        data.LaborCost,
        data.EquipmentCost,
        total_expenditure,
        ratio,
        data.progress_pct
    ]
    
    feature_names = ['Budget', 'MaterialCost', 'LaborCost', 'EquipmentCost', 'TotalCurrentExpenditure', 'ExpenditureToBudgetRatio', 'progress_pct']
    df = pd.DataFrame([features], columns=feature_names)
    scaled_features = scaler_cost.transform(df)
        
    return scaled_features, df, feature_names

@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": MODELS_LOADED, "version": MODEL_VERSION}

@app.post("/ml/predict/cost")
def predict_cost(data: ProjectData):
    scaled_features, _, _ = preprocess_input(data)
    if hasattr(model_cost, "predict_proba"):
        prob = model_cost.predict_proba(scaled_features)[0][1]
    else:
        prob = float(model_cost.predict(scaled_features)[0])
        
    return {
        "cost_overrun_risk_probability": float(prob),
        "prediction": int(prob > 0.5),
        "model_version": MODEL_VERSION
    }

@app.post("/ml/predict/time")
def predict_time(data: ProjectData):
    return {
        "error": "Time-overrun prediction is not supported by the current dataset as historical completion dates are unavailable.",
        "model_version": MODEL_VERSION
    }

@app.post("/ml/predict/risk")
def predict_risk(data: ProjectData):
    return {
        "error": "Overall risk prediction is not supported by the current dataset as there is no overall risk ground truth available.",
        "model_version": MODEL_VERSION
    }

@app.post("/ml/explain")
def explain_prediction(data: ProjectData):
    scaled_features, df, feature_names = preprocess_input(data)
    
    try:
        if "Linear" in str(type(model_cost)) or "Logistic" in str(type(model_cost)):
            # Dummy background dataset for LinearExplainer
            background = np.zeros((1, len(feature_names)))
            explainer = shap.LinearExplainer(model_cost, background)
        else:
            explainer = shap.TreeExplainer(model_cost)
            
        shap_values = explainer.shap_values(scaled_features)
        
        if isinstance(shap_values, list): # For classification RF/XGB
            sv = shap_values[1][0]
        else:
            sv = shap_values[0]
            
        feature_importance = []
        for i in range(len(feature_names)):
            feature_importance.append({
                "factor_name": feature_names[i],
                "shap_value": float(sv[i]),
                "impact_direction": "INCREASES_RISK" if sv[i] > 0 else "DECREASES_RISK"
            })
            
        feature_importance.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        
        return {
            "top_factors": feature_importance[:5],
            "disclaimer": "These factors show model association and importance, but do not necessarily imply proven causation.",
            "model_version": MODEL_VERSION
        }
    except Exception as e:
        return {"error": f"Explainability not supported for current model type. {str(e)}"}
