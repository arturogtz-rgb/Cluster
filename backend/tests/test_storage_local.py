"""Tests for local filesystem storage migration (no Emergent creds required)."""
import io
import os
import struct
import zlib
import re
import subprocess
import time
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
BACKEND_ROOT = Path("/app/backend")
UPLOAD_DIR = BACKEND_ROOT / "uploads"


def _make_png_bytes() -> bytes:
    """Build a minimal valid 1x1 PNG."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00" + b"\xff\x00\x00"
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


PNG_BYTES = _make_png_bytes()


# ---------- Static/code checks ----------

class TestStorageModule:
    def test_storage_py_no_emergent_refs(self):
        content = (BACKEND_ROOT / "storage.py").read_text()
        assert "requests" not in content, "storage.py should not import requests"
        assert "emergentagent.com" not in content
        assert "EMERGENT_LLM_KEY" not in content

    def test_server_startup_log_local_storage(self):
        # Check the most recent backend log
        logs = subprocess.check_output(
            ["bash", "-c", "tail -n 400 /var/log/supervisor/backend.err.log"]
        ).decode()
        assert "Local file storage ready" in logs
        # Ensure most recent init is the local one (last occurrence)
        last_local = logs.rfind("Local file storage ready")
        last_obj = logs.rfind("Object storage initialized")
        assert last_local > last_obj, "Latest storage init should be local"


# ---------- Admin auth ----------

@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=15,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def pst_token():
    r = requests.post(
        f"{BASE_URL}/api/pst/login",
        json={"email": "test@empresa.com", "password": "password123"},
        timeout=15,
    )
    if r.status_code != 200:
        pytest.skip(f"PST login failed: {r.status_code} {r.text}")
    return r.json().get("token") or r.json().get("access_token")


# ---------- Media upload roundtrip ----------

class TestMediaUpload:
    def test_upload_and_download_media(self, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        files = {"file": ("test_pixel.png", PNG_BYTES, "image/png")}
        data = {"category": "system", "image_type": "card"}
        r = requests.post(f"{BASE_URL}/api/media/upload", files=files, data=data, headers=headers, timeout=30)
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
        body = r.json()
        url = body.get("url")
        assert url and url.startswith("/api/files/"), f"bad url: {url}"

        # File must physically exist
        rel_path = url[len("/api/files/"):]
        disk = UPLOAD_DIR / rel_path
        assert disk.is_file(), f"file not on disk: {disk}"
        assert disk.stat().st_size > 0

        # Download via /api/files/<path>
        r2 = requests.get(f"{BASE_URL}{url}", timeout=15)
        assert r2.status_code == 200
        assert len(r2.content) > 0
        ct = r2.headers.get("content-type", "")
        assert ct.startswith("image/"), f"bad content-type: {ct}"


# ---------- PST document upload roundtrip ----------

class TestPstDocumentUpload:
    def test_pst_upload_and_download(self, pst_token):
        headers = {"Authorization": f"Bearer {pst_token}"}
        files = {"file": ("test_doc.png", PNG_BYTES, "image/png")}
        r = requests.post(f"{BASE_URL}/api/pst/documents/upload", files=files, headers=headers, timeout=30)
        assert r.status_code == 200, f"pst upload failed: {r.status_code} {r.text}"
        body = r.json()
        url = body.get("url")
        assert url and url.startswith("/api/files/"), f"bad url: {url}"

        rel_path = url[len("/api/files/"):]
        disk = UPLOAD_DIR / rel_path
        assert disk.is_file(), f"file missing on disk: {disk}"

        r2 = requests.get(f"{BASE_URL}{url}", timeout=15)
        assert r2.status_code == 200
        assert len(r2.content) > 0


# ---------- Legacy /api/uploads StaticFiles ----------

class TestLegacyStaticFiles:
    def test_legacy_uploads_mount_serves_files(self):
        # Create a file inside legacy dir and verify it's served.
        legacy_dir = BACKEND_ROOT / "uploads"
        legacy_dir.mkdir(parents=True, exist_ok=True)
        marker = legacy_dir / "TEST_legacy_marker.txt"
        marker.write_text("legacy-ok")
        try:
            r = requests.get(f"{BASE_URL}/api/uploads/TEST_legacy_marker.txt", timeout=15)
            assert r.status_code == 200, f"legacy mount failed: {r.status_code}"
            assert "legacy-ok" in r.text
        finally:
            try:
                marker.unlink()
            except Exception:
                pass


# ---------- CI simulation: fresh backend on 8095 with NO EMERGENT_LLM_KEY ----------

@pytest.fixture(scope="module")
def ci_backend():
    """Start a fresh backend with env -i (no Emergent creds) on port 8095."""
    # Read only the vars we need from backend/.env
    env_file = BACKEND_ROOT / ".env"
    kv = {}
    for line in env_file.read_text().splitlines():
        m = re.match(r'^([A-Z_]+)="?([^"]*)"?$', line.strip())
        if m:
            kv[m.group(1)] = m.group(2)

    minimal_env = {
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "MONGO_URL": kv.get("MONGO_URL", "mongodb://localhost:27017"),
        "DB_NAME": kv.get("DB_NAME", "test_database"),
        "JWT_SECRET": kv.get("JWT_SECRET", "test-secret"),
        "CORS_ORIGINS": kv.get("CORS_ORIGINS", "*"),
        "ADMIN_INITIAL_PASSWORD": "admin123",
    }
    # Explicitly ensure NO EMERGENT_LLM_KEY
    assert "EMERGENT_LLM_KEY" not in minimal_env

    log_path = "/tmp/ci_backend_8095.log"
    logf = open(log_path, "wb")
    import sys as _sys
    py = _sys.executable  # use current interpreter (has uvicorn installed)
    proc = subprocess.Popen(
        [py, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8095"],
        cwd=str(BACKEND_ROOT),
        env=minimal_env,
        stdout=logf,
        stderr=subprocess.STDOUT,
    )
    # Wait up to 20s for boot
    ok = False
    for _ in range(40):
        time.sleep(0.5)
        try:
            r = requests.get("http://127.0.0.1:8095/api/", timeout=2)
            if r.status_code < 500:
                ok = True
                break
        except Exception:
            pass
    if not ok:
        proc.terminate()
        logf.close()
        pytest.fail(f"CI backend did not start. Logs:\n{Path(log_path).read_text()[-2000:]}")

    yield "http://127.0.0.1:8095"

    proc.terminate()
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()
    logf.close()


class TestCISimulation:
    def test_upload_roundtrip_without_emergent_key(self, ci_backend):
        # Login admin
        r = requests.post(f"{ci_backend}/api/auth/login",
                          json={"username": "admin", "password": "admin123"}, timeout=15)
        assert r.status_code == 200, f"admin login on CI backend failed: {r.status_code} {r.text}"
        token = r.json().get("access_token") or r.json().get("token")
        assert token

        headers = {"Authorization": f"Bearer {token}"}
        files = {"file": ("ci_pixel.png", PNG_BYTES, "image/png")}
        data = {"category": "system", "image_type": "card"}
        u = requests.post(f"{ci_backend}/api/media/upload", files=files, data=data, headers=headers, timeout=30)
        assert u.status_code == 200, f"CI upload failed: {u.status_code} {u.text}"
        url = u.json().get("url")
        assert url and url.startswith("/api/files/")

        d = requests.get(f"{ci_backend}{url}", timeout=15)
        assert d.status_code == 200
        assert len(d.content) > 0

    def test_ci_startup_log_local_storage(self, ci_backend):
        log = Path("/tmp/ci_backend_8095.log").read_text()
        assert "Local file storage ready" in log
        assert "Object storage initialized" not in log
