"""
Test suite for Bug Fix Iteration 11 - t.map is not a function fix
Tests all API endpoints to verify they return proper arrays/objects
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://jalisco-nature-hub.preview.emergentagent.com')

class TestAPIEndpointsReturnCorrectTypes:
    """Verify all API endpoints return correct data types (arrays/objects)"""
    
    def test_empresas_returns_array(self):
        """GET /api/empresas should return an array"""
        response = requests.get(f"{BASE_URL}/api/empresas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/empresas: {len(data)} empresas returned")
    
    def test_articulos_returns_array(self):
        """GET /api/articulos should return an array"""
        response = requests.get(f"{BASE_URL}/api/articulos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/articulos: {len(data)} articulos returned")
    
    def test_actividades_returns_array(self):
        """GET /api/actividades should return an array"""
        response = requests.get(f"{BASE_URL}/api/actividades")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/actividades: {len(data)} actividades returned")
    
    def test_categorias_returns_object_with_array(self):
        """GET /api/categorias should return object with categorias array"""
        response = requests.get(f"{BASE_URL}/api/categorias")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        assert "categorias" in data, "Response should have 'categorias' key"
        assert isinstance(data["categorias"], list), f"categorias should be list, got {type(data['categorias'])}"
        print(f"GET /api/categorias: {len(data['categorias'])} categorias returned")
    
    def test_analytics_overview_returns_totales_object(self):
        """GET /api/analytics/overview should return object with totales"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        assert "totales" in data, "Response should have 'totales' key"
        assert isinstance(data["totales"], dict), f"totales should be dict, got {type(data['totales'])}"
        
        # Verify totales structure
        totales = data["totales"]
        assert "empresas" in totales
        assert "articulos" in totales
        assert "actividades" in totales
        assert "leads" in totales
        print(f"GET /api/analytics/overview: totales={totales}")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data, "Response should have 'token' key"
        assert isinstance(data["token"], str), "Token should be string"
        assert len(data["token"]) > 0, "Token should not be empty"
        print(f"POST /api/auth/login: token received (length={len(data['token'])})")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401
        print("POST /api/auth/login with invalid credentials: 401 returned correctly")


class TestEmpresaDetailEndpoint:
    """Test empresa detail endpoint"""
    
    def test_empresa_detail_by_slug(self):
        """GET /api/empresas/{slug} returns empresa with correct structure"""
        response = requests.get(f"{BASE_URL}/api/empresas/ecomuk-aventura-natural")
        assert response.status_code == 200
        data = response.json()
        
        # Verify empresa structure
        assert "nombre" in data
        assert "slug" in data
        assert "categoria" in data
        assert "descripcion" in data
        
        # Verify actividades is array or None
        if "actividades" in data and data["actividades"] is not None:
            assert isinstance(data["actividades"], list), f"actividades should be list, got {type(data['actividades'])}"
        
        # Verify galeria is array or None
        if "galeria" in data and data["galeria"] is not None:
            assert isinstance(data["galeria"], list), f"galeria should be list, got {type(data['galeria'])}"
        
        # Verify social_links is dict or None
        if "social_links" in data and data["social_links"] is not None:
            assert isinstance(data["social_links"], dict), f"social_links should be dict, got {type(data['social_links'])}"
        
        print(f"GET /api/empresas/ecomuk-aventura-natural: {data['nombre']} returned with correct structure")
    
    def test_empresa_not_found(self):
        """GET /api/empresas/{invalid-slug} returns 404"""
        response = requests.get(f"{BASE_URL}/api/empresas/non-existent-empresa-slug")
        assert response.status_code == 404
        print("GET /api/empresas/non-existent-empresa-slug: 404 returned correctly")


class TestFilteredEndpoints:
    """Test filtered API endpoints"""
    
    def test_empresas_with_destacada_filter(self):
        """GET /api/empresas?destacada=true returns array of featured empresas"""
        response = requests.get(f"{BASE_URL}/api/empresas?destacada=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/empresas?destacada=true: {len(data)} featured empresas returned")
    
    def test_empresas_with_activa_filter(self):
        """GET /api/empresas?activa=true returns array of active empresas"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/empresas?activa=true: {len(data)} active empresas returned")
    
    def test_articulos_with_publicado_filter(self):
        """GET /api/articulos?publicado=true returns array of published articulos"""
        response = requests.get(f"{BASE_URL}/api/articulos?publicado=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/articulos?publicado=true: {len(data)} published articulos returned")
    
    def test_actividades_with_activa_filter(self):
        """GET /api/actividades?activa=true returns array of active actividades"""
        response = requests.get(f"{BASE_URL}/api/actividades?activa=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"GET /api/actividades?activa=true: {len(data)} active actividades returned")


class TestSettingsEndpoints:
    """Test settings endpoints"""
    
    def test_settings_endpoint(self):
        """GET /api/settings returns settings object"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        print(f"GET /api/settings: settings returned")
    
    def test_nosotros_settings_endpoint(self):
        """GET /api/nosotros-settings returns nosotros settings"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"
        
        # Verify expected keys
        if "mision" in data:
            assert isinstance(data["mision"], str)
        if "vision" in data:
            assert isinstance(data["vision"], str)
        if "valores" in data and data["valores"] is not None:
            assert isinstance(data["valores"], list)
        
        print(f"GET /api/nosotros-settings: nosotros settings returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
