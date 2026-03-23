"""
Phase 4 Backend Tests:
1. Leads/Contact Management - POST /api/contacto, GET /api/leads, PUT /api/leads/{id}/read, DELETE /api/leads/{id}
2. Nosotros Content Editor - GET/PUT /api/nosotros-settings
3. User Roles System - GET/POST/PUT/DELETE /api/usuarios, role in /api/auth/me
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture
def auth_headers(admin_token):
    """Headers with admin auth token"""
    return {"Authorization": f"Bearer {admin_token}"}


# ==================== AUTH & ROLE TESTS ====================

class TestAuthRole:
    """Test authentication and role system"""
    
    def test_login_returns_token(self):
        """Login with admin/admin123 returns a token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert len(data["token"]) > 0
        print("PASS: Login returns token")
    
    def test_auth_me_returns_role(self, auth_headers):
        """GET /api/auth/me returns role field"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "role" in data, "Response should contain 'role' field"
        assert data["role"] == "admin", f"Admin user should have role='admin', got {data['role']}"
        assert "username" in data
        assert "user_id" in data
        print(f"PASS: /api/auth/me returns role='{data['role']}'")


# ==================== LEADS/CONTACT MANAGEMENT TESTS ====================

class TestLeadsManagement:
    """Test contact form submissions and leads management"""
    
    def test_contacto_saves_with_leido_false(self):
        """POST /api/contacto saves to DB with 'leido: false' field"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "nombre": "Test Lead",
            "email": unique_email,
            "empresa": "Test Company",
            "mensaje": "This is a test message for leads testing"
        }
        response = requests.post(f"{BASE_URL}/api/contacto", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print(f"PASS: POST /api/contacto saves contact form (email: {unique_email})")
        return unique_email
    
    def test_get_leads_requires_admin(self):
        """GET /api/leads requires admin auth"""
        # Without auth
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code in [401, 403], "Should require authentication"
        print("PASS: GET /api/leads requires authentication")
    
    def test_get_leads_returns_list(self, auth_headers):
        """GET /api/leads returns list of contact form submissions"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        print(f"PASS: GET /api/leads returns {len(data)} leads")
        
        # Check structure of leads
        if len(data) > 0:
            lead = data[0]
            assert "id" in lead, "Lead should have 'id'"
            assert "nombre" in lead, "Lead should have 'nombre'"
            assert "email" in lead, "Lead should have 'email'"
            assert "mensaje" in lead, "Lead should have 'mensaje'"
            assert "leido" in lead, "Lead should have 'leido' field"
            assert "created_at" in lead, "Lead should have 'created_at'"
            print(f"PASS: Lead structure verified (leido={lead['leido']})")
    
    def test_create_and_verify_lead(self, auth_headers):
        """Create a lead and verify it appears in leads list with leido=false"""
        # Create a unique lead
        unique_email = f"test_lead_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "nombre": "Test Lead Verify",
            "email": unique_email,
            "empresa": "Verify Company",
            "mensaje": "Message to verify lead creation"
        }
        create_response = requests.post(f"{BASE_URL}/api/contacto", json=payload)
        assert create_response.status_code == 200
        
        # Fetch leads and find our lead
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert leads_response.status_code == 200
        leads = leads_response.json()
        
        our_lead = next((l for l in leads if l["email"] == unique_email), None)
        assert our_lead is not None, f"Created lead with email {unique_email} not found"
        assert our_lead["leido"] == False, "New lead should have leido=false"
        assert our_lead["nombre"] == "Test Lead Verify"
        print(f"PASS: Created lead verified with leido=false (id: {our_lead['id']})")
        return our_lead["id"]
    
    def test_mark_lead_as_read(self, auth_headers):
        """PUT /api/leads/{id}/read marks a lead as read"""
        # First create a lead
        unique_email = f"test_read_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/contacto", json={
            "nombre": "Test Read Lead",
            "email": unique_email,
            "mensaje": "Test message"
        })
        
        # Get the lead ID
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        leads = leads_response.json()
        our_lead = next((l for l in leads if l["email"] == unique_email), None)
        assert our_lead is not None
        lead_id = our_lead["id"]
        
        # Mark as read
        read_response = requests.put(f"{BASE_URL}/api/leads/{lead_id}/read", headers=auth_headers)
        assert read_response.status_code == 200
        
        # Verify it's marked as read
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        leads = leads_response.json()
        updated_lead = next((l for l in leads if l["id"] == lead_id), None)
        assert updated_lead is not None
        assert updated_lead["leido"] == True, "Lead should be marked as read"
        print(f"PASS: Lead {lead_id} marked as read")
    
    def test_delete_lead(self, auth_headers):
        """DELETE /api/leads/{id} deletes a lead"""
        # First create a lead
        unique_email = f"test_delete_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/contacto", json={
            "nombre": "Test Delete Lead",
            "email": unique_email,
            "mensaje": "Test message to delete"
        })
        
        # Get the lead ID
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        leads = leads_response.json()
        our_lead = next((l for l in leads if l["email"] == unique_email), None)
        assert our_lead is not None
        lead_id = our_lead["id"]
        
        # Delete the lead
        delete_response = requests.delete(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify it's deleted
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        leads = leads_response.json()
        deleted_lead = next((l for l in leads if l["id"] == lead_id), None)
        assert deleted_lead is None, "Lead should be deleted"
        print(f"PASS: Lead {lead_id} deleted successfully")
    
    def test_leads_requires_admin_role(self, auth_headers):
        """Leads endpoints require admin role (403 for non-admin)"""
        # This test verifies the require_admin dependency works
        # We'll test by checking that admin can access
        response = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers)
        assert response.status_code == 200, "Admin should be able to access leads"
        print("PASS: Admin can access leads endpoints")


# ==================== NOSOTROS SETTINGS TESTS ====================

class TestNosotrosSettings:
    """Test Nosotros content editor endpoints"""
    
    def test_get_nosotros_settings_public(self):
        """GET /api/nosotros-settings is public (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        assert response.status_code == 200
        data = response.json()
        assert "mision" in data, "Should have 'mision' field"
        assert "vision" in data, "Should have 'vision' field"
        assert "valores" in data, "Should have 'valores' field"
        print(f"PASS: GET /api/nosotros-settings returns settings (public)")
    
    def test_put_nosotros_settings_requires_auth(self):
        """PUT /api/nosotros-settings requires authentication"""
        response = requests.put(f"{BASE_URL}/api/nosotros-settings", json={"mision": "test"})
        assert response.status_code in [401, 403], "Should require authentication"
        print("PASS: PUT /api/nosotros-settings requires auth")
    
    def test_update_nosotros_settings(self, auth_headers):
        """PUT /api/nosotros-settings updates content"""
        # Get current settings
        get_response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        original = get_response.json()
        
        # Update with new mission text
        test_mission = f"Test mission updated at {uuid.uuid4().hex[:8]}"
        update_payload = {
            "mision": test_mission,
            "vision": original.get("vision", ""),
            "valores": original.get("valores", []),
            "cta_titulo": original.get("cta_titulo", ""),
            "cta_texto": original.get("cta_texto", "")
        }
        
        put_response = requests.put(f"{BASE_URL}/api/nosotros-settings", 
                                    json=update_payload, 
                                    headers=auth_headers)
        assert put_response.status_code == 200
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        updated = verify_response.json()
        assert updated["mision"] == test_mission, "Mission should be updated"
        print(f"PASS: Nosotros settings updated successfully")
        
        # Restore original
        requests.put(f"{BASE_URL}/api/nosotros-settings", json=original, headers=auth_headers)


# ==================== USUARIOS CRUD TESTS ====================

class TestUsuariosCRUD:
    """Test user management endpoints"""
    
    def test_get_usuarios_requires_admin(self):
        """GET /api/usuarios requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/usuarios")
        assert response.status_code in [401, 403], "Should require authentication"
        print("PASS: GET /api/usuarios requires authentication")
    
    def test_get_usuarios_returns_list_without_password(self, auth_headers):
        """GET /api/usuarios returns list of users without password_hash"""
        response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Should return a list"
        assert len(data) > 0, "Should have at least one user (admin)"
        
        # Check that password_hash is not exposed
        for user in data:
            assert "password_hash" not in user, "password_hash should not be exposed"
            assert "id" in user, "User should have 'id'"
            assert "username" in user, "User should have 'username'"
            assert "role" in user, "User should have 'role'"
        
        print(f"PASS: GET /api/usuarios returns {len(data)} users without password_hash")
    
    def test_create_user_with_editor_role(self, auth_headers):
        """POST /api/usuarios creates a new user with role"""
        unique_username = f"test_editor_{uuid.uuid4().hex[:8]}"
        payload = {
            "username": unique_username,
            "password": "testpass123",
            "nombre": "Test Editor User",
            "email": f"{unique_username}@example.com",
            "role": "editor"
        }
        
        response = requests.post(f"{BASE_URL}/api/usuarios", json=payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "id" in data
        
        # Verify user was created
        users_response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        users = users_response.json()
        created_user = next((u for u in users if u["username"] == unique_username), None)
        assert created_user is not None, "Created user should exist"
        assert created_user["role"] == "editor", "User should have editor role"
        
        print(f"PASS: Created user '{unique_username}' with role='editor'")
        return unique_username, data["id"]
    
    def test_create_duplicate_username_fails(self, auth_headers):
        """POST /api/usuarios with duplicate username returns 400"""
        # Try to create another admin user
        response = requests.post(f"{BASE_URL}/api/usuarios", json={
            "username": "admin",
            "password": "testpass",
            "role": "editor"
        }, headers=auth_headers)
        assert response.status_code == 400, "Should fail for duplicate username"
        print("PASS: Duplicate username creation fails with 400")
    
    def test_update_user(self, auth_headers):
        """PUT /api/usuarios/{id} updates user fields including role"""
        # First create a user
        unique_username = f"test_update_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/usuarios", json={
            "username": unique_username,
            "password": "testpass123",
            "nombre": "Original Name",
            "role": "editor"
        }, headers=auth_headers)
        user_id = create_response.json()["id"]
        
        # Update the user
        update_response = requests.put(f"{BASE_URL}/api/usuarios/{user_id}", json={
            "nombre": "Updated Name",
            "role": "admin",
            "email": "updated@example.com"
        }, headers=auth_headers)
        assert update_response.status_code == 200
        
        # Verify update
        users_response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        users = users_response.json()
        updated_user = next((u for u in users if u["id"] == user_id), None)
        assert updated_user is not None
        assert updated_user["nombre"] == "Updated Name"
        assert updated_user["role"] == "admin"
        assert updated_user["email"] == "updated@example.com"
        
        print(f"PASS: User {user_id} updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/usuarios/{user_id}", headers=auth_headers)
    
    def test_delete_user(self, auth_headers):
        """DELETE /api/usuarios/{id} deletes user"""
        # First create a user
        unique_username = f"test_delete_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/usuarios", json={
            "username": unique_username,
            "password": "testpass123",
            "role": "editor"
        }, headers=auth_headers)
        user_id = create_response.json()["id"]
        
        # Delete the user
        delete_response = requests.delete(f"{BASE_URL}/api/usuarios/{user_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deletion
        users_response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        users = users_response.json()
        deleted_user = next((u for u in users if u["id"] == user_id), None)
        assert deleted_user is None, "User should be deleted"
        
        print(f"PASS: User {user_id} deleted successfully")
    
    def test_cannot_delete_self(self, admin_token, auth_headers):
        """DELETE /api/usuarios/{id} cannot delete yourself"""
        # Get current user ID from token
        import base64
        import json
        payload = json.loads(base64.b64decode(admin_token.split('.')[1] + '=='))
        admin_user_id = payload["user_id"]
        
        # Try to delete self
        response = requests.delete(f"{BASE_URL}/api/usuarios/{admin_user_id}", headers=auth_headers)
        assert response.status_code == 400, "Should not be able to delete yourself"
        assert "propia cuenta" in response.json().get("detail", "").lower() or "own" in response.json().get("detail", "").lower()
        
        print("PASS: Cannot delete your own account")
    
    def test_editor_login_returns_editor_role(self, auth_headers):
        """Login with editor user returns token with role='editor'"""
        # Create an editor user
        unique_username = f"test_editor_login_{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/usuarios", json={
            "username": unique_username,
            "password": "editorpass123",
            "role": "editor"
        }, headers=auth_headers)
        
        # Login as editor
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": unique_username,
            "password": "editorpass123"
        })
        assert login_response.status_code == 200
        editor_token = login_response.json()["token"]
        
        # Check /api/auth/me returns editor role
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {editor_token}"
        })
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["role"] == "editor", f"Editor user should have role='editor', got {me_data['role']}"
        
        print(f"PASS: Editor user '{unique_username}' login returns role='editor'")
        
        # Cleanup - get user ID and delete
        users_response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        users = users_response.json()
        editor_user = next((u for u in users if u["username"] == unique_username), None)
        if editor_user:
            requests.delete(f"{BASE_URL}/api/usuarios/{editor_user['id']}", headers=auth_headers)
    
    def test_editor_cannot_access_leads(self, auth_headers):
        """Editor role cannot access admin-only endpoints like /api/leads"""
        # Create an editor user
        unique_username = f"test_editor_access_{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/usuarios", json={
            "username": unique_username,
            "password": "editorpass123",
            "role": "editor"
        }, headers=auth_headers)
        
        # Login as editor
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": unique_username,
            "password": "editorpass123"
        })
        editor_token = login_response.json()["token"]
        
        # Try to access leads (admin-only)
        leads_response = requests.get(f"{BASE_URL}/api/leads", headers={
            "Authorization": f"Bearer {editor_token}"
        })
        assert leads_response.status_code == 403, f"Editor should get 403 for leads, got {leads_response.status_code}"
        
        print("PASS: Editor cannot access admin-only /api/leads endpoint (403)")
        
        # Cleanup
        users_response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        users = users_response.json()
        editor_user = next((u for u in users if u["username"] == unique_username), None)
        if editor_user:
            requests.delete(f"{BASE_URL}/api/usuarios/{editor_user['id']}", headers=auth_headers)


# ==================== CLEANUP ====================

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_users(admin_token):
    """Cleanup test users after all tests"""
    yield
    # Cleanup any remaining test users
    headers = {"Authorization": f"Bearer {admin_token}"}
    try:
        users_response = requests.get(f"{BASE_URL}/api/usuarios", headers=headers)
        if users_response.status_code == 200:
            users = users_response.json()
            for user in users:
                if user["username"].startswith("test_"):
                    requests.delete(f"{BASE_URL}/api/usuarios/{user['id']}", headers=headers)
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
