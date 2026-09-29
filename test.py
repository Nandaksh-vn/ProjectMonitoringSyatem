import requests
import json
import time

BASE_URL = "http://localhost:8080/api/v1"
ML_URL = "http://localhost:8000"

print("1. Registering user...")
try:
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "admin_demo2",
        "password": "password123",
        "fullName": "Demo Admin",
        "email": "demo2@admin.com",
        "department": "Ministry of Power",
        "role": "ROLE_ADMIN"
    })
    print(res.text)
except Exception as e:
    print(e)

print("2. Logging in...")
res = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin_demo2",
    "password": "password123"
})
token = res.json().get("token")
print("Token:", token[:10], "...")

headers = {"Authorization": f"Bearer {token}"}

print("3. Creating a real-world project (e.g. Mumbai Coastal Road)...")
project = {
    "projectCode": "MCR-2024",
    "projectName": "Mumbai Coastal Road Project",
    "ministryId": 3,
    "sectorId": 2,
    "agencyId": 1,
    "state": "Maharashtra",
    "district": "Mumbai",
    "approvedCost": 12000.0,
    "revisedCost": 13060.0,
    "currentExpenditure": 9500.0,
    "approvalDate": "2018-05-01",
    "originalStartDate": "2018-10-01",
    "originalCompletionDate": "2023-12-31",
    "revisedCompletionDate": "2024-05-31",
    "physicalProgress": 85.0,
    "financialProgress": 72.7,
    "status": "ONGOING"
}
res = requests.post(f"{BASE_URL}/projects", json=project, headers=headers)
print("Create Project Status:", res.status_code)
if res.status_code == 200:
    proj_id = res.json()["id"]
    print("Project ID:", proj_id)
else:
    print(res.text)
    proj_id = 1 # Fallback

print("4. Triggering ML Engine API through backend...")
res = requests.post(f"{BASE_URL}/alerts/run", headers=headers)
print("Engine run status:", res.text)

print("5. Asking AI Assistant about the project...")
res = requests.post(f"{BASE_URL}/assistant/chat", json={
    "message": "Give me a summary of this project.",
    "projectId": proj_id
}, headers=headers)
print("AI Assistant response:", json.dumps(res.json(), indent=2))

print("6. Getting ML prediction for this project from ML service directly to test its response...")
try:
    ml_res = requests.post(f"{ML_URL}/ml/predict/cost", json={
        "Budget": 12000.0,
        "MaterialCost": 5000.0,
        "LaborCost": 3000.0,
        "EquipmentCost": 2000.0,
        "TotalCurrentExpenditure": 9500.0,
        "ExpenditureToBudgetRatio": 9500.0 / 12000.0
    })
    print("ML Predict Status:", ml_res.status_code)
    print("ML Predict Body:", json.dumps(ml_res.json(), indent=2))
except Exception as e:
    print("ML API Error:", e)

