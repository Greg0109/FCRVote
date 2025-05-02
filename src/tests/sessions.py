import requests

API_BASE = 'http://localhost:8000'


def login(username, password):
    response = requests.post(
        f'{API_BASE}/token',
            data={"username": username, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"})
    response.raise_for_status()
    return response.json()['access_token']

def start_session(token):
    response = requests.post(
        f'{API_BASE}/voting_sessions/start_session',
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()

def stop_session(token):
    response = requests.post(
        f'{API_BASE}/voting_sessions/end_session',
        headers={"Authorization": f"Bearer {token}"}
    )
    response.raise_for_status()
    return response.json()

def main():
    # Login as admin
    token = login('admin', '1234')

    # print admint token with ofbuscation at the end
    print(f"Admin token: {token[:10]}...")

    # Stop any existing session
    try:
        stop_session(token)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code != 404:
            print("Error stopping session:", e)

    # Start a new session
    session_response = start_session(token)
    print("Session started:", session_response)

if __name__ == '__main__':
    main()