import requests
import json

base_url = "http://localhost:8001"

test_data = {
    "sector": "Transport",
    "ministry": "MORTH",
    "approved_cost": 1500.0,
    "revised_cost": 1800.0,
    "current_expenditure": 1200.0,
    "planned_physical_progress": 80.0,
    "actual_physical_progress": 70.0,
    "planned_financial_progress": 80.0,
    "actual_financial_progress": 66.6,
    "delayed_milestone_count": 2,
    "elapsed_duration": 24,
    "remaining_duration": 12
}

def run_tests():
    print("--- API TEST RESULTS ---")
    
    # 1. Health
    r = requests.get(f"{base_url}/health")
    print(f"Health Check: {r.status_code}")
    print(r.json())
    
    # 2. Predict Cost
    r = requests.post(f"{base_url}/ml/predict/cost", json=test_data)
    print(f"\nPredict Cost: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    
    # 3. Predict Time
    r = requests.post(f"{base_url}/ml/predict/time", json=test_data)
    print(f"\nPredict Time: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    
    # 4. Predict Risk
    r = requests.post(f"{base_url}/ml/predict/risk", json=test_data)
    print(f"\nPredict Risk: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    
    # 5. Explain
    r = requests.post(f"{base_url}/ml/explain", json=test_data)
    print(f"\nExplain: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    run_tests()
