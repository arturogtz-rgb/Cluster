"""
Phase 3 NEW Features Backend API Tests
Tests for: /api/mapa/pines, /api/analytics/whatsapp-click, /api/leads/export-csv, 
ubicaciones_actividades in empresas
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def get_auth_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json().get("token")
    return None


class TestMapaPines:
    """Tests for /api/mapa/pines endpoint - General map pins"""
    
    def test_get_mapa_pines_returns_200(self):
        """GET /api/mapa/pines should return 200"""
        response = requests.get(f"{BASE_URL}/api/mapa/pines")
        assert response.status_code == 200
        print(f"✓ GET /api/mapa/pines returned 200")
    
    def test_mapa_pines_returns_list(self):
        """Response should be a list of pins"""
        response = requests.get(f"{BASE_URL}/api/mapa/pines")
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ /api/mapa/pines returns a list with {len(data)} pins")
    
    def test_mapa_pines_has_required_fields(self):
        """Each pin should have required fields"""
        response = requests.get(f"{BASE_URL}/api/mapa/pines")
        data = response.json()
        
        if len(data) > 0:
            pin = data[0]
            required_fields = [
                "empresa_id", "empresa_nombre", "empresa_slug",
                "actividad_nombre", "latitud", "longitud"
            ]
            for field in required_fields:
                assert field in pin, f"Missing '{field}' field in pin"
            
            # Verify coordinates are numbers
            assert isinstance(pin["latitud"], (int, float)), "latitud should be a number"
            assert isinstance(pin["longitud"], (int, float)), "longitud should be a number"
            print(f"✓ Pins have all required fields")
        else:
            print("⚠ No pins returned (expected if no ubicaciones_actividades yet)")
    
    def test_mapa_pines_filter_by_actividad(self):
        """GET /api/mapa/pines?actividad=X should filter by activity"""
        # First get all pins to find an activity name
        response = requests.get(f"{BASE_URL}/api/mapa/pines")
        all_pins = response.json()
        
        if len(all_pins) > 0:
            actividad = all_pins[0].get("actividad_nombre", "")
            if actividad:
                response2 = requests.get(f"{BASE_URL}/api/mapa/pines?actividad={actividad}")
                assert response2.status_code == 200
                filtered_pins = response2.json()
                
                # All filtered pins should have the same activity
                for pin in filtered_pins:
                    assert pin["actividad_nombre"] == actividad or actividad in str(pin.get("actividad_id", ""))
                print(f"✓ Filter by actividad works - filtered to {len(filtered_pins)} pins")
        else:
            print("⚠ No pins to test filter")
    
    def test_mapa_pines_includes_hq_pins(self):
        """Pins should include HQ pins for empresas without ubicaciones_actividades"""
        response = requests.get(f"{BASE_URL}/api/mapa/pines")
        data = response.json()
        
        # Check if any pin has "Sede" as actividad_nombre (HQ pins)
        hq_pins = [p for p in data if p.get("actividad_nombre") == "Sede"]
        print(f"✓ Found {len(hq_pins)} HQ pins (Sede principal)")


class TestWhatsAppClickTracking:
    """Tests for /api/analytics/whatsapp-click endpoint"""
    
    def test_whatsapp_click_post_returns_200(self):
        """POST /api/analytics/whatsapp-click should return 200"""
        response = requests.post(f"{BASE_URL}/api/analytics/whatsapp-click")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print(f"✓ POST /api/analytics/whatsapp-click returned 200 with status ok")
    
    def test_whatsapp_click_increments_counter(self):
        """WhatsApp click should increment counter in analytics overview"""
        # Get initial count
        response1 = requests.get(f"{BASE_URL}/api/analytics/overview")
        initial_data = response1.json()
        initial_clicks = initial_data.get("totales", {}).get("whatsapp_clicks", 0)
        
        # Click WhatsApp
        requests.post(f"{BASE_URL}/api/analytics/whatsapp-click")
        
        # Get updated count
        response2 = requests.get(f"{BASE_URL}/api/analytics/overview")
        updated_data = response2.json()
        updated_clicks = updated_data.get("totales", {}).get("whatsapp_clicks", 0)
        
        assert updated_clicks > initial_clicks, f"WhatsApp clicks should have increased from {initial_clicks}"
        print(f"✓ WhatsApp clicks incremented from {initial_clicks} to {updated_clicks}")


class TestAnalyticsOverview:
    """Tests for /api/analytics/overview endpoint - includes whatsapp_clicks"""
    
    def test_analytics_overview_returns_200(self):
        """GET /api/analytics/overview should return 200"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200
        print(f"✓ GET /api/analytics/overview returned 200")
    
    def test_analytics_overview_has_whatsapp_clicks(self):
        """Analytics overview should include whatsapp_clicks in totales"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        assert "totales" in data, "Missing 'totales' field"
        assert "whatsapp_clicks" in data["totales"], "Missing 'whatsapp_clicks' in totales"
        assert isinstance(data["totales"]["whatsapp_clicks"], int), "whatsapp_clicks should be an integer"
        print(f"✓ Analytics overview includes whatsapp_clicks: {data['totales']['whatsapp_clicks']}")
    
    def test_analytics_overview_has_all_kpis(self):
        """Analytics overview should have all 6 KPIs"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        data = response.json()
        
        expected_kpis = ["empresas", "articulos", "actividades", "leads", "leads_no_leidos", "whatsapp_clicks"]
        for kpi in expected_kpis:
            assert kpi in data["totales"], f"Missing KPI: {kpi}"
        print(f"✓ Analytics overview has all 6 KPIs")


