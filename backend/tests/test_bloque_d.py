"""Bloque D tests: notifications module, payment-status auth+ownership, stripe key no fallback."""
import io
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nature-hub-23.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# -------- Public API used by Afiliate landing --------
class TestAfiliateAPIData:
    def test_planes_returns_3(self):
        r = requests.get(f"{API}/planes")
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 3

    def test_requisitos_returns_5(self):
        r = requests.get(f"{API}/requisitos")
        assert r.status_code == 200
        assert len(r.json()) == 5

    def test_categorias_dynamic(self):
        r = requests.get(f"{API}/categorias")
        assert r.status_code == 200
        cats = r.json().get("categorias", [])
        assert len(cats) >= 1
        assert "nombre" in cats[0] and "slug" in cats[0]


# -------- Notifications module --------
class TestNotificationsModule:
    def test_module_imports_and_functions_exist(self):
        import importlib, sys
        sys.path.insert(0, BACKEND_DIR)
        mod = importlib.import_module("notifications")
        for name in [
            "send_registration_email",
            "send_payment_confirmed_email",
            "send_profile_approved_email",
            "send_profile_rejected_email",
            "send_expiration_reminder_email",
        ]:
            assert hasattr(mod, name), f"missing {name}"
            assert callable(getattr(mod, name))

    def test_send_gracefully_fails_without_smtp(self):
        import importlib, sys
        sys.path.insert(0, BACKEND_DIR)
        mod = importlib.import_module("notifications")
        # Should not raise even if SMTP is not configured
        mod.send_registration_email("nobody@example.com", "Test")

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..")


# -------- Stripe key: no fallback --------
class TestStripeKeyNoFallback:
    def test_payments_module_no_fallback(self):
        with open(os.path.join(BACKEND_DIR, "routes", "payments.py")) as f:
            content = f.read()
        # No hardcoded emergent test key
        assert "sk_test_emergent" not in content
        # Uses db.settings as primary source (not module-level stripe.api_key =)
        assert "_get_stripe_config" in content
        assert "db.settings" in content


# -------- payment-status ownership check --------
def _register_pst(prefix="TEST_bloqued"):
    ts = int(time.time() * 1000)
    email = f"{prefix}_{ts}@test.com"
    r = requests.post(f"{API}/pst/register", json={
        "email": email, "password": "password12345",
        "nombre_contacto": "Bloque D Tester", "telefono_contacto": "1234567890",
    })
    assert r.status_code == 200, r.text
    return r.json()["token"], r.json()["cuenta"]["id"], email


class TestPaymentStatusAuth:
    def test_payment_status_requires_auth(self):
        # No token -> 401/403
        r = requests.get(f"{API}/pst/payment-status/fake_session_id")
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"

    def test_payment_status_nonexistent_authed(self):
        token, _, _ = _register_pst()
        r = requests.get(
            f"{API}/pst/payment-status/nonexistent_session",
            headers={"Authorization": f"Bearer {token}"},
        )
        # 404 because record doesn't exist
        assert r.status_code == 404

    def test_payment_status_ownership_403(self):
        # Setup: manually insert a payment_transactions record owned by user A,
        # then user B tries to access → 403.
        import asyncio, sys
        sys.path.insert(0, BACKEND_DIR)
        from database import db

        token_a, cuenta_a, _ = _register_pst("TEST_bloqued_a")
        token_b, cuenta_b, _ = _register_pst("TEST_bloqued_b")
        session_id = f"cs_test_bloqued_{int(time.time()*1000)}"

        async def _insert():
            await db.payment_transactions.insert_one({
                "session_id": session_id,
                "cuenta_id": cuenta_a,
                "empresa_id": "fake_empresa",
                "plan_id": "fake_plan",
                "amount": 100,
                "currency": "mxn",
                "status": "initiated",
                "payment_status": "pending",
            })

        asyncio.get_event_loop().run_until_complete(_insert()) if False else asyncio.new_event_loop().run_until_complete(_insert())

        try:
            r = requests.get(
                f"{API}/pst/payment-status/{session_id}",
                headers={"Authorization": f"Bearer {token_b}"},
            )
            assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text}"

            # Owner (A) should get 200 (or upstream error), NOT 403
            r2 = requests.get(
                f"{API}/pst/payment-status/{session_id}",
                headers={"Authorization": f"Bearer {token_a}"},
            )
            assert r2.status_code == 200, f"owner should have access, got {r2.status_code}"
        finally:
            # Use sync pymongo for cleanup to avoid event loop issues
            from pymongo import MongoClient
            mc = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
            mc[os.environ.get("DB_NAME", "test_database")].payment_transactions.delete_one({"session_id": session_id})
            mc.close()


# -------- Registration triggers email (backend logs warning) --------
class TestRegistrationTriggersEmail:
    def test_registration_success_still_returns_token(self):
        # Even without SMTP, /pst/register should succeed thanks to try/except
        token, _, _ = _register_pst("TEST_bloqued_reg")
        assert token


# -------- Admin approve/reject triggers email --------
def _admin_login():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


class TestAdminApproveRejectEmail:
    def test_admin_can_call_estado_endpoint(self):
        """We just verify the endpoint exists and the code path executes with an
        existing empresa. The email will 'graceful-fail' due to no SMTP."""
        admin_token = _admin_login()
        # Get any empresa with cuenta_id
        r = requests.get(
            f"{API}/admin/empresas-afiliadas",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        empresas = r.json()
        if not empresas:
            pytest.skip("No affiliated empresas to test approve/reject on")
        emp = empresas[0]
        orig_estado = emp["estado"]
        # Toggle rechazado <-> orig
        r2 = requests.put(
            f"{API}/admin/empresas-afiliadas/{emp['id']}/estado",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"estado": "rechazado", "motivo": "TEST_bloqued rejection"},
        )
        assert r2.status_code == 200
        # revert
        requests.put(
            f"{API}/admin/empresas-afiliadas/{emp['id']}/estado",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"estado": orig_estado},
        )
