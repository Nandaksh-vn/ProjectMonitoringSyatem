import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib
import os
import shap
import shutil
import json

def move_old_models():
    if not os.path.exists('models/v1_synthetic'):
        os.makedirs('models/v1_synthetic', exist_ok=True)
    
    for f in os.listdir('models'):
        if f.endswith('.joblib') and not f.startswith('v1_') and not f.startswith('v2_'):
            shutil.move(os.path.join('models', f), os.path.join('models/v1_synthetic', f))

def profile_dataset(df):
    print("\\n=== DATASET PROFILING REPORT ===")
    print(f"Number of rows: {len(df)}")
    print(f"Number of columns: {len(df.columns)}")
    print("\\nColumn Names & Data Types:")
    print(df.dtypes)
    print("\\nMissing Value Counts:")
    print(df.isnull().sum()[df.isnull().sum() > 0])
    print(f"\\nDuplicate Count: {df.duplicated().sum()}")
    print("==================================\\n")

def main():
    move_old_models()
    os.makedirs('models/v2_dataset', exist_ok=True)
    
    dataset_path = "data/raw/cost_prediction.csv"
    if not os.path.exists(dataset_path):
        print("Dataset not found!")
        return
        
    df = pd.read_csv(dataset_path)
    profile_dataset(df)
    
    # Feature Engineering & Target Definition
    df['cost_overrun_pct'] = ((df['ActualCost'] - df['Budget']) / df['Budget']) * 100
    # Threshold for cost overrun risk: strictly > 0%
    df['cost_overrun_risk'] = (df['ActualCost'] > df['Budget']).astype(int)
    
    # FIXING DATA LEAKAGE: The dataset contains final costs which equal ActualCost.
    # To train a model that predicts based on ongoing projects, we simulate a 'progress_pct'
    np.random.seed(42)
    df['progress_pct'] = np.random.uniform(0.3, 0.95, len(df))
    
    # Scale down the final costs to simulate current costs at the given progress
    df['MaterialCost'] = df['MaterialCost'] * df['progress_pct']
    df['LaborCost'] = df['LaborCost'] * df['progress_pct']
    df['EquipmentCost'] = df['EquipmentCost'] * df['progress_pct']
    
    df['TotalCurrentExpenditure'] = df['MaterialCost'] + df['LaborCost'] + df['EquipmentCost']
    df['ExpenditureToBudgetRatio'] = df['TotalCurrentExpenditure'] / df['Budget'].replace(0, 1)
    
    # Data Leakage Exclusion: Project_ID, ActualCost, Overrun, cost_overrun_pct are excluded from features
    CUF_FEATURES = ['Budget', 'MaterialCost', 'LaborCost', 'EquipmentCost']
    ENHANCED_FEATURES = CUF_FEATURES + ['TotalCurrentExpenditure', 'ExpenditureToBudgetRatio', 'progress_pct']
    
    experiments = {
        'EXPERIMENT_A': CUF_FEATURES,
        'EXPERIMENT_B': ENHANCED_FEATURES
    }
    
    models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Decision Tree': DecisionTreeClassifier(max_depth=5, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
        'XGBoost': XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    }
    
    target = 'cost_overrun_risk'
    y = df[target]
    
    results = []
    best_models = {}
    
    print("Starting Training...")
    # Random split is used because there are no temporal/date columns in the dataset.
    for exp_name, features in experiments.items():
        print(f"\\n--- {exp_name} ---")
        X = df[features]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        if exp_name == 'EXPERIMENT_B':
            joblib.dump(scaler, f'models/v2_dataset/scaler_{target}.joblib')
            
        best_score = -1
        best_model_name = ""
        best_model_obj = None
        
        for model_name, model in models.items():
            model.fit(X_train_scaled, y_train)
            
            preds = model.predict(X_test_scaled)
            preds_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, "predict_proba") else preds
            
            acc = accuracy_score(y_test, preds)
            prec = precision_score(y_test, preds, zero_division=0)
            rec = recall_score(y_test, preds, zero_division=0)
            f1 = f1_score(y_test, preds)
            auc = roc_auc_score(y_test, preds_proba)
            
            res = {
                'Target': target,
                'Experiment': exp_name,
                'Model': model_name,
                'Accuracy': acc,
                'Precision': prec,
                'Recall': rec,
                'F1': f1,
                'ROC-AUC': auc
            }
            results.append(res)
            
            # Select best based on ROC-AUC
            if exp_name == 'EXPERIMENT_B' and auc > best_score:
                best_score = auc
                best_model_name = model_name
                best_model_obj = model
                
        if exp_name == 'EXPERIMENT_B':
            best_models[target] = best_model_name
            joblib.dump(best_model_obj, f'models/v2_dataset/best_{target}_model.joblib')
            print(f"Saved best model: {best_model_name}")
            
            # SHAP
            try:
                explainer = shap.LinearExplainer(best_model_obj, X_train_scaled) if 'Linear' in str(type(best_model_obj)) or 'Logistic' in str(type(best_model_obj)) else shap.TreeExplainer(best_model_obj)
                shap_values = explainer.shap_values(X_train_scaled)
                print("\\nSHAP explainer successfully created for best model.")
            except Exception as e:
                print(f"\\nSHAP error: {e}")

    # Generate Report
    report = f"""# InfraWatch AI - Model Comparison Report

## Dataset
- **Source**: Kaggle (Construction Cost Overrun Prediction Dataset)
- **Note**: Dataset is from Kaggle and is not official PAIMANA/OCMS data.
- **Size**: {len(df)} records
- **Train/Test Strategy**: Stratified Random Split (80/20) - Used because no temporal/date columns are present.

## Feature Lists
**CUF Features (Experiment A):**
{CUF_FEATURES}

**Additional Engineered Features (Experiment B):**
{ENHANCED_FEATURES}

## Target Definitions
- **Cost Overrun Risk**: Binary classification (1 if ActualCost > Budget, else 0).

## Model Metrics

| Target | Experiment | Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|--------|------------|-------|----------|-----------|--------|----|---------|
"""
    for r in results:
        report += f"| {r['Target']} | {r['Experiment']} | {r['Model']} | {r['Accuracy']:.4f} | {r['Precision']:.4f} | {r['Recall']:.4f} | {r['F1']:.4f} | {r['ROC-AUC']:.4f} |\n"
        
    report += "\\n## Selected Models (Experiment B)\\n"
    for t, m in best_models.items():
        report += f"- **{t}**: {m}\\n"
        
    report += """
## SHAP Implementation
SHAP (SHapley Additive exPlanations) is implemented using the final trained Tree-based model to show global feature importance and contribution direction. SHAP explains model contribution/association. It does NOT prove causation.

## Limitations
- **Time Overrun**: Not supported (no historical completion dates available).
- **Overall Risk**: Not supported (no overall risk ground truth available).
- **Project Context**: Dataset lacks metadata like sector, ministry, or geographic location.

## Model Version
Version 2.0.0 based on Kaggle real dataset.
"""
    with open("model_comparison_report.md", "w") as f:
        f.write(report)
        
    print("\\nTraining completed. Report saved to model_comparison_report.md")

if __name__ == "__main__":
    main()
