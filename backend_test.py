#!/usr/bin/env python3

import requests
import sys
import json
import io
from datetime import datetime
from PIL import Image

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
        """Run all API tests including FASE 1 image upload tests"""
        print("🚀 Starting Tourism Cluster API Tests (Including FASE 1 Image Upload)")
        print(f"📡 Testing API at: {self.base_url}")
        print("=" * 80)
        
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
            
            # New FASE 1 Image Upload Tests (require authentication)
            print("\n🖼️ FASE 1 Image Upload Pipeline Tests")
            print("-" * 50)
            self.test_image_upload_basic()
            self.test_image_upload_webp_optimization()
            self.test_folder_structure()
            self.test_media_list_api()
        
        # Print final results
        print("\n📊 Test Summary")
        print("=" * 40)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure['test']}: {failure['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

    def create_test_image(self, width=800, height=600, format='PNG'):
        """Create a test image in memory"""
        img = Image.new('RGB', (width, height), color='red')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format=format)
        img_buffer.seek(0)
        return img_buffer

    def test_image_upload_basic(self):
        """Test basic image upload functionality"""
        if not self.token:
            self.log_test("Image Upload - Basic", False, "No auth token available")
            return False
            
        try:
            test_image = self.create_test_image(800, 600, 'PNG')
            
            files = {'file': ('test_image.png', test_image, 'image/png')}
            data = {
                'category': 'system',
                'entity_slug': 'test',
                'subfolder': 'test',
                'image_type': 'card'
            }
            
            response = requests.post(
                f"{self.base_url}/media/upload",
                data=data,
                files=files,
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=30
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                details += f", Compression: {result.get('compression_ratio', 0)}%"
                details += f", URL: {result.get('url', 'N/A')}"
            else:
                try:
                    details += f", Error: {response.json()}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Image Upload - Basic", success, details)
            return success
            
        except Exception as e:
            self.log_test("Image Upload - Basic", False, f"Exception: {str(e)}")
            return False

    def test_image_upload_webp_optimization(self):
        """Test WebP optimization pipeline"""
        if not self.token:
            self.log_test("Image Upload - WebP Optimization", False, "No auth token available")
            return False
            
        try:
            # Create a large PNG image to test compression
            test_image = self.create_test_image(1920, 1080, 'PNG')
            
            files = {'file': ('large_test.png', test_image, 'image/png')}
            data = {
                'category': 'empresas',
                'entity_slug': 'test-empresa',
                'subfolder': 'hero',
                'image_type': 'hero'
            }
            
            response = requests.post(
                f"{self.base_url}/media/upload",
                data=data,
                files=files,
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=30
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                compression_ratio = result.get('compression_ratio', 0)
                url = result.get('url', '')
                details += f", Compression: {compression_ratio}%"
                
                # Check if image was optimized
                if '.webp' in url or compression_ratio > 0:
                    details += ", WebP optimization: ✅"
                else:
                    details += ", WebP optimization: ⚠️"
            else:
                try:
                    details += f", Error: {response.json()}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Image Upload - WebP Optimization", success, details)
            return success
            
        except Exception as e:
            self.log_test("Image Upload - WebP Optimization", False, f"Exception: {str(e)}")
            return False

    def test_folder_structure(self):
        """Test hierarchical folder structure creation"""
        if not self.token:
            self.log_test("Image Upload - Folder Structure", False, "No auth token available")
            return False
            
        test_cases = [
            {
                'category': 'empresas',
                'entity_slug': 'test-empresa',
                'subfolder': 'logo',
                'name': 'Empresas Logo'
            },
            {
                'category': 'articulos', 
                'entity_slug': 'test-articulo',
                'subfolder': 'hero',
                'name': 'Articulos Hero'
            },
            {
                'category': 'system',
                'entity_slug': '',
                'subfolder': '',
                'name': 'System Default'
            }
        ]
        
        all_success = True
        for test_case in test_cases:
            try:
                test_image = self.create_test_image(400, 300, 'JPEG')
                files = {'file': (f'folder_test.jpg', test_image, 'image/jpeg')}
                data = {
                    'category': test_case['category'],
                    'entity_slug': test_case['entity_slug'],
                    'subfolder': test_case['subfolder'],
                    'image_type': 'card'
                }
                
                response = requests.post(
                    f"{self.base_url}/media/upload",
                    data=data,
                    files=files,
                    headers={'Authorization': f'Bearer {self.token}'},
                    timeout=30
                )
                
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success:
                    result = response.json()
                    url = result.get('url', '')
                    details += f", URL contains category: {test_case['category'] in url}"
                else:
                    all_success = False
                    try:
                        details += f", Error: {response.json()}"
                    except:
                        details += f", Response: {response.text}"
                
                self.log_test(f"Folder Structure - {test_case['name']}", success, details)
                
            except Exception as e:
                all_success = False
                self.log_test(f"Folder Structure - {test_case['name']}", False, f"Exception: {str(e)}")
        
        return all_success

    def test_media_list_api(self):
        """Test media listing API"""
        if not self.token:
            self.log_test("Media List API", False, "No auth token available")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/media",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                result = response.json()
                media_count = len(result) if isinstance(result, list) else 0
                details += f", Media files found: {media_count}"
            else:
                try:
                    details += f", Error: {response.json()}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Media List API", success, details)
            return success
            
        except Exception as e:
            self.log_test("Media List API", False, f"Exception: {str(e)}")
            return False

def main():
    """Main test execution"""
    tester = TourismClusterAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())