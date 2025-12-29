"""
Simple test script for the Todo Application
Tests signup, signin, create task, toggle, and delete via API
"""
import requests
import json
import time

BASE_URL = "http://localhost:3001"  # Frontend on port 3001
API_URL = "http://localhost:8001"  # Backend on port 8001

print("=" * 60)
print("TODO APPLICATION END-TO-END TEST")
print("=" * 60)
print(f"Frontend: {BASE_URL}")
print(f"Backend:  {API_URL}")

# Test 1: Sign Up
print("\n[TEST 1] Testing Signup...")
signup_data = {
    "email": f"testuser{int(time.time())}@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
}
print(f"Email: {signup_data['email']}")

try:
    response = requests.post(
        f"{BASE_URL}/api/auth/sign-up/email",
        json=signup_data,
        timeout=10
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("[OK] Signup successful!")
        signup_result = response.json()
        print(f"User ID: {signup_result.get('user', {}).get('id', 'N/A')}")
    else:
        print(f"[FAIL] Signup failed: {response.text}")
        exit(1)
except Exception as e:
    print(f"[FAIL] Signup error: {e}")
    exit(1)

# Test 2: Get JWT Token
print("\n[TEST 2] Getting JWT Token...")
try:
    token_response = requests.get(
        f"{BASE_URL}/api/auth/token",
        cookies=response.cookies,
        timeout=10
    )
    print(f"Status: {token_response.status_code}")
    if token_response.status_code == 200:
        token_data = token_response.json()
        jwt_token = token_data.get("token")
        if jwt_token:
            print(f"[OK] JWT Token received: {jwt_token[:50]}...")
        else:
            print("[FAIL] No token in response")
            exit(1)
    else:
        print(f"[FAIL] Token fetch failed: {token_response.text}")
        exit(1)
except Exception as e:
    print(f"[FAIL] Token error: {e}")
    exit(1)

# Test 3: Create Task
print("\n[TEST 3] Creating Task...")
task_data = {
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
}

try:
    headers = {"Authorization": f"Bearer {jwt_token}"}
    create_response = requests.post(
        f"{API_URL}/api/tasks",
        json=task_data,
        headers=headers,
        timeout=10
    )
    print(f"Status: {create_response.status_code}")
    if create_response.status_code == 201:
        task = create_response.json()
        task_id = task.get("id")
        print(f"[OK] Task created! ID: {task_id}")
        print(f"  Title: {task.get('title')}")
        print(f"  Completed: {task.get('completed')}")
    else:
        print(f"[FAIL] Task creation failed: {create_response.text}")
        exit(1)
except Exception as e:
    print(f"[FAIL] Create task error: {e}")
    exit(1)

# Test 4: List Tasks
print("\n[TEST 4] Listing Tasks...")
try:
    list_response = requests.get(
        f"{API_URL}/api/tasks",
        headers=headers,
        timeout=10
    )
    print(f"Status: {list_response.status_code}")
    if list_response.status_code == 200:
        tasks = list_response.json()
        print(f"[OK] Found {len(tasks)} task(s)")
        for t in tasks:
            print(f"  - [{t.get('id')}] {t.get('title')} (Completed: {t.get('completed')})")
    else:
        print(f"[FAIL] List tasks failed: {list_response.text}")
except Exception as e:
    print(f"[FAIL] List tasks error: {e}")

# Test 5: Toggle Task
print("\n[TEST 5] Toggling Task Completion...")
try:
    toggle_response = requests.post(
        f"{API_URL}/api/tasks/{task_id}/toggle",
        headers=headers,
        timeout=10
    )
    print(f"Status: {toggle_response.status_code}")
    if toggle_response.status_code == 200:
        toggled_task = toggle_response.json()
        print(f"[OK] Task toggled! Completed: {toggled_task.get('completed')}")
    else:
        print(f"[FAIL] Toggle failed: {toggle_response.text}")
except Exception as e:
    print(f"[FAIL] Toggle error: {e}")

# Test 6: Delete Task
print("\n[TEST 6] Deleting Task...")
try:
    delete_response = requests.delete(
        f"{API_URL}/api/tasks/{task_id}",
        headers=headers,
        timeout=10
    )
    print(f"Status: {delete_response.status_code}")
    if delete_response.status_code == 204:
        print("[OK] Task deleted successfully!")
    else:
        print(f"[FAIL] Delete failed: {delete_response.text}")
except Exception as e:
    print(f"[FAIL] Delete error: {e}")

# Final verification
print("\n[FINAL] Verifying task was deleted...")
try:
    final_list = requests.get(
        f"{API_URL}/api/tasks",
        headers=headers,
        timeout=10
    )
    if final_list.status_code == 200:
        tasks = final_list.json()
        print(f"[OK] Task list has {len(tasks)} task(s)")
        if len(tasks) == 0:
            print("[OK] Task successfully deleted from database")
    else:
        print(f"Could not verify: {final_list.text}")
except Exception as e:
    print(f"Verification error: {e}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETED!")
print("=" * 60)