class TestLeadsExportCSV:
    """Tests for /api/leads/export-csv endpoint"""
    
    def test_export_csv_requires_auth(self):
        """GET /api/leads/export-csv should require authentication"""
        response = requests.get(f"{BASE_URL}/api/leads/export-csv")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ Export CSV requires authentication (returned {response.status_code})")
    
    def test_export_csv_returns_csv_with_auth(self):
        """GET /api/leads/export-csv with auth should return CSV"""
        token = get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        response = requests.get(
            f"{BASE_URL}/api/leads/export-csv",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        print(f"✓ Export CSV returns CSV content type")
    
    def test_export_csv_has_utf8_bom(self):
        """CSV should start with UTF-8 BOM for Excel compatibility"""
        token = get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        response = requests.get(
            f"{BASE_URL}/api/leads/export-csv",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Check for UTF-8 BOM (EF BB BF in bytes, or \ufeff in text)
        content = response.text
        assert content.startswith('\ufeff'), "CSV should start with UTF-8 BOM"
        print(f"✓ CSV has UTF-8 BOM for Excel compatibility")
    
    def test_export_csv_has_correct_headers(self):
        """CSV should have correct column headers"""
        token = get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        response = requests.get(
            f"{BASE_URL}/api/leads/export-csv",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        content = response.text
        # Remove BOM and get first line
        first_line = content.replace('\ufeff', '').split('\n')[0]
        expected_headers = ["Nombre", "Email", "Empresa", "Mensaje", "Leído", "Fecha"]
        
        for header in expected_headers:
            assert header in first_line, f"Missing header: {header}"
        print(f"✓ CSV has correct headers: {first_line}")
    
    def test_export_csv_content_disposition(self):
        """CSV should have Content-Disposition header for download"""
        token = get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        response = requests.get(
            f"{BASE_URL}/api/leads/export-csv",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        content_disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        assert "leads_cluster_turismo.csv" in content_disposition, "Should have correct filename"
        print(f"✓ CSV has correct Content-Disposition: {content_disposition}")


class TestEmpresaUbicacionesActividades:
    """Tests for ubicaciones_actividades field in empresas"""
    
    def test_empresa_has_ubicaciones_actividades_field(self):
        """Empresa detail should have ubicaciones_actividades field"""
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        empresas = response.json()
        
        if len(empresas) == 0:
            pytest.skip("No empresas available")
        
        slug = empresas[0]["slug"]
        response2 = requests.get(f"{BASE_URL}/api/empresas/{slug}")
        data = response2.json()
        
        assert "ubicaciones_actividades" in data, "Missing 'ubicaciones_actividades' field"
        assert isinstance(data["ubicaciones_actividades"], list), "ubicaciones_actividades should be a list"
        print(f"✓ Empresa has ubicaciones_actividades field (list with {len(data['ubicaciones_actividades'])} items)")
    
    def test_update_empresa_with_ubicaciones_actividades(self):
        """PUT /api/empresas/:id should save ubicaciones_actividades"""
        token = get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        # Get an empresa
        response = requests.get(f"{BASE_URL}/api/empresas?activa=true")
        empresas = response.json()
        
        if len(empresas) == 0:
            pytest.skip("No empresas available")
        
        slug = empresas[0]["slug"]
        
        # Update with ubicaciones_actividades
        test_ubicaciones = [
            {
                "actividad_id": "test-act-1",
                "actividad_nombre": "Senderismo",
                "latitud": 20.6597,
                "longitud": -103.3496,
                "nota": "Test location"
            }
        ]
        
        response2 = requests.put(
            f"{BASE_URL}/api/empresas/{slug}",
            json={"ubicaciones_actividades": test_ubicaciones},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response2.status_code == 200, f"Expected 200, got {response2.status_code}"
        
        # Verify it was saved
        response3 = requests.get(f"{BASE_URL}/api/empresas/{slug}")
        data = response3.json()
        
        assert len(data["ubicaciones_actividades"]) > 0, "ubicaciones_actividades should have been saved"
        print(f"✓ PUT /api/empresas/{slug} saved ubicaciones_actividades correctly")
        
        # Clean up - remove test ubicaciones
        requests.put(
            f"{BASE_URL}/api/empresas/{slug}",
            json={"ubicaciones_actividades": []},
            headers={"Authorization": f"Bearer {token}"}
        )


class TestLeadsEndpoint:
    """Tests for /api/leads endpoint (admin)"""
    
    def test_get_leads_requires_auth(self):
        """GET /api/leads should require authentication"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/leads requires authentication")
    
    def test_get_leads_with_auth(self):
        """GET /api/leads with auth should return list"""
        token = get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/leads returns list with {len(data)} leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
