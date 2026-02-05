import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    try:
        r = requests.get(BASE_URL + "/")
        print(f"[ROOT] Status: {r.status_code}, Response: {r.json()}")
    except Exception as e:
        print(f"[ROOT] Failed: {e}")

def test_store_user():
    user_data = {
        "name": "Ramesh Gupta",
        "age": 45,
        "income": 120000,
        "occupation": "Farmer",
        "state": "Uttar Pradesh",
        "category": "farmer"
    }
    try:
        r = requests.post(BASE_URL + "/api/store-user", json=user_data)
        print(f"[STORE] Status: {r.status_code}, Response: {r.json()}")
    except Exception as e:
        print(f"[STORE] Failed: {e}")

def test_recommend():
    user_data = {
        "name": "Ramesh Gupta",
        "age": 45,
        "income": 120000,
        "occupation": "Farmer",
        "state": "Uttar Pradesh",
        "category": "farmer"
    }
    try:
        r = requests.post(BASE_URL + "/api/recommend", json=user_data)
        print(f"[RECOMMEND] Status: {r.status_code}")
        data = r.json()
        print(f"[RECOMMEND] Count: {data.get('count')}")
        if data.get('results'):
            print(f"[RECOMMEND] Top Result: {data['results'][0]['title']}")
            print(f"[RECOMMEND] Simple Text: {repr(data['results'][0]['simple_explanation'])}")
        else:
            print("[RECOMMEND] No results found.")
    except Exception as e:
        print(f"[RECOMMEND] Failed: {e}")

if __name__ == "__main__":
    print("Waiting for server to start...")
    # Ideally, we would wait or retry, but for this script we just try once
    test_root()
    test_store_user()
    test_recommend()
