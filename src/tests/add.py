import requests

API_BASE = 'http://localhost:8000'


def login(username, password):
    response = requests.post(
        f'{API_BASE}/token',
            data={"username": username, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"})
    response.raise_for_status()
    return response.json()['access_token']


def add_candidate(token, name):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f'{API_BASE}/admin/add_candidate', headers=headers, json={'name': name})
    response.raise_for_status()
    return response.json()


def add_user(token, username, password, is_president=False):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f'{API_BASE}/admin/add_user', headers=headers,
                             json={'username': username, 'password': password, 'is_president': is_president})
    response.raise_for_status()
    return response.json()


def main():
    # Login as admin
    token = login('admin', '1234')

    # print admint token with ofbuscation at the end
    print(f"Admin token: {token[:10]}...")

    # Add a candidate
    candidate_response = add_candidate(token, 'Candidate1')
    print(candidate_response)

    # Add a user
    user_response = add_user(token, 'Test', '1234', is_president=False)
    print(user_response)


if __name__ == '__main__':
    main()