"""
Phase 3 Backend API Tests
Tests for: nosotros-settings, contacto, empresas-top-views, views counter
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNosotrosSettings:
    """Tests for /api/nosotros-settings endpoint"""
    
    def test_get_nosotros_settings_returns_200(self):
        """GET /api/nosotros-settings should return 200"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        assert response.status_code == 200
        print(f"✓ GET /api/nosotros-settings returned 200")
    
    def test_nosotros_settings_has_required_fields(self):
        """Response should contain mision, vision, valores"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        data = response.json()
        
        assert "mision" in data, "Missing 'mision' field"
        assert "vision" in data, "Missing 'vision' field"
        assert "valores" in data, "Missing 'valores' field"
        assert isinstance(data["valores"], list), "valores should be a list"
        assert len(data["valores"]) == 4, f"Expected 4 valores, got {len(data['valores'])}"
        print(f"✓ nosotros-settings has all required fields")
    
    def test_nosotros_settings_valores_content(self):
        """Valores should contain expected values"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        data = response.json()
        
        expected_valores = ["Sustentabilidad", "Seguridad", "Comunidad", "Pasión por la Tierra"]
        for valor in expected_valores:
            assert valor in data["valores"], f"Missing valor: {valor}"
        print(f"✓ nosotros-settings valores contain expected values")


class TestContacto:
    """Tests for /api/contacto endpoint"""
    
    def test_contacto_post_success(self):
        """POST /api/contacto should save contact form"""
        payload = {
            "nombre": f"TEST_User_{uuid.uuid4().hex[:8]}",
            "email": "test@example.com",
            "empresa": "Test Company",
            "mensaje": "Test message for contact form"
        }
        response = requests.post(f"{BASE_URL}/api/contacto", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        assert "message" in data or "mensaje" in data
        print(f"✓ POST /api/contacto saved contact form successfully")
    
    def test_contacto_post_minimal_data(self):
        """POST /api/contacto should work with minimal data"""
        payload = {
            "nombre": "Minimal Test",
            "email": "minimal@test.com",
            "mensaje": "Minimal message"
        }
        response = requests.post(f"{BASE_URL}/api/contacto", json=payload)
        
        assert response.status_code == 200
        print(f"✓ POST /api/contacto works with minimal data")


class TestEmpresasTopViews:
    """Tests for /api/empresas-top-views endpoint"""
    
    def test_get_top_views_returns_200(self):
        """GET /api/empresas-top-views should return 200"""
        response = requests.get(f"{BASE_URL}/api/empresas-top-views")
        assert response.status_code == 200
        print(f"✓ GET /api/empresas-top-views returned 200")
    
    def test_top_views_returns_list(self):
        """Response should be a list"""
        response = requests.get(f"{BASE_URL}/api/empresas-top-views")
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ empresas-top-views returns a list with {len(data)} items")
    
    def test_top_views_has_required_fields(self):
        """Each empresa should have nombre, slug, views, categoria"""
        response = requests.get(f"{BASE_URL}/api/empresas-top-views")
        data = response.json()
        
        if len(data) > 0:
            empresa = data[0]
            assert "nombre" in empresa, "Missing 'nombre' field"
            assert "slug" in empresa, "Missing 'slug' field"
            assert "views" in empresa, "Missing 'views' field"
            assert "categoria" in empresa, "Missing 'categoria' field"
            print(f"✓ Top viewed empresas have required fields")
        else:
            print("⚠ No empresas in top views list")
    
    def test_top_views_max_5_results(self):
        """Should return max 5 results"""
        response = requests.get(f"{BASE_URL}/api/empresas-top-views")
        data = response.json()
        
        assert len(data) <= 5, f"Expected max 5 results, got {len(data)}"
        print(f"✓ empresas-top-views returns max 5 results")


class TestViewsCounter:
    """Tests for views counter increment on empresa detail"""
    
    def test_empresa_detail_increments_views(self):
        """GET /api/empresas/{slug} should increment views"""
        # First get current views
        response1 = requests.get(f"{BASE_URL}/api/empresas-top-views")
        empresas = response1.json()
        
        if len(empresas) == 0:
            pytest.skip("No empresas available for testing")
        
        slug = empresas[0]["slug"]
        initial_views = empresas[0].get("views", 0)
        
        # Access empresa detail (this should increment views)
        response2 = requests.get(f"{BASE_URL}/api/empresas/{slug}")
        assert response2.status_code == 200
        
        # Check views increased
        response3 = requests.get(f"{BASE_URL}/api/empresas-top-views")
        updated_empresas = response3.json()
        
        updated_empresa = next((e for e in updated_empresas if e["slug"] == slug), None)
        if updated_empresa:
            new_views = updated_empresa.get("views", 0)
            assert new_views > initial_views, f"Views should have increased from {initial_views}"
            print(f"✓ Views counter incremented from {initial_views} to {new_views}")
        else:
            print("⚠ Could not verify views increment")


class TestEmpresas:
    """Tests for /api/empresas endpoints"""
    
    def test_get_empresas_returns_200(self):
        """GET /api/empresas should return 200"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        assert response.status_code == 200
        print(f"✓ GET /api/empresas returned 200")
    
    def test_empresas_returns_list(self):
        """Response should be a list"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ empresas returns a list with {len(data)} items")
    
    def test_empresa_has_required_fields(self):
        """Each empresa should have required fields for CompanyCard"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        data = response.json()
        
        if len(data) > 0:
            empresa = data[0]
            required_fields = ["nombre", "slug", "categoria", "descripcion", "logo_url", "actividades"]
            for field in required_fields:
                assert field in empresa, f"Missing '{field}' field"
            print(f"✓ Empresas have all required fields for CompanyCard")
        else:
            pytest.skip("No empresas available")
    
    def test_empresa_detail_returns_200(self):
        """GET /api/empresas/{slug} should return 200"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        empresas = response.json()
        
        if len(empresas) == 0:
            pytest.skip("No empresas available")
        
        slug = empresas[0]["slug"]
        response2 = requests.get(f"{BASE_URL}/api/empresas/{slug}")
        assert response2.status_code == 200
        print(f"✓ GET /api/empresas/{slug} returned 200")
    
    def test_empresa_detail_has_gallery_and_coordinates(self):
        """Empresa detail should have galeria and coordinates for map"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        empresas = response.json()
        
        if len(empresas) == 0:
            pytest.skip("No empresas available")
        
        slug = empresas[0]["slug"]
        response2 = requests.get(f"{BASE_URL}/api/empresas/{slug}")
        data = response2.json()
        
        assert "galeria" in data, "Missing 'galeria' field"
        assert "latitud" in data, "Missing 'latitud' field"
        assert "longitud" in data, "Missing 'longitud' field"
        print(f"✓ Empresa detail has galeria and coordinates")


class TestActividades:
    """Tests for /api/actividades endpoint"""
    
    def test_get_actividades_returns_200(self):
        """GET /api/actividades should return 200"""
        response = requests.get(f"{BASE_URL}/api/actividades")
        assert response.status_code == 200
        print(f"✓ GET /api/actividades returned 200")
    
    def test_actividades_count(self):
        """Should have 10 actividades from seed data"""
        response = requests.get(f"{BASE_URL}/api/actividades")
        data = response.json()
        
        assert len(data) >= 10, f"Expected at least 10 actividades, got {len(data)}"
        print(f"✓ actividades has {len(data)} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
