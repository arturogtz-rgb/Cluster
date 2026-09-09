"""Backend tests for PST self-registration & affiliation (Bloque A).

Covers: PST register/login/me, profile CRUD, submit-for-payment blocking requirements,
document upload, public requisitos/planes, admin requisitos/planes/discount-codes CRUD,
admin empresas-afiliadas state machine, and cross-role access control.
"""
import os
import io
import time
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "admin123"


# ---------- Fixtures ----------

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def pst_credentials():
    # unique email per run
    ts = int(time.time())
    return {
        "email": f"test_pst_{ts}@empresa.com",
        "password": "password123",
        "nombre_contacto": "Test PST Contact",
        "telefono_contacto": "3331234567",
    }


@pytest.fixture(scope="session")
def pst_token(pst_credentials):
    r = requests.post(f"{API}/pst/register", json=pst_credentials, timeout=15)
    assert r.status_code == 200, f"pst register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "cuenta" in data
    assert data["cuenta"]["email"] == pst_credentials["email"]
    assert data["cuenta"]["empresa_id"] is None
    return data["token"]


@pytest.fixture(scope="session")
def pst_headers(pst_token):
    return {"Authorization": f"Bearer {pst_token}"}


# ---------- PST Auth ----------

class TestPSTAuth:
    def test_register_duplicate_email(self, pst_credentials, pst_token):
        # pst_token fixture already registered; re-register must fail
        r = requests.post(f"{API}/pst/register", json=pst_credentials, timeout=15)
        assert r.status_code == 400
        assert "existe" in r.text.lower() or "email" in r.text.lower()

    def test_register_short_password(self):
        r = requests.post(f"{API}/pst/register", json={
            "email": f"short_{int(time.time())}@x.com",
            "password": "abc123",
            "nombre_contacto": "Foo",
            "telefono_contacto": "555",
        }, timeout=15)
        assert r.status_code == 400

    def test_login_success(self, pst_credentials, pst_token):
        r = requests.post(f"{API}/pst/login", json={
            "email": pst_credentials["email"],
            "password": pst_credentials["password"],
        }, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_wrong_password(self, pst_credentials, pst_token):
        r = requests.post(f"{API}/pst/login", json={
            "email": pst_credentials["email"],
            "password": "wrongpass",
        }, timeout=15)
        assert r.status_code == 401

    def test_pst_me_no_profile(self, pst_headers, pst_credentials):
        r = requests.get(f"{API}/pst/me", headers=pst_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["cuenta"]["email"] == pst_credentials["email"]
        assert data["empresa"] is None


# ---------- Public Requisitos / Planes ----------

class TestPublicCatalog:
    def test_get_requisitos(self):
        r = requests.get(f"{API}/requisitos", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1, "expected seeded requisitos"
        # Should have expected keys
        keys = {"id", "nombre", "tipo_captura", "bloqueante", "activo"}
        assert keys.issubset(set(items[0].keys()))

    def test_get_planes(self):
        r = requests.get(f"{API}/planes", timeout=15)
        assert r.status_code == 200
        planes = r.json()
        assert isinstance(planes, list)
        assert len(planes) >= 1, "expected seeded planes"


# ---------- PST Profile & Submit ----------

class TestPSTProfile:
    def test_create_profile(self, pst_headers):
        payload = {
            "nombre": f"TEST_Empresa_{int(time.time())}",
            "categoria": "hospedaje",
            "descripcion": "Empresa de prueba para tests automatizados",
            "telefono": "3339876543",
        }
        r = requests.put(f"{API}/pst/perfil", headers=pst_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        emp = r.json()
        assert emp["nombre"] == payload["nombre"]
        assert emp["estado"] == "borrador"
        assert emp.get("cuenta_id") is not None

    def test_update_profile_no_new_record(self, pst_headers):
        # First fetch current empresa_id
        me = requests.get(f"{API}/pst/me", headers=pst_headers, timeout=15).json()
        empresa_id = me["empresa"]["id"]
        r = requests.put(f"{API}/pst/perfil", headers=pst_headers, json={
            "descripcion": "Descripción actualizada",
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == empresa_id
        assert r.json()["descripcion"] == "Descripción actualizada"

    def test_submit_for_payment_fails_missing_requisitos(self, pst_headers):
        # Check whether any blocking requisitos exist
        reqs = requests.get(f"{API}/requisitos", timeout=15).json()
        blocking = [r for r in reqs if r.get("bloqueante")]
        r = requests.post(f"{API}/pst/submit-for-payment", headers=pst_headers, timeout=15)
        if blocking:
            assert r.status_code == 400, f"expected block due to blocking req; got {r.status_code}: {r.text}"
        else:
            # No blocking reqs seeded -> should succeed
            assert r.status_code == 200

    def test_submit_for_payment_succeeds_with_all_completed(self, pst_headers):
        reqs = requests.get(f"{API}/requisitos", timeout=15).json()
        blocking = [r for r in reqs if r.get("bloqueante")]
        completados = []
        for req in blocking:
            entry = {"requisito_id": req["id"], "valor": "OK"}
            if req.get("documento_requerido"):
                entry["documento_url"] = "/api/files/dummy.pdf"
            completados.append(entry)
        # Update profile with completed reqs
        upd = requests.put(f"{API}/pst/perfil", headers=pst_headers, json={
            "requisitos_completados": completados,
        }, timeout=15)
        assert upd.status_code == 200

        # Ensure state is borrador (not already advanced)
        me = requests.get(f"{API}/pst/me", headers=pst_headers, timeout=15).json()
        if me["empresa"]["estado"] != "borrador":
            # reset via admin
            pass  # continue anyway
        r = requests.post(f"{API}/pst/submit-for-payment", headers=pst_headers, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["estado"] == "pendiente_pago"

    def test_document_upload(self, pst_headers):
        files = {"file": ("test.pdf", io.BytesIO(b"%PDF-1.4 fake pdf content"), "application/pdf")}
        r = requests.post(f"{API}/pst/documents/upload", headers=pst_headers, files=files, timeout=30)
        # storage may fail in test env; accept 200 or 500 (with clear error)
        if r.status_code == 500:
            pytest.skip(f"object storage not configured in test env: {r.text}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and data["url"].startswith("/api/files/")


# ---------- Admin Requisitos CRUD ----------

class TestAdminRequisitos:
    _created_id = None

    def test_admin_create_requisito(self, admin_headers):
        payload = {
            "nombre": f"TEST_Requisito_{int(time.time())}",
            "descripcion": "prueba",
            "tipo": "texto",
            "bloqueante": False,
            "documento_requerido": False,
            "activo": True,
            "orden": 99,
        }
        r = requests.post(f"{API}/admin/requisitos", headers=admin_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        TestAdminRequisitos._created_id = r.json()["id"]

    def test_admin_update_requisito(self, admin_headers):
        assert TestAdminRequisitos._created_id
        r = requests.put(
            f"{API}/admin/requisitos/{TestAdminRequisitos._created_id}",
            headers=admin_headers,
            json={"nombre": "TEST_Requisito_updated"},
            timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["nombre"] == "TEST_Requisito_updated"

    def test_admin_delete_requisito(self, admin_headers):
        assert TestAdminRequisitos._created_id
        r = requests.delete(
            f"{API}/admin/requisitos/{TestAdminRequisitos._created_id}",
            headers=admin_headers, timeout=15,
        )
        assert r.status_code == 200


# ---------- Admin Planes CRUD ----------

class TestAdminPlanes:
    _created_id = None

    def test_admin_create_plan(self, admin_headers):
        payload = {
            "nombre": f"TEST_Plan_{int(time.time())}",
            "descripcion": "test",
            "duracion_meses": 1,
            "precio": 100.0,
            "activo": True,
            "orden": 99,
        }
        r = requests.post(f"{API}/admin/planes", headers=admin_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        TestAdminPlanes._created_id = r.json()["id"]

    def test_admin_update_plan(self, admin_headers):
        assert TestAdminPlanes._created_id
        r = requests.put(
            f"{API}/admin/planes/{TestAdminPlanes._created_id}",
            headers=admin_headers, json={"precio": 150.0}, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["precio"] == 150.0

    def test_admin_delete_plan(self, admin_headers):
        assert TestAdminPlanes._created_id
        r = requests.delete(
            f"{API}/admin/planes/{TestAdminPlanes._created_id}",
            headers=admin_headers, timeout=15,
        )
        assert r.status_code == 200


# ---------- Discount codes ----------

class TestDiscountCodes:
    _codigo = None

    def test_create_codigo(self, admin_headers):
        codigo_str = f"TEST{int(time.time())}"
        r = requests.post(f"{API}/admin/codigos-descuento", headers=admin_headers, json={
            "codigo": codigo_str,
            "tipo_descuento": "porcentaje",
            "valor": 10,
            "usos_maximos": 5,
            "activo": True,
        }, timeout=15)
        assert r.status_code == 200, r.text
        TestDiscountCodes._codigo = r.json()["codigo"]

    def test_list_codigos(self, admin_headers):
        r = requests.get(f"{API}/admin/codigos-descuento", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        codes = [c["codigo"] for c in r.json()]
        assert TestDiscountCodes._codigo in codes

    def test_validate_codigo(self):
        assert TestDiscountCodes._codigo
        r = requests.post(f"{API}/codigos-descuento/validar", json={"codigo": TestDiscountCodes._codigo}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["valido"] is True
        assert d["valor"] == 10

    def test_validate_invalid_codigo(self):
        r = requests.post(f"{API}/codigos-descuento/validar", json={"codigo": "NOEXISTE_XYZ"}, timeout=15)
        assert r.status_code == 404


# ---------- Admin Empresas Afiliadas & state machine ----------

class TestEmpresasAfiliadas:
    def test_list_empresas_afiliadas(self, admin_headers, pst_headers):
        r = requests.get(f"{API}/admin/empresas-afiliadas", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        empresas = r.json()
        assert isinstance(empresas, list)
        # Our PST empresa should be in the list
        me = requests.get(f"{API}/pst/me", headers=pst_headers, timeout=15).json()
        empresa_id = me["empresa"]["id"]
        ids = [e["id"] for e in empresas]
        assert empresa_id in ids

    def test_approve_empresa(self, admin_headers, pst_headers):
        me = requests.get(f"{API}/pst/me", headers=pst_headers, timeout=15).json()
        empresa_id = me["empresa"]["id"]
        r = requests.put(
            f"{API}/admin/empresas-afiliadas/{empresa_id}/estado",
            headers=admin_headers, json={"estado": "aprobado"}, timeout=15,
        )
        assert r.status_code == 200
        assert r.json()["estado"] == "aprobado"

        # Verify persistence via listing
        listing = requests.get(f"{API}/admin/empresas-afiliadas?estado=aprobado", headers=admin_headers, timeout=20).json()
        found = next((e for e in listing if e["id"] == empresa_id), None)
        assert found is not None
        assert found["estado"] == "aprobado"
        assert found.get("activa") is True

    def test_reject_empresa(self, admin_headers, pst_headers):
        me = requests.get(f"{API}/pst/me", headers=pst_headers, timeout=15).json()
        empresa_id = me["empresa"]["id"]
        r = requests.put(
            f"{API}/admin/empresas-afiliadas/{empresa_id}/estado",
            headers=admin_headers, json={"estado": "rechazado", "motivo": "documentacion incompleta"}, timeout=15,
        )
        assert r.status_code == 200
        listing = requests.get(f"{API}/admin/empresas-afiliadas?estado=rechazado", headers=admin_headers, timeout=20).json()
        found = next((e for e in listing if e["id"] == empresa_id), None)
        assert found is not None
        assert found.get("motivo_rechazo") == "documentacion incompleta"
        assert found.get("activa") is False


# ---------- Cross-role access control ----------

class TestAccessControl:
    def test_pst_cannot_access_admin(self, pst_headers):
        r = requests.get(f"{API}/admin/requisitos", headers=pst_headers, timeout=15)
        assert r.status_code == 403

    def test_admin_cannot_access_pst(self, admin_headers):
        r = requests.get(f"{API}/pst/me", headers=admin_headers, timeout=15)
        assert r.status_code == 403

    def test_unauth_admin_endpoint(self):
        r = requests.get(f"{API}/admin/requisitos", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_login_still_works(self):
        r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        assert "token" in r.json()
