import requests
import json

BASE = 'http://localhost:8080/api'
ML   = 'http://localhost:8000'

print('=== E2E INTEGRATION TEST ===\n')

# 1. ML Health
r = requests.get(f'{ML}/health')
print(f'[ML] GET /health -> {r.status_code} {r.json()}')

# 2. Register
r = requests.post(f'{BASE}/v1/auth/register', json={
    'username': 'e2eadmin', 'password': 'TestPass123!',
    'fullName': 'E2E Admin', 'email': 'e2e@infrawatch.ai',
    'department': 'Audit', 'role': 'ROLE_ADMIN'
})
print(f'[AUTH] POST /register -> {r.status_code} {r.text[:80]}')

# 3. Login
r = requests.post(f'{BASE}/v1/auth/login', json={
    'username': 'e2eadmin', 'password': 'TestPass123!'
})
print(f'[AUTH] POST /login -> {r.status_code}')
token = r.json().get('token', '')
print(f'[AUTH] JWT received: {bool(token)}')

headers = {'Authorization': f'Bearer {token}'}

# 4. Protected: list projects
r = requests.get(f'{BASE}/v1/projects', headers=headers)
print(f'[API]  GET /projects -> {r.status_code}')
body = r.json()
projects = body.get('content', body) if isinstance(body, dict) else body
print(f'[API]  Project count: {len(projects)}')

# 5. Unauthorized access attempt
r = requests.get(f'{BASE}/v1/projects')
print(f'[SEC]  GET /projects (no token) -> {r.status_code} (expected 401/403)')

# 6. Invalid login attempt
r = requests.post(f'{BASE}/v1/auth/login', json={
    'username': 'e2eadmin', 'password': 'WRONGPASSWORD'
})
print(f'[SEC]  POST /login (wrong pass) -> {r.status_code} (expected 401)')

# 7. If projects exist, test details + ML prediction + assistant
if projects:
    pid = projects[0]['id']
    r = requests.get(f'{BASE}/v1/projects/{pid}', headers=headers)
    print(f'[API]  GET /projects/{pid} -> {r.status_code}')

    # ML predict via backend proxy
    r = requests.post(f'{BASE}/v1/ml/predict/{pid}', headers=headers)
    print(f'[API]  POST /ml/predict/{pid} -> {r.status_code} body={r.text[:120]}')

    # Alerts
    r = requests.get(f'{BASE}/v1/alerts/project/{pid}', headers=headers)
    print(f'[API]  GET /alerts/project/{pid} -> {r.status_code}')

    # Recommendations
    r = requests.get(f'{BASE}/v1/recommendations/project/{pid}', headers=headers)
    print(f'[API]  GET /recommendations/project/{pid} -> {r.status_code}')

    # AI Assistant
    r = requests.post(f'{BASE}/v1/assistant/chat',
        json={'message': 'Summarize this project', 'projectId': pid},
        headers=headers)
    print(f'[AI]   POST /assistant/chat -> {r.status_code}')
    if r.status_code == 200:
        reply = r.json().get('reply', '')
        print(f'[AI]   Reply length: {len(reply)} chars, sources: {r.json().get("sources", [])}')
else:
    print('[WARN] No projects in DB — seeded data may not have loaded yet')

# 8. Backend -> ML direct check
r = requests.get(f'{ML}/health')
print(f'[ML]  /health from host -> {r.json()}')

print('\n=== E2E COMPLETE ===')
