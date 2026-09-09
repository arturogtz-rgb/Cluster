"""
Bloque C: Payments (Stripe + Bank Transfer + Discount codes) - iteration 19.
Tests PST checkout flow with free plans, bank transfer, discount codes, admin transfer confirmation.
"""
import os
import time
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nature-hub-23.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"}, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json().get("access_token") or r.json()["token"]


@pytest.fixture(scope="module")
def planes():
    r = requests.get(f"{API}/planes", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 3
    return data


@pytest.fixture(scope="module")
def requisitos():
    r = requests.get(f"{API}/requisitos", timeout=15)
    assert r.status_code == 200
    return r.json()


def _register_and_prepare_pst(requisitos, submit=True, email_prefix="pstc"):
    """Register PST, create profile, upload doc for blocking requirements, submit for payment."""
    ts = int(time.time() * 1000)
    email = f"TEST_{email_prefix}_{ts}@test.com"
    reg = requests.post(f"{API}/pst/register", json={
        "email": email, "password": "password123",
        "nombre_contacto": "Test Contact", "telefono_contacto": "3311112222",
    }, timeout=15)
    assert reg.status_code == 200, reg.text
    token = reg.json()["token"]
    h = {"Authorization": f"Bearer {token}"}

    # Create profile
    r = requests.put(f"{API}/pst/perfil", headers=h, json={
        "nombre": f"Empresa Test {ts}",
        "categoria": "aventura",
        "descripcion": "Empresa de pruebas para bloque C de pagos con Stripe y transferencia bancaria.",
        "telefono": "3311112222",
    }, timeout=15)
    assert r.status_code == 200, r.text

    if not submit:
        return token, email

    # Complete blocking requirements (use fake document URL - storage may not be available in CI)
    blocking = [x for x in requisitos if x.get("activo") and x.get("bloqueante")]
    completados = []
    for req in blocking:
        entry = {"requisito_id": req["id"], "valor": "Completado"}
        if req.get("documento_requerido"):
            entry["documento_url"] = "/api/files/test-placeholder.pdf"
        completados.append(entry)

    r = requests.put(f"{API}/pst/perfil", headers=h, json={"requisitos_completados": completados}, timeout=15)
    assert r.status_code == 200, r.text

    # Submit for payment
    r = requests.post(f"{API}/pst/submit-for-payment", headers=h, timeout=15)
    assert r.status_code == 200, r.text
    return token, email


# ---------- Tests ----------

class TestCheckoutFreePlan:
    def test_free_plan_activates_and_advances_empresa(self, planes, requisitos):
        token, _ = _register_and_prepare_pst(requisitos, email_prefix="free")
        h = {"Authorization": f"Bearer {token}"}
        plan = planes[0]

        r = requests.post(f"{API}/pst/checkout", headers=h, json={
            "plan_id": plan["id"], "metodo_pago": "stripe",
            "origin_url": BASE_URL,
        }, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "free"
        assert "message" in data

        # Verify empresa state
        me = requests.get(f"{API}/pst/me", headers=h, timeout=15).json()
        assert me["empresa"]["estado"] == "pendiente_aprobacion"


class TestCheckoutBankTransfer:
    def test_transfer_returns_bank_details(self, planes, requisitos, admin_token):
        # First set some bank details as admin
        ah = {"Authorization": f"Bearer {admin_token}"}
        requests.put(f"{API}/settings", headers=ah, json={
            "banco_nombre": "BBVA Test",
            "banco_clabe": "012345678901234567",
            "banco_titular": "Cluster Turismo",
        }, timeout=15)

        # For transfer flow to work we need precio > 0. Create a paid plan.
        p = requests.post(f"{API}/admin/planes", headers=ah, json={
            "nombre": "TEST_Plan_Paid", "duracion_meses": 1, "precio": 500.0,
            "moneda": "MXN", "descripcion": "Test paid", "beneficios": [], "activo": True, "orden": 99,
        }, timeout=15)
        assert p.status_code == 200, p.text
        paid_plan_id = p.json()["id"]

        try:
            token, _ = _register_and_prepare_pst(requisitos, email_prefix="transfer")
            h = {"Authorization": f"Bearer {token}"}

            r = requests.post(f"{API}/pst/checkout", headers=h, json={
                "plan_id": paid_plan_id, "metodo_pago": "transferencia",
                "origin_url": BASE_URL,
            }, timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["status"] == "transfer"
            assert "banco" in data
            assert data["banco"]["nombre"] == "BBVA Test"
            assert data["banco"]["clabe"] == "012345678901234567"
            assert data["banco"]["titular"] == "Cluster Turismo"
            assert "suscripcion_id" in data
            assert data["monto"] == 500.0
        finally:
            requests.delete(f"{API}/admin/planes/{paid_plan_id}", headers=ah, timeout=15)


class TestCheckoutDiscountCode:
    def test_discount_code_applied(self, planes, requisitos, admin_token):
        ah = {"Authorization": f"Bearer {admin_token}"}
        # Create a 100% discount code
        codigo = f"TEST_C_{int(time.time())}"
        r = requests.post(f"{API}/admin/codigos-descuento", headers=ah, json={
            "codigo": codigo, "tipo_descuento": "porcentaje", "valor": 100,
            "usos_maximos": 10, "activo": True,
        }, timeout=15)
        assert r.status_code == 200, r.text
        codigo_id = r.json()["id"]

        # Create a paid plan
        p = requests.post(f"{API}/admin/planes", headers=ah, json={
            "nombre": "TEST_Plan_Discount", "duracion_meses": 1, "precio": 1000.0,
            "moneda": "MXN", "descripcion": "d", "beneficios": [], "activo": True, "orden": 98,
        }, timeout=15).json()

        try:
            token, _ = _register_and_prepare_pst(requisitos, email_prefix="disc")
            h = {"Authorization": f"Bearer {token}"}
            r = requests.post(f"{API}/pst/checkout", headers=h, json={
                "plan_id": p["id"], "metodo_pago": "stripe",
                "codigo_descuento": codigo, "origin_url": BASE_URL,
            }, timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            # 100% discount should trigger free
            assert data["status"] == "free"
        finally:
            requests.delete(f"{API}/admin/planes/{p['id']}", headers=ah, timeout=15)
            requests.delete(f"{API}/admin/codigos-descuento/{codigo_id}", headers=ah, timeout=15)

    def test_invalid_discount_code_returns_400(self, planes, requisitos):
        token, _ = _register_and_prepare_pst(requisitos, email_prefix="baddisc")
        h = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{API}/pst/checkout", headers=h, json={
            "plan_id": planes[0]["id"], "metodo_pago": "stripe",
            "codigo_descuento": "NOEXISTE_XYZ", "origin_url": BASE_URL,
        }, timeout=30)
        assert r.status_code == 400


class TestCheckoutValidation:
    def test_checkout_fails_when_empresa_not_pendiente_pago(self, planes, requisitos):
        # Register but don't submit for payment (state = borrador)
        token, _ = _register_and_prepare_pst(requisitos, submit=False, email_prefix="nosubmit")
        h = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{API}/pst/checkout", headers=h, json={
            "plan_id": planes[0]["id"], "metodo_pago": "stripe", "origin_url": BASE_URL,
        }, timeout=30)
        assert r.status_code == 400

    def test_checkout_fails_invalid_plan(self, requisitos):
        token, _ = _register_and_prepare_pst(requisitos, email_prefix="badplan")
        h = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{API}/pst/checkout", headers=h, json={
            "plan_id": "nonexistent-plan-id", "metodo_pago": "stripe", "origin_url": BASE_URL,
        }, timeout=30)
        assert r.status_code == 404


