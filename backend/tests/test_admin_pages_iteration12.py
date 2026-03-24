"""
Test suite for Admin Pages Bug Fix - Iteration 12
Tests that all admin-related API endpoints return correct data types (arrays)
to prevent 't.map is not a function' errors in the frontend.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAPIs:
    """Test all admin-related API endpoints return correct data types"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token for authenticated endpoints"""
        self.token = None
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            if response.status_code == 200:
                self.token = response.json().get("token")
        except Exception as e:
            pytest.skip(f"Could not authenticate: {e}")
    
    def get_auth_headers(self):
        """Return auth headers if token available"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    # Public endpoints (no auth required)
    
    def test_empresas_returns_array(self):
        """GET /api/empresas should return an array"""
        response = requests.get(f"{BASE_URL}/api/empresas", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"✓ /api/empresas returns array with {len(data)} items")
    
    def test_actividades_returns_array(self):
        """GET /api/actividades should return an array"""
        response = requests.get(f"{BASE_URL}/api/actividades", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"✓ /api/actividades returns array with {len(data)} items")
    
    def test_articulos_returns_array(self):
        """GET /api/articulos should return an array"""
        response = requests.get(f"{BASE_URL}/api/articulos", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"✓ /api/articulos returns array with {len(data)} items")
    
    def test_categorias_returns_object_with_array(self):
        """GET /api/categorias should return object with categorias array"""
        response = requests.get(f"{BASE_URL}/api/categorias", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected object, got {type(data)}"
        assert "categorias" in data, "Response should have 'categorias' key"
        assert isinstance(data["categorias"], list), f"categorias should be array"
        print(f"✓ /api/categorias returns object with {len(data['categorias'])} categories")
    
    # Authenticated endpoints (require auth token)
    
    def test_usuarios_returns_array(self):
        """GET /api/usuarios should return an array (requires auth)"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/usuarios",
            headers=self.get_auth_headers(),
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"✓ /api/usuarios returns array with {len(data)} users")
    
    def test_leads_returns_array(self):
        """GET /api/leads should return an array (requires auth)"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers=self.get_auth_headers(),
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"✓ /api/leads returns array with {len(data)} leads")
    
    def test_media_returns_array(self):
        """GET /api/media should return an array (requires auth)"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/media",
            headers=self.get_auth_headers(),
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected array, got {type(data)}"
        print(f"✓ /api/media returns array with {len(data)} files")
    
    def test_nosotros_settings_returns_object(self):
        """GET /api/nosotros-settings should return object with arrays"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected object, got {type(data)}"
        # valores and stats should be arrays if present
        if "valores" in data:
            assert isinstance(data["valores"], list), "valores should be array"
        if "stats" in data:
            assert isinstance(data["stats"], list), "stats should be array"
        print(f"✓ /api/nosotros-settings returns object with correct structure")
    
    def test_analytics_overview(self):
        """GET /api/analytics/overview should return object"""
        if not self.token:
            pytest.skip("No auth token available")
        
        response = requests.get(
            f"{BASE_URL}/api/analytics/overview",
            headers=self.get_auth_headers(),
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected object, got {type(data)}"
        print(f"✓ /api/analytics/overview returns object")


class TestAuthFlow:
    """Test authentication flow"""
    
    def test_login_returns_token(self):
        """POST /api/auth/login should return token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data, "Response should have 'token' key"
        assert isinstance(data["token"], str), "token should be string"
        assert len(data["token"]) > 0, "token should not be empty"
        print(f"✓ /api/auth/login returns valid token")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong credentials should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "wrong", "password": "wrong"},
            timeout=10
        )
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
        print(f"✓ /api/auth/login rejects invalid credentials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
