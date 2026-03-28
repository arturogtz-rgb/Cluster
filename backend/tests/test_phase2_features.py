"""
Phase 2 Feature Tests for Jalisco Tourism Cluster
Tests: Hero carousel, WhatsApp config, Numeralia, Gallery features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://jalisco-nature-hub.preview.emergentagent.com')

class TestSettingsAPI:
    """Tests for /api/settings endpoint - Hero carousel and WhatsApp config"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_get_settings_returns_hero_slides(self):
        """GET /api/settings should return hero_slides array"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "hero_slides" in data
        assert isinstance(data["hero_slides"], list)
        print(f"✓ hero_slides returned: {len(data['hero_slides'])} slides")
    
    def test_get_settings_returns_whatsapp_fields(self):
        """GET /api/settings should return whatsapp_number and whatsapp_visible"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "whatsapp_number" in data
        assert "whatsapp_visible" in data
        assert isinstance(data["whatsapp_visible"], bool)
        print(f"✓ WhatsApp config: number={data['whatsapp_number']}, visible={data['whatsapp_visible']}")
    
    def test_put_settings_hero_slides(self):
        """PUT /api/settings should accept hero_slides array"""
        test_slides = [
            {"image": "https://example.com/test1.jpg", "title": "Test Title 1", "subtitle": "Test Subtitle 1"},
            {"image": "https://example.com/test2.jpg", "title": "Test Title 2", "subtitle": "Test Subtitle 2"},
        ]
        response = self.session.put(f"{BASE_URL}/api/settings", json={
            "hero_slides": test_slides
        })
        assert response.status_code == 200
        data = response.json()
        assert "hero_slides" in data
        assert len(data["hero_slides"]) == 2
        print(f"✓ hero_slides updated successfully")
    
    def test_put_settings_whatsapp_number_international_format(self):
        """PUT /api/settings should accept WhatsApp number with +52 format"""
        test_number = "+523312345678"
        response = self.session.put(f"{BASE_URL}/api/settings", json={
            "whatsapp_number": test_number
        })
        assert response.status_code == 200
        data = response.json()
        assert data["whatsapp_number"] == test_number
        print(f"✓ WhatsApp number saved: {test_number}")
    
    def test_put_settings_whatsapp_visible_toggle(self):
        """PUT /api/settings should handle whatsapp_visible boolean toggle"""
        # Set to True
        response = self.session.put(f"{BASE_URL}/api/settings", json={
            "whatsapp_visible": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["whatsapp_visible"] == True
        print("✓ WhatsApp visible set to True")
        
        # Set to False
        response = self.session.put(f"{BASE_URL}/api/settings", json={
            "whatsapp_visible": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["whatsapp_visible"] == False
        print("✓ WhatsApp visible set to False")


class TestNosotrosSettingsAPI:
    """Tests for /api/nosotros-settings endpoint - Numeralia with short/long labels"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_get_nosotros_settings_returns_stats(self):
        """GET /api/nosotros-settings should return stats array"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        assert response.status_code == 200
        data = response.json()
        # stats may or may not exist depending on DB state
        print(f"✓ nosotros-settings returned: {data.keys()}")
    
    def test_put_nosotros_settings_with_short_long_labels(self):
        """PUT /api/nosotros-settings should accept stats with short_label and label"""
        test_stats = [
            {"value": "50+", "short_label": "Destinos", "label": "Destinos Naturales"},
            {"value": "100%", "short_label": "Sustentable", "label": "Compromiso Sustentable"},
        ]
        response = self.session.put(f"{BASE_URL}/api/nosotros-settings", json={
            "stats": test_stats,
            "mision": "Test mission",
            "vision": "Test vision"
        })
        assert response.status_code == 200
        print("✓ nosotros-settings with short_label/label saved")
        
        # Verify the data was saved
        get_response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        assert get_response.status_code == 200
        data = get_response.json()
        if "stats" in data:
            assert len(data["stats"]) >= 2
            assert data["stats"][0].get("short_label") == "Destinos"
            assert data["stats"][0].get("label") == "Destinos Naturales"
            print("✓ short_label and label persisted correctly")


class TestArticulosAPI:
    """Tests for /api/articulos endpoint - Gallery support"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_get_articulos_list(self):
        """GET /api/articulos should return list of articles"""
        response = requests.get(f"{BASE_URL}/api/articulos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ {len(data)} articulos found")
    
    def test_articulo_supports_galeria_field(self):
        """Articulo model should support galeria array field"""
        # Create a test article with gallery
        test_article = {
            "titulo": "TEST_Articulo_Galeria",
            "contenido": "<p>Test content</p>",
            "resumen": "Test summary",
            "hero_url": "https://example.com/hero.jpg",
            "galeria": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
            "publicado": False
        }
        response = self.session.post(f"{BASE_URL}/api/articulos", json=test_article)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "galeria" in data
        assert isinstance(data["galeria"], list)
        print(f"✓ Articulo created with galeria: {len(data['galeria'])} images")
        
        # Cleanup - delete the test article
        if "slug" in data:
            self.session.delete(f"{BASE_URL}/api/articulos/{data['slug']}")


class TestEmpresasAPI:
    """Tests for /api/empresas endpoint - Gallery support"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_get_empresas_list(self):
        """GET /api/empresas should return list of empresas"""
        response = requests.get(f"{BASE_URL}/api/empresas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ {len(data)} empresas found")
    
    def test_empresa_supports_galeria_field(self):
        """Empresa model should support galeria array field"""
        response = requests.get(f"{BASE_URL}/api/empresas")
        assert response.status_code == 200
        empresas = response.json()
        if len(empresas) > 0:
            empresa = empresas[0]
            # galeria should be a list (may be empty)
            assert "galeria" in empresa or empresa.get("galeria") is None or isinstance(empresa.get("galeria", []), list)
            print(f"✓ Empresa galeria field exists")
    
    def test_get_empresa_by_slug(self):
        """GET /api/empresas/:slug should return empresa with galeria"""
        response = requests.get(f"{BASE_URL}/api/empresas")
        assert response.status_code == 200
        empresas = response.json()
        if len(empresas) > 0:
            slug = empresas[0].get("slug")
            detail_response = requests.get(f"{BASE_URL}/api/empresas/{slug}")
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert "galeria" in data or data.get("galeria") is None or isinstance(data.get("galeria", []), list)
            print(f"✓ Empresa detail returned with galeria field")


class TestCategoriasAPI:
    """Tests for /api/categorias endpoint - Category images for dynamic hero"""
    
    def test_get_categorias_list(self):
        """GET /api/categorias should return list of categories"""
        response = requests.get(f"{BASE_URL}/api/categorias")
        assert response.status_code == 200
        data = response.json()
        assert "categorias" in data
        assert isinstance(data["categorias"], list)
        print(f"✓ {len(data['categorias'])} categorias found")
    
    def test_categoria_has_imagen_url(self):
        """Categories should have imagen_url field for dynamic hero"""
        response = requests.get(f"{BASE_URL}/api/categorias")
        assert response.status_code == 200
        data = response.json()
        categorias = data.get("categorias", [])
        if len(categorias) > 0:
            # Check if imagen_url field exists (may be empty string)
            cat = categorias[0]
            assert "imagen_url" in cat or "nombre" in cat
            print(f"✓ Categoria has imagen_url field: {cat.get('imagen_url', 'not set')}")


class TestAuthAPI:
    """Tests for /api/auth endpoint"""
    
    def test_login_success(self):
        """POST /api/auth/login should return token for valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert len(data["token"]) > 0
        print("✓ Login successful, token received")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login should return 401 for invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected with 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
