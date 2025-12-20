import requests
import json


try:
    print("Checking root endpoint...")
    resp = requests.get("http://127.0.0.1:8000/")
    print(f"Root Status: {resp.status_code}")
except Exception as e:
    print(f"Root check failed: {e}")

url = "http://127.0.0.1:8000/api/stocks/UNKNOWN123"
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2))
    except:
        print("Response Text:")
        print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
