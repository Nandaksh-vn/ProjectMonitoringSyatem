import urllib.request
import json

url = "http://localhost:8080/api/v1/auth/login"
data = {"username": "admin", "password": "Admin@123"}
req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as f:
        print(f.read().decode("utf-8"))
except Exception as e:
    print(e)
    if hasattr(e, "read"):
        print(e.read().decode("utf-8"))
