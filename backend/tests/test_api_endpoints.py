"""
Backend API Tests for Clúster de Turismo de Naturaleza y Aventura Jalisco
Tests: Auth, Analytics, Empresas, Articulos, Actividades, Categorias, Leads, SEO, Settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://eco-tourism-cluster.preview.emergentagent.com')


class TestHealthAndRoot:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Clúster de Turismo" in data["message"]
        print(f"✓ API root returns: {data['message']}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "username" in data, "Response should contain username"
        assert data["username"] == "admin"
        assert len(data["token"]) > 0
        print(f"✓ Login successful, token received: {data['token'][:20]}...")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["token"]
        
        # Test /auth/me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert data["username"] == "admin"
        print(f"✓ /auth/me returns user: {data['username']}")


class TestAnalytics:
    """Analytics dashboard endpoint tests"""
    
    def test_analytics_overview(self):
        """Test GET /api/analytics/overview returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200, f"Analytics failed: {response.text}"
        data = response.json()
        
        # Check totales
        assert "totales" in data, "Response should contain totales"
        totales = data["totales"]
        assert "empresas" in totales
        assert "articulos" in totales
        assert "actividades" in totales
        assert "leads" in totales
        assert "leads_no_leidos" in totales
        print(f"✓ Totales: empresas={totales['empresas']}, articulos={totales['articulos']}, actividades={totales['actividades']}, leads={totales['leads']}")
        
        # Check empresas_por_categoria
        assert "empresas_por_categoria" in data
        assert isinstance(data["empresas_por_categoria"], list)
        print(f"✓ empresas_por_categoria: {len(data['empresas_por_categoria'])} categories")
        
        # Check top_empresas
        assert "top_empresas" in data
        assert isinstance(data["top_empresas"], list)
        print(f"✓ top_empresas: {len(data['top_empresas'])} empresas")
        
        # Check leads_por_mes
        assert "leads_por_mes" in data
        assert isinstance(data["leads_por_mes"], list)
        print(f"✓ leads_por_mes: {len(data['leads_por_mes'])} months")
        
        # Check vistas_por_categoria
        assert "vistas_por_categoria" in data
        assert isinstance(data["vistas_por_categoria"], list)
        print(f"✓ vistas_por_categoria: {len(data['vistas_por_categoria'])} categories")


class TestEmpresas:
    """Empresas CRUD endpoint tests"""
    
    def test_get_empresas_list(self):
        """Test GET /api/empresas returns list"""
        response = requests.get(f"{BASE_URL}/api/empresas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/empresas returns {len(data)} empresas")
        if len(data) > 0:
            empresa = data[0]
            assert "nombre" in empresa
            assert "slug" in empresa
            print(f"  First empresa: {empresa['nombre']} (slug: {empresa['slug']})")
    
    def test_get_empresas_with_filter(self):
        """Test GET /api/empresas with categoria filter"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/empresas?activa=true returns {len(data)} active empresas")


class TestArticulos:
    """Articulos endpoint tests"""
    
    def test_get_articulos_list(self):
        """Test GET /api/articulos returns list"""
        response = requests.get(f"{BASE_URL}/api/articulos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/articulos returns {len(data)} articulos")
        if len(data) > 0:
            articulo = data[0]
            assert "titulo" in articulo
            assert "slug" in articulo
            print(f"  First articulo: {articulo['titulo']}")


class TestActividades:
    """Actividades endpoint tests"""
    
    def test_get_actividades_list(self):
        """Test GET /api/actividades returns list"""
        response = requests.get(f"{BASE_URL}/api/actividades")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/actividades returns {len(data)} actividades")
        if len(data) > 0:
            actividad = data[0]
            assert "nombre" in actividad
            assert "slug" in actividad
            print(f"  First actividad: {actividad['nombre']}")


class TestCategorias:
    """Categorias endpoint tests"""
    
    def test_get_categorias(self):
        """Test GET /api/categorias returns categorias"""
        response = requests.get(f"{BASE_URL}/api/categorias")
        assert response.status_code == 200
        data = response.json()
        assert "categorias" in data
        assert isinstance(data["categorias"], list)
        print(f"✓ GET /api/categorias returns {len(data['categorias'])} categorias")
        if len(data["categorias"]) > 0:
            cat = data["categorias"][0]
            assert "nombre" in cat
            print(f"  First categoria: {cat['nombre']}")


class TestLeadsAndContacto:
    """Leads and contact form tests"""
    
    def test_submit_contacto(self):
        """Test POST /api/contacto creates a lead"""
        test_data = {
            "nombre": "TEST_Usuario Prueba",
            "email": "test@example.com",
            "empresa": "TEST_Empresa Prueba",
            "mensaje": "Este es un mensaje de prueba automatizada"
        }
        response = requests.post(f"{BASE_URL}/api/contacto", json=test_data)
        assert response.status_code == 200, f"Contact form failed: {response.text}"
        data = response.json()
        assert data.get("status") == "ok"
        print(f"✓ POST /api/contacto successful: {data}")
    
    def test_get_leads_requires_auth(self):
        """Test GET /api/leads requires authentication"""
        response = requests.get(f"{BASE_URL}/api/leads")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/leads correctly requires auth (status: {response.status_code})")
    
    def test_get_leads_with_auth(self):
        """Test GET /api/leads with admin token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["token"]
        
        # Get leads
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Get leads failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/leads returns {len(data)} leads")
        
        # Verify our test lead exists
        test_leads = [l for l in data if l.get("nombre", "").startswith("TEST_")]
        if test_leads:
            print(f"  Found {len(test_leads)} test leads")


class TestSEO:
    """SEO endpoint tests"""
    
    def test_sitemap_xml(self):
        """Test GET /api/sitemap.xml returns valid XML"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert "application/xml" in response.headers.get("content-type", "")
        
        content = response.text
        assert '<?xml version="1.0"' in content
        assert '<urlset' in content
        assert '<url>' in content
        assert '<loc>' in content
        print(f"✓ GET /api/sitemap.xml returns valid XML ({len(content)} bytes)")


class TestSettings:
    """Settings endpoint tests"""
    
    def test_get_nosotros_settings(self):
        """Test GET /api/nosotros-settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/nosotros-settings")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "mision" in data, "Should contain mision"
        assert "vision" in data, "Should contain vision"
        assert "valores" in data, "Should contain valores"
        assert isinstance(data["valores"], list)
        
        print(f"✓ GET /api/nosotros-settings returns settings")
        print(f"  Mision: {data['mision'][:50]}...")
        print(f"  Vision: {data['vision'][:50]}...")
        print(f"  Valores: {data['valores']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_leads(self):
        """Clean up TEST_ prefixed leads"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["token"]
        
        # Get leads
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {token}"}
        )
        leads = response.json()
        
        # Delete test leads
        deleted = 0
        for lead in leads:
            if lead.get("nombre", "").startswith("TEST_"):
                del_response = requests.delete(
                    f"{BASE_URL}/api/leads/{lead['id']}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"✓ Cleaned up {deleted} test leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
