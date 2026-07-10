"""
Comprehensive test suite for all 5 phases of improvements:
- Phase 1: Security (JWT_SECRET, CORS, seed endpoint removal)
- Phase 2: SSL/Nginx (file-based)
- Phase 3: PWA (manifest.json, service-worker.js, index.html)
- Phase 4: Excel Import/Export (empresas plantilla, importar, exportar)
- Phase 5: SEO (sitemap.xml, robots.txt)
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nature-hub-23.preview.emergentagent.com").rstrip("/")
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_token(api_client):
    r = api_client.post(f"{BASE_URL}/api/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip(f"No token in login response: {data}")
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ============ PHASE 1: SECURITY ============
class TestPhase1Security:
    def test_seed_endpoint_removed(self, api_client):
        """POST /api/seed should return 404 (endpoint removed)."""
        r = api_client.post(f"{BASE_URL}/api/seed")
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text[:200]}"

    def test_admin_login_works(self, api_client):
        """Admin should still be able to log in with admin/admin123."""
        r = api_client.post(f"{BASE_URL}/api/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS})
        assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
        data = r.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"Missing token in response: {data}"
        assert isinstance(token, str) and len(token) > 20

    def test_cors_no_wildcard_in_server_py(self):
        """server.py CORS config must not hardcode wildcard '*'."""
        with open("/app/backend/server.py") as f:
            content = f.read()
        # Check that CORS section doesn't have hardcoded '*' as allow_origins
        # Find CORS middleware block
        cors_section = content.split("CORSMiddleware")[-1][:1000] if "CORSMiddleware" in content else ""
        # allow_origins=["*"] is the forbidden pattern
        assert 'allow_origins=["*"]' not in content, "CORS still has hardcoded wildcard"
        assert 'default_origins' in content, "Missing default_origins definition"
        assert "clusterturismojalisco.com.mx" in content, "Missing production domain in default CORS"

    def test_jwt_secret_no_default(self):
        """auth.py should raise if JWT_SECRET missing (no default)."""
        with open("/app/backend/auth.py") as f:
            content = f.read()
        assert "os.environ.get('JWT_SECRET')" in content or 'os.environ.get("JWT_SECRET")' in content
        assert "raise RuntimeError" in content or "raise Exception" in content, "No error raised for missing JWT_SECRET"
        # ensure no default like os.environ.get('JWT_SECRET', 'somedefault')
        assert not re.search(r"os\.environ\.get\(['\"]JWT_SECRET['\"]\s*,\s*['\"][^'\"]+['\"]\)", content), \
            "JWT_SECRET has a hardcoded default"

    def test_docker_compose_no_backend_db_ports(self):
        """docker-compose.yml should not expose ports for database or backend."""
        with open("/app/docker-compose.yml") as f:
            content = f.read()
        # Split by services and check each
        # Simple check: only frontend has ports mapping
        assert "27017:27017" not in content, "MongoDB port still exposed"
        assert "8001:8001" not in content, "Backend port still exposed"
        # Frontend should have 80/443
        assert '"80:80"' in content or "80:80" in content, "Frontend port 80 mapping missing"
        assert '"443:443"' in content or "443:443" in content, "Frontend port 443 mapping missing"


# ============ PHASE 2: SSL/NGINX ============
class TestPhase2SSL:
    def test_nginx_acme_challenge_block(self):
        """nginx.conf must contain ACME challenge location."""
        with open("/app/frontend/nginx.conf") as f:
            content = f.read()
        assert "/.well-known/acme-challenge/" in content, "Missing ACME challenge block"
        assert "/var/www/certbot" in content, "Missing certbot webroot"

    def test_docker_compose_webroot_volume(self):
        """docker-compose.yml frontend should have webroot volume for certbot."""
        with open("/app/docker-compose.yml") as f:
            content = f.read()
        assert "./webroot:/var/www/certbot" in content, "Missing webroot volume mapping"


# ============ PHASE 3: PWA ============
class TestPhase3PWA:
    def test_manifest_accessible(self, api_client):
        """manifest.json should be served at /manifest.json."""
        r = api_client.get(f"{BASE_URL}/manifest.json")
        assert r.status_code == 200, f"manifest.json not accessible: {r.status_code}"
        data = r.json()
        assert data.get("theme_color") == "#1a4d2e", f"Wrong theme_color: {data.get('theme_color')}"
        assert "Turismo" in data.get("name", ""), f"Missing app name: {data.get('name')}"

    def test_service_worker_accessible(self, api_client):
        """service-worker.js should be accessible."""
        r = api_client.get(f"{BASE_URL}/service-worker.js")
        assert r.status_code == 200, f"service-worker.js not accessible: {r.status_code}"
        assert "self.addEventListener" in r.text or "caches" in r.text

    def test_index_html_has_pwa_tags(self, api_client):
        """index.html should have manifest link and apple-touch-icon."""
        r = api_client.get(f"{BASE_URL}/")
        assert r.status_code == 200
        html = r.text
        assert 'rel="manifest"' in html, "Missing manifest link"
        assert "apple-touch-icon" in html, "Missing apple-touch-icon"


# ============ PHASE 4: EXCEL IMPORT/EXPORT ============
class TestPhase4ImportExport:
    def test_plantilla_no_auth_required(self, api_client):
        """GET /api/empresas/plantilla should return 200 without auth."""
        r = api_client.get(f"{BASE_URL}/api/empresas/plantilla")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"
        ct = r.headers.get("content-type", "")
        assert "spreadsheetml" in ct or "xlsx" in ct.lower() or "octet-stream" in ct, f"Wrong content-type: {ct}"
        # First bytes of xlsx are PK (zip)
        assert r.content[:2] == b"PK", "Response is not a valid .xlsx (PK header missing)"

    def test_exportar_requires_auth(self, api_client):
        """GET /api/empresas/exportar without auth should return 401/403."""
        r = api_client.get(f"{BASE_URL}/api/empresas/exportar")
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"

    def test_exportar_with_auth(self, api_client, auth_headers):
        """GET /api/empresas/exportar with auth should return 200 xlsx."""
        r = api_client.get(f"{BASE_URL}/api/empresas/exportar", headers=auth_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"
        assert r.content[:2] == b"PK", "Response is not a valid .xlsx"

    def test_importar_requires_auth(self, api_client):
        """POST /api/empresas/importar without auth should return 401/403."""
        # Minimal payload just to hit the endpoint
        files = {"file": ("test.xlsx", b"dummy", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r = api_client.post(f"{BASE_URL}/api/empresas/importar", files=files, headers={"Content-Type": None})
        # requests will handle multipart properly if we clear content-type on session
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text[:200]}"


# ============ PHASE 5: SEO ============
class TestPhase5SEO:
    def test_sitemap_uses_production_domain(self, api_client):
        """GET /api/sitemap.xml should reference clusterturismojalisco.com.mx."""
        r = api_client.get(f"{BASE_URL}/api/sitemap.xml")
        assert r.status_code == 200, f"Sitemap not accessible: {r.status_code}"
        content = r.text
        assert "clusterturismojalisco.com.mx" in content, "Sitemap does not use production domain"
        assert "preview.emergentagent.com" not in content, "Sitemap contains preview domain (should not)"
        assert "<urlset" in content, "Missing urlset XML tag"

    def test_robots_txt_accessible(self, api_client):
        """robots.txt should exist with sitemap reference."""
        r = api_client.get(f"{BASE_URL}/robots.txt")
        assert r.status_code == 200, f"robots.txt not accessible: {r.status_code}"
        content = r.text
        assert "Sitemap" in content, "Missing sitemap reference in robots.txt"
        assert "sitemap.xml" in content.lower(), "Missing sitemap.xml URL"
