"""Tests for site settings: logo upload URL persistence and maintenance mode."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nature-hub-23.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def test_get_settings_public():
    r = requests.get(f"{BASE_URL}/api/settings", timeout=15)
    assert r.status_code == 200
    data = r.json()
    # New fields must be reachable via the model (may be absent if never saved, but keys allowed)
    assert "id" in data


def test_put_settings_persists_logo_and_maintenance(headers):
    payload = {
        "site_logo_url": "https://example.com/test_logo.png",
        "maintenance_mode": True,
    }
    r = requests.put(f"{BASE_URL}/api/settings", json=payload, headers=headers, timeout=15)
    assert r.status_code == 200, f"PUT failed: {r.status_code} {r.text}"

    # Verify via GET
    g = requests.get(f"{BASE_URL}/api/settings", timeout=15)
    assert g.status_code == 200
    data = g.json()
    assert data.get("site_logo_url") == "https://example.com/test_logo.png", data
    assert data.get("maintenance_mode") is True, data


def test_toggle_maintenance_off(headers):
    payload = {"maintenance_mode": False}
    r = requests.put(f"{BASE_URL}/api/settings", json=payload, headers=headers, timeout=15)
    assert r.status_code == 200

    g = requests.get(f"{BASE_URL}/api/settings", timeout=15)
    data = g.json()
    assert data.get("maintenance_mode") is False, data
    # logo should still be there (partial update)
    assert data.get("site_logo_url") == "https://example.com/test_logo.png"


def test_put_settings_requires_auth():
    r = requests.put(f"{BASE_URL}/api/settings", json={"maintenance_mode": False}, timeout=15)
    assert r.status_code in (401, 403)


def test_cleanup_reset_logo(headers):
    """Clean up test data by clearing test logo URL."""
    payload = {"site_logo_url": "", "maintenance_mode": False}
    r = requests.put(f"{BASE_URL}/api/settings", json=payload, headers=headers, timeout=15)
    assert r.status_code == 200
