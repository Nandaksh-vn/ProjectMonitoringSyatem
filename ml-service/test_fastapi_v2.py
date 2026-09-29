from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("Testing /health...")
    response = client.get("/health")
    print(response.json())
    
    payload = {
        "Budget": 1000000.0,
        "MaterialCost": 500000.0,
        "LaborCost": 300000.0,
        "EquipmentCost": 200000.0
    }
    
    print("\\nTesting /ml/predict/cost...")
    response = client.post("/ml/predict/cost", json=payload)
    print(response.json())
    
    print("\\nTesting /ml/predict/time...")
    response = client.post("/ml/predict/time", json=payload)
    print(response.json())
    
    print("\\nTesting /ml/predict/risk...")
    response = client.post("/ml/predict/risk", json=payload)
    print(response.json())
    
    print("\\nTesting /ml/explain...")
    response = client.post("/ml/explain", json=payload)
    print(response.json())

if __name__ == "__main__":
    run_tests()
