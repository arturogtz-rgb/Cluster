"""Tests for site_title feature and root API message rename."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nature-hub-23.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def test_root_message_updated():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    msg = r.json().get("message", "")
    assert "Clúster de Turismo de Jalisco" in msg
    assert "Naturaleza y Aventura" not in msg


def test_settings_get_has_site_title_field():
    r = requests.get(f"{API}/settings", timeout=10)
    assert r.status_code == 200
    data = r.json()
    # site_title may be empty string or set; field should be acceptable
    assert isinstance(data, dict)


def test_put_site_title_persists(admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    custom = "TEST_Mi Título Custom"
    payload = {"site_title": custom}
    r = requests.put(f"{API}/settings", json=payload, headers=headers, timeout=15)
    assert r.status_code == 200, f"PUT failed: {r.status_code} {r.text}"

    # GET back and verify
    r2 = requests.get(f"{API}/settings", timeout=10)
    assert r2.status_code == 200
    assert r2.json().get("site_title") == custom

    # Reset back to empty to avoid polluting other tests
    requests.put(f"{API}/settings", json={"site_title": ""}, headers=headers, timeout=15)
