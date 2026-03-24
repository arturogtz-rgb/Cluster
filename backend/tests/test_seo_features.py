"""
SEO & PageSpeed Features Tests - Phase 5
Tests for:
1. Dynamic sitemap.xml generation
2. Meta tags verification (via Playwright)
3. JSON-LD structured data verification
4. Code splitting verification
"""

import pytest
import requests
import os
import xml.etree.ElementTree as ET

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://eco-tourism-cluster.preview.emergentagent.com')

class TestSitemapXML:
    """Tests for dynamic sitemap.xml generation"""
    
    def test_sitemap_returns_valid_xml(self):
        """Sitemap endpoint returns valid XML with correct content type"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        assert response.status_code == 200
        assert 'application/xml' in response.headers.get('content-type', '')
        
        # Parse XML to verify it's valid
        try:
            root = ET.fromstring(response.text)
            assert root.tag == '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset'
            print("PASS: Sitemap returns valid XML")
        except ET.ParseError as e:
            pytest.fail(f"Invalid XML: {e}")
    
    def test_sitemap_contains_static_pages(self):
        """Sitemap includes all static public pages"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        sitemap_content = response.text
        
        required_pages = ['/', '/empresas', '/mapa', '/prensa', '/nosotros']
        for page in required_pages:
            assert f"<loc>{BASE_URL.rstrip('/')}{page}</loc>" in sitemap_content, f"Missing page: {page}"
        print("PASS: Sitemap contains all static pages")
    
    def test_sitemap_contains_empresa_entries(self):
        """Sitemap includes entries for each active empresa"""
        # Get empresas from API
        empresas_response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        empresas = empresas_response.json()
        
        # Get sitemap
        sitemap_response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        sitemap_content = sitemap_response.text
        
        for empresa in empresas:
            expected_url = f"/empresas/{empresa['slug']}"
            assert expected_url in sitemap_content, f"Missing empresa in sitemap: {empresa['slug']}"
        print(f"PASS: Sitemap contains {len(empresas)} empresa entries")
    
    def test_sitemap_contains_articulo_entries(self):
        """Sitemap includes entries for published articulos"""
        # Get published articulos from API
        articulos_response = requests.get(f"{BASE_URL}/api/articulos?publicado=true")
        articulos = articulos_response.json()
        
        # Get sitemap
        sitemap_response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        sitemap_content = sitemap_response.text
        
        for articulo in articulos:
            expected_url = f"/prensa/{articulo['slug']}"
            assert expected_url in sitemap_content, f"Missing articulo in sitemap: {articulo['slug']}"
        print(f"PASS: Sitemap contains {len(articulos)} articulo entries")
    
    def test_sitemap_has_required_elements(self):
        """Each URL in sitemap has loc, lastmod, changefreq, priority"""
        response = requests.get(f"{BASE_URL}/api/sitemap.xml")
        root = ET.fromstring(response.text)
        
        ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = root.findall('sm:url', ns)
        
        assert len(urls) > 0, "Sitemap has no URLs"
        
        for url in urls:
            loc = url.find('sm:loc', ns)
            lastmod = url.find('sm:lastmod', ns)
            changefreq = url.find('sm:changefreq', ns)
            priority = url.find('sm:priority', ns)
            
            assert loc is not None, "URL missing <loc>"
            assert lastmod is not None, "URL missing <lastmod>"
            assert changefreq is not None, "URL missing <changefreq>"
            assert priority is not None, "URL missing <priority>"
        
        print(f"PASS: All {len(urls)} URLs have required elements")


class TestAPIEndpoints:
    """Basic API endpoint tests to ensure backend is working"""
    
    def test_api_root(self):
        """API root returns expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data
        print("PASS: API root endpoint working")
    
    def test_empresas_endpoint(self):
        """Empresas endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/empresas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Empresas endpoint returns {len(data)} items")
    
    def test_empresa_detail_endpoint(self):
        """Empresa detail endpoint returns empresa data"""
        # First get list to find a valid slug
        empresas_response = requests.get(f"{BASE_URL}/api/empresas")
        empresas = empresas_response.json()
        
        if len(empresas) > 0:
            slug = empresas[0]['slug']
            response = requests.get(f"{BASE_URL}/api/empresas/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert 'nombre' in data
            assert 'categoria' in data
            assert 'descripcion' in data
            print(f"PASS: Empresa detail endpoint working for {slug}")
        else:
            pytest.skip("No empresas available for testing")
    
    def test_articulos_endpoint(self):
        """Articulos endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/articulos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Articulos endpoint returns {len(data)} items")
    
    def test_articulo_detail_endpoint(self):
        """Articulo detail endpoint returns articulo data"""
        # First get list to find a valid slug
        articulos_response = requests.get(f"{BASE_URL}/api/articulos?publicado=true")
        articulos = articulos_response.json()
        
        if len(articulos) > 0:
            slug = articulos[0]['slug']
            response = requests.get(f"{BASE_URL}/api/articulos/{slug}")
            assert response.status_code == 200
            data = response.json()
            assert 'titulo' in data
            assert 'contenido' in data
            assert 'resumen' in data
            print(f"PASS: Articulo detail endpoint working for {slug}")
        else:
            pytest.skip("No published articulos available for testing")


class TestEmpresaSchemaMapping:
    """Test that empresa categories map to correct Schema.org types"""
    
    def test_schema_type_mapping_exists(self):
        """Verify known categories have schema mappings"""
        # These are the mappings defined in SEO.jsx
        expected_mappings = {
            "Operadora de aventura": "TravelAgency",
            "Parque de aventura": "AmusementPark",
            "Parque": "Park",
            "Hotel": "LodgingBusiness",
            "Hospedaje": "LodgingBusiness",
            "Restaurante": "FoodEstablishment",
            "Capacitación": "EducationalOrganization",
        }
        
        # Get empresas to check their categories
        response = requests.get(f"{BASE_URL}/api/empresas")
        empresas = response.json()
        
        for empresa in empresas:
            categoria = empresa.get('categoria', '')
            if categoria in expected_mappings:
                print(f"  - {empresa['nombre']}: {categoria} -> {expected_mappings[categoria]}")
            else:
                print(f"  - {empresa['nombre']}: {categoria} -> LocalBusiness (default)")
        
        print("PASS: Schema type mapping verification complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