class TestPaymentStatus:
    def test_payment_status_nonexistent_returns_401_without_auth(self):
        """Endpoint now requires PST auth — unauthenticated returns 401/403."""
        r = requests.get(f"{API}/pst/payment-status/cs_nonexistent_123", timeout=15)
        assert r.status_code in (401, 403)


class TestAdminSubscriptions:
    def test_get_all_subscriptions(self, admin_token):
        ah = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{API}/admin/suscripciones", headers=ah, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_confirm_transfer_flow(self, planes, requisitos, admin_token):
        ah = {"Authorization": f"Bearer {admin_token}"}
        # Set bank details
        requests.put(f"{API}/settings", headers=ah, json={
            "banco_nombre": "BBVA", "banco_clabe": "012345678901234567", "banco_titular": "T",
        }, timeout=15)
        # Create paid plan
        p = requests.post(f"{API}/admin/planes", headers=ah, json={
            "nombre": "TEST_Plan_Conf", "duracion_meses": 1, "precio": 300.0,
            "moneda": "MXN", "descripcion": "d", "beneficios": [], "activo": True, "orden": 97,
        }, timeout=15).json()

        try:
            token, _ = _register_and_prepare_pst(requisitos, email_prefix="conf")
            h = {"Authorization": f"Bearer {token}"}
            r = requests.post(f"{API}/pst/checkout", headers=h, json={
                "plan_id": p["id"], "metodo_pago": "transferencia", "origin_url": BASE_URL,
            }, timeout=30)
            assert r.status_code == 200, r.text
            sub_id = r.json()["suscripcion_id"]

            # Admin confirms
            r = requests.post(f"{API}/admin/suscripciones/{sub_id}/confirmar-transferencia",
                              headers=ah, timeout=15)
            assert r.status_code == 200, r.text

            # Verify empresa advanced
            me = requests.get(f"{API}/pst/me", headers=h, timeout=15).json()
            assert me["empresa"]["estado"] == "pendiente_aprobacion"

            # Confirm again should fail (already activa)
            r = requests.post(f"{API}/admin/suscripciones/{sub_id}/confirmar-transferencia",
                              headers=ah, timeout=15)
            assert r.status_code == 400

            # Non-existent
            r = requests.post(f"{API}/admin/suscripciones/nonexistent/confirmar-transferencia",
                              headers=ah, timeout=15)
            assert r.status_code == 404
        finally:
            requests.delete(f"{API}/admin/planes/{p['id']}", headers=ah, timeout=15)
