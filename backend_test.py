#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for OCR Platform
Tests all backend endpoints with proper authentication and error handling.
"""

import requests
import json
import os
import time
from io import BytesIO
from PIL import Image
import base64

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test user credentials
TEST_USER = {
    "name": "OCR Test User",
    "email": "demo@ocrplatform.com", 
    "password": "demo123",
    "confirmPassword": "demo123"
}

class OCRPlatformTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.test_document_id = None
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def create_test_image(self):
        """Create a simple test image with text for OCR testing"""
        try:
            # Create a simple image with text
            img = Image.new('RGB', (400, 200), color='white')
            
            # We'll create a simple image - in a real scenario, we'd add text
            # For now, we'll create a basic image that Tesseract can process
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            return img_bytes.getvalue()
        except Exception as e:
            print(f"Error creating test image: {e}")
            return None
    
    def test_auth_signup(self):
        """Test user signup"""
        try:
            response = requests.post(
                f"{API_BASE}/auth/signup",
                json=TEST_USER,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'token' in data.get('data', {}):
                    self.token = data['data']['token']
                    self.user_id = data['data']['user']['id']
                    self.log_test("POST /api/auth/signup", True, "User created successfully")
                    return True
                else:
                    self.log_test("POST /api/auth/signup", False, f"Invalid response: {data}")
                    return False
            elif response.status_code == 400:
                # User might already exist, try login instead
                return self.test_auth_login()
            else:
                self.log_test("POST /api/auth/signup", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/auth/signup", False, f"Exception: {str(e)}")
            return False
    
    def test_auth_login(self):
        """Test user login"""
        try:
            response = requests.post(
                f"{API_BASE}/auth/login",
                json={
                    "email": TEST_USER["email"],
                    "password": TEST_USER["password"]
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'token' in data.get('data', {}):
                    self.token = data['data']['token']
                    self.user_id = data['data']['user']['id']
                    self.log_test("POST /api/auth/login", True, "Login successful")
                    return True
                else:
                    self.log_test("POST /api/auth/login", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("POST /api/auth/login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/auth/login", False, f"Exception: {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test get current user"""
        try:
            if not self.token:
                self.log_test("GET /api/auth/me", False, "No token available")
                return False
                
            response = requests.get(
                f"{API_BASE}/auth/me",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'user' in data.get('data', {}):
                    self.log_test("GET /api/auth/me", True, f"User: {data['data']['user']['email']}")
                    return True
                else:
                    self.log_test("GET /api/auth/me", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("GET /api/auth/me", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/auth/me", False, f"Exception: {str(e)}")
            return False
    
    def test_ocr_upload(self):
        """Test OCR file upload"""
        try:
            if not self.token:
                self.log_test("POST /api/ocr/upload", False, "No token available")
                return False
            
            # Create test image
            image_data = self.create_test_image()
            if not image_data:
                self.log_test("POST /api/ocr/upload", False, "Could not create test image")
                return False
            
            # Prepare multipart form data
            files = {
                'file': ('test_image.png', image_data, 'image/png')
            }
            data = {
                'language': 'eng'
            }
            
            response = requests.post(
                f"{API_BASE}/ocr/upload",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                resp_data = response.json()
                if resp_data.get('success') and 'documentId' in resp_data.get('data', {}):
                    self.test_document_id = resp_data['data']['documentId']
                    self.log_test("POST /api/ocr/upload", True, f"Document ID: {self.test_document_id}")
                    
                    # Wait a bit for OCR processing
                    print("   Waiting for OCR processing...")
                    time.sleep(3)
                    return True
                else:
                    self.log_test("POST /api/ocr/upload", False, f"Invalid response: {resp_data}")
                    return False
            else:
                self.log_test("POST /api/ocr/upload", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/ocr/upload", False, f"Exception: {str(e)}")
            return False
    
    def test_ocr_upload_invalid_file(self):
        """Test OCR upload with invalid file type"""
        try:
            if not self.token:
                self.log_test("POST /api/ocr/upload (invalid file)", False, "No token available")
                return False
            
            # Create a text file instead of image
            files = {
                'file': ('test.txt', b'This is not an image', 'text/plain')
            }
            
            response = requests.post(
                f"{API_BASE}/ocr/upload",
                files=files,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 400:
                resp_data = response.json()
                if not resp_data.get('success') and 'Invalid file type' in resp_data.get('error', ''):
                    self.log_test("POST /api/ocr/upload (invalid file)", True, "Correctly rejected invalid file type")
                    return True
                else:
                    self.log_test("POST /api/ocr/upload (invalid file)", False, f"Unexpected response: {resp_data}")
                    return False
            else:
                self.log_test("POST /api/ocr/upload (invalid file)", False, f"Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/ocr/upload (invalid file)", False, f"Exception: {str(e)}")
            return False
    
    def test_get_documents(self):
        """Test get documents list"""
        try:
            if not self.token:
                self.log_test("GET /api/ocr/documents", False, "No token available")
                return False
            
            response = requests.get(
                f"{API_BASE}/ocr/documents",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'documents' in data.get('data', {}):
                    docs = data['data']['documents']
                    pagination = data['data']['pagination']
                    self.log_test("GET /api/ocr/documents", True, f"Found {len(docs)} documents, total: {pagination['total']}")
                    return True
                else:
                    self.log_test("GET /api/ocr/documents", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("GET /api/ocr/documents", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/ocr/documents", False, f"Exception: {str(e)}")
            return False
    
    def test_get_documents_with_filters(self):
        """Test get documents with filters"""
        try:
            if not self.token:
                self.log_test("GET /api/ocr/documents (with filters)", False, "No token available")
                return False
            
            # Test with pagination and filters
            params = {
                'page': 1,
                'limit': 5,
                'status': 'COMPLETED',
                'language': 'eng'
            }
            
            response = requests.get(
                f"{API_BASE}/ocr/documents",
                params=params,
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("GET /api/ocr/documents (with filters)", True, "Filters applied successfully")
                    return True
                else:
                    self.log_test("GET /api/ocr/documents (with filters)", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("GET /api/ocr/documents (with filters)", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/ocr/documents (with filters)", False, f"Exception: {str(e)}")
            return False
    
    def test_get_single_document(self):
        """Test get single document"""
        try:
            if not self.token:
                self.log_test("GET /api/ocr/document/:id", False, "No token available")
                return False
            
            if not self.test_document_id:
                self.log_test("GET /api/ocr/document/:id", False, "No test document ID available")
                return False
            
            response = requests.get(
                f"{API_BASE}/ocr/document/{self.test_document_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'document' in data.get('data', {}):
                    doc = data['data']['document']
                    self.log_test("GET /api/ocr/document/:id", True, f"Document status: {doc.get('status')}")
                    return True
                else:
                    self.log_test("GET /api/ocr/document/:id", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("GET /api/ocr/document/:id", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/ocr/document/:id", False, f"Exception: {str(e)}")
            return False
    
    def test_update_document(self):
        """Test update document OCR text"""
        try:
            if not self.token:
                self.log_test("PATCH /api/ocr/document/:id", False, "No token available")
                return False
            
            if not self.test_document_id:
                self.log_test("PATCH /api/ocr/document/:id", False, "No test document ID available")
                return False
            
            update_data = {
                "ocrText": "Updated OCR text for testing purposes"
            }
            
            response = requests.patch(
                f"{API_BASE}/ocr/document/{self.test_document_id}",
                json=update_data,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'document' in data.get('data', {}):
                    doc = data['data']['document']
                    if doc.get('ocrText') == update_data['ocrText']:
                        self.log_test("PATCH /api/ocr/document/:id", True, "OCR text updated successfully")
                        return True
                    else:
                        self.log_test("PATCH /api/ocr/document/:id", False, "OCR text not updated correctly")
                        return False
                else:
                    self.log_test("PATCH /api/ocr/document/:id", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("PATCH /api/ocr/document/:id", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PATCH /api/ocr/document/:id", False, f"Exception: {str(e)}")
            return False
    
    def test_profile_update_name(self):
        """Test update user profile name"""
        try:
            if not self.token:
                self.log_test("PATCH /api/profile (name)", False, "No token available")
                return False
            
            update_data = {
                "name": "Updated OCR Test User"
            }
            
            response = requests.patch(
                f"{API_BASE}/profile",
                json=update_data,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'user' in data.get('data', {}):
                    user = data['data']['user']
                    if user.get('name') == update_data['name']:
                        self.log_test("PATCH /api/profile (name)", True, f"Name updated to: {user['name']}")
                        return True
                    else:
                        self.log_test("PATCH /api/profile (name)", False, "Name not updated correctly")
                        return False
                else:
                    self.log_test("PATCH /api/profile (name)", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("PATCH /api/profile (name)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PATCH /api/profile (name)", False, f"Exception: {str(e)}")
            return False
    
    def test_profile_update_password(self):
        """Test update user password"""
        try:
            if not self.token:
                self.log_test("PATCH /api/profile (password)", False, "No token available")
                return False
            
            update_data = {
                "oldPassword": TEST_USER["password"],
                "newPassword": "newdemo123"
            }
            
            response = requests.patch(
                f"{API_BASE}/profile",
                json=update_data,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("PATCH /api/profile (password)", True, "Password updated successfully")
                    
                    # Update our test password for future tests
                    TEST_USER["password"] = "newdemo123"
                    return True
                else:
                    self.log_test("PATCH /api/profile (password)", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("PATCH /api/profile (password)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PATCH /api/profile (password)", False, f"Exception: {str(e)}")
            return False
    
    def test_get_stats(self):
        """Test get user statistics"""
        try:
            if not self.token:
                self.log_test("GET /api/stats", False, "No token available")
                return False
            
            response = requests.get(
                f"{API_BASE}/stats",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'totalDocuments' in data.get('data', {}):
                    stats = data['data']
                    self.log_test("GET /api/stats", True, f"Total docs: {stats['totalDocuments']}, Completed: {stats['completedDocuments']}")
                    return True
                else:
                    self.log_test("GET /api/stats", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("GET /api/stats", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/stats", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_document(self):
        """Test delete document"""
        try:
            if not self.token:
                self.log_test("DELETE /api/ocr/document/:id", False, "No token available")
                return False
            
            if not self.test_document_id:
                self.log_test("DELETE /api/ocr/document/:id", False, "No test document ID available")
                return False
            
            response = requests.delete(
                f"{API_BASE}/ocr/document/{self.test_document_id}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("DELETE /api/ocr/document/:id", True, "Document deleted successfully")
                    return True
                else:
                    self.log_test("DELETE /api/ocr/document/:id", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("DELETE /api/ocr/document/:id", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("DELETE /api/ocr/document/:id", False, f"Exception: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        try:
            # Test without token
            response = requests.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 401:
                self.log_test("Unauthorized access protection", True, "Correctly blocked unauthorized access")
                return True
            else:
                self.log_test("Unauthorized access protection", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Unauthorized access protection", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting OCR Platform Backend API Tests")
        print("=" * 50)
        
        test_results = []
        
        # Authentication tests
        print("🔐 Authentication Tests")
        test_results.append(self.test_auth_signup())
        test_results.append(self.test_auth_me())
        test_results.append(self.test_unauthorized_access())
        
        # OCR Upload tests
        print("📤 OCR Upload Tests")
        test_results.append(self.test_ocr_upload())
        test_results.append(self.test_ocr_upload_invalid_file())
        
        # Document CRUD tests
        print("📄 Document CRUD Tests")
        test_results.append(self.test_get_documents())
        test_results.append(self.test_get_documents_with_filters())
        test_results.append(self.test_get_single_document())
        test_results.append(self.test_update_document())
        
        # Profile tests
        print("👤 Profile Management Tests")
        test_results.append(self.test_profile_update_name())
        test_results.append(self.test_profile_update_password())
        
        # Stats test
        print("📊 Statistics Tests")
        test_results.append(self.test_get_stats())
        
        # Cleanup
        print("🧹 Cleanup Tests")
        test_results.append(self.test_delete_document())
        
        # Summary
        print("=" * 50)
        passed = sum(test_results)
        total = len(test_results)
        print(f"📋 Test Summary: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            return False

if __name__ == "__main__":
    tester = OCRPlatformTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)