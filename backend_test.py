#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TourismClusterAPITester:
    def __init__(self, base_url="https://tourism-cluster-mx.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        
        if not success:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"   Details: {details}")
        else:
            self.tests_passed += 1
        
        print()

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                details += f", Response: {response.json().get('message', 'No message')}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Exception: {str(e)}")
            return False

    def test_seed_data(self):
        """Test seeding initial data"""
        try:
            response = requests.post(f"{self.base_url}/seed", timeout=15)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("Seed Data Creation", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Data Creation", False, f"Exception: {str(e)}")
            return False

    def test_login(self, username="admin", password="admin123"):
        """Test admin login"""
        try:
            login_data = {"username": username, "password": password}
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.token = data.get("token")
                details += f", Username: {data.get('username')}, Token received: {'Yes' if self.token else 'No'}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_get_empresas(self):
        """Test getting companies list"""
        try:
            response = requests.get(f"{self.base_url}/empresas", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                empresas = response.json()
                details += f", Companies found: {len(empresas)}"
                if empresas:
                    details += f", First company: {empresas[0].get('nombre', 'No name')}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Get Companies List", success, details)
            return success, empresas if success else []
        except Exception as e:
            self.log_test("Get Companies List", False, f"Exception: {str(e)}")
            return False, []

    def test_get_empresa_by_slug(self, slug):
        """Test getting specific company by slug"""
        try:
            response = requests.get(f"{self.base_url}/empresas/{slug}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Slug: {slug}"
            
            if success:
                empresa = response.json()
                details += f", Company: {empresa.get('nombre', 'No name')}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test(f"Get Company by Slug ({slug})", success, details)
            return success, empresa if success else None
        except Exception as e:
            self.log_test(f"Get Company by Slug ({slug})", False, f"Exception: {str(e)}")
            return False, None

    def test_search_empresas(self):
        """Test company search functionality"""
        try:
            # Test search by name
            response = requests.get(f"{self.base_url}/empresas?busqueda=Ecomuk", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                empresas = response.json()
                details += f", Search results: {len(empresas)}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Search Companies", success, details)
            return success
        except Exception as e:
            self.log_test("Search Companies", False, f"Exception: {str(e)}")
            return False

    def test_filter_by_category(self):
        """Test filtering by category"""
        try:
            response = requests.get(f"{self.base_url}/empresas?categoria=Capacitación", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                empresas = response.json()
                details += f", Filtered results: {len(empresas)}"
                # Check if all results match the category
                if empresas:
                    categories = [e.get('categoria') for e in empresas]
                    all_match = all(cat == 'Capacitación' for cat in categories)
                    details += f", All match category: {all_match}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Filter by Category", success, details)
            return success
        except Exception as e:
            self.log_test("Filter by Category", False, f"Exception: {str(e)}")
            return False

    def test_get_articulos(self):
        """Test getting articles list"""
        try:
            response = requests.get(f"{self.base_url}/articulos?publicado=true", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                articulos = response.json()
                details += f", Published articles: {len(articulos)}"
                if articulos:
                    details += f", First article: {articulos[0].get('titulo', 'No title')}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Get Published Articles", success, details)
            return success
        except Exception as e:
            self.log_test("Get Published Articles", False, f"Exception: {str(e)}")
            return False

    def test_get_categorias(self):
        """Test getting categories"""
        try:
            response = requests.get(f"{self.base_url}/categorias", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                categories = data.get('categorias', [])
                details += f", Categories: {len(categories)}"
                details += f", List: {', '.join(categories)}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Get Categories", success, details)
            return success
        except Exception as e:
            self.log_test("Get Categories", False, f"Exception: {str(e)}")
            return False

    def test_protected_endpoint(self):
        """Test accessing protected endpoint with token"""
        if not self.token:
            self.log_test("Protected Endpoint Access", False, "No token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", User: {data.get('username', 'No username')}"
            else:
                details += f", Error: {response.text}"
                
            self.log_test("Protected Endpoint Access", success, details)
            return success
        except Exception as e:
            self.log_test("Protected Endpoint Access", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Tourism Cluster API Tests")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Basic health check
        if not self.test_health_check():
            print("❌ API is not responding. Stopping tests.")
            return False
            
        # Seed data
        self.test_seed_data()
        
        # Authentication
        login_success = self.test_login()
        
        # Public endpoints
        empresas_success, empresas = self.test_get_empresas()
        
        # Test specific company if available
        if empresas:
            first_empresa_slug = empresas[0].get('slug')
            if first_empresa_slug:
                self.test_get_empresa_by_slug(first_empresa_slug)
        
        # Search and filtering
        self.test_search_empresas()
        self.test_filter_by_category()
        
        # Articles
        self.test_get_articulos()
        
        # Categories
        self.test_get_categorias()
        
        # Protected endpoints (if login succeeded)
        if login_success:
            self.test_protected_endpoint()
        
        # Print final results
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure['test']}: {failure['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = TourismClusterAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())