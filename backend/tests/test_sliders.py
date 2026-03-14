"""
Test Suite for Slider Management Feature
Tests: Public sliders API, Admin slider CRUD, and reorder functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials for admin authentication
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for admin API access"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def headers(auth_token):
    """Auth headers for admin requests"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPublicSlidersAPI:
    """Test public slider endpoint - GET /api/public/sliders"""
    
    def test_get_public_sliders_returns_200(self):
        """Public sliders endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/public/sliders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_public_sliders_returns_list(self):
        """Public sliders should return a list"""
        response = requests.get(f"{BASE_URL}/api/public/sliders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
    
    def test_get_public_sliders_sorted_by_order(self):
        """Public sliders should be sorted by order"""
        response = requests.get(f"{BASE_URL}/api/public/sliders")
        assert response.status_code == 200
        sliders = response.json()
        if len(sliders) > 1:
            orders = [s.get("order", 0) for s in sliders]
            assert orders == sorted(orders), "Sliders should be sorted by order"


class TestAdminSlidersAPI:
    """Test admin slider CRUD - requires authentication"""
    
    def test_get_admin_sliders_requires_auth(self):
        """Admin sliders endpoint should require auth"""
        response = requests.get(f"{BASE_URL}/api/admin/sliders")
        assert response.status_code == 401 or response.status_code == 403, "Should require authentication"
    
    def test_get_admin_sliders_returns_list(self, headers):
        """Admin should be able to get all sliders"""
        response = requests.get(f"{BASE_URL}/api/admin/sliders", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_slider_success(self, headers):
        """Admin should be able to create a slider"""
        unique_id = str(uuid.uuid4())[:8]
        slider_data = {
            "title": f"TEST_Slider_{unique_id}",
            "subtitle": "Test subtitle for slider",
            "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
            "link_url": "/apply",
            "order": 99,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/sliders", json=slider_data, headers=headers)
        assert response.status_code == 200 or response.status_code == 201, f"Create failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain slider id"
        assert data.get("title") == slider_data["title"]
        assert data.get("image_url") == slider_data["image_url"]
        
        # Clean up - delete the test slider
        slider_id = data["id"]
        requests.delete(f"{BASE_URL}/api/admin/sliders/{slider_id}", headers=headers)
    
    def test_create_slider_requires_image_url(self, headers):
        """Slider creation should have image_url (validated by frontend but API accepts)"""
        slider_data = {
            "title": "TEST_No_Image_Slider",
            "subtitle": "No image",
            "image_url": "",  # Empty image URL
            "order": 99
        }
        # The API may still accept this - depends on backend validation
        response = requests.post(f"{BASE_URL}/api/admin/sliders", json=slider_data, headers=headers)
        # Either 200/201 (accepted) or 422/400 (validation error) is acceptable
        assert response.status_code in [200, 201, 400, 422]
        
        if response.status_code in [200, 201]:
            # Clean up if created
            data = response.json()
            if data.get("id"):
                requests.delete(f"{BASE_URL}/api/admin/sliders/{data['id']}", headers=headers)
    
    def test_update_slider_success(self, headers):
        """Admin should be able to update a slider"""
        # First create a slider
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "title": f"TEST_Update_{unique_id}",
            "subtitle": "Original subtitle",
            "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
            "order": 98,
            "is_active": True
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/sliders", json=create_data, headers=headers)
        assert create_response.status_code in [200, 201]
        slider_id = create_response.json().get("id")
        
        try:
            # Update the slider
            update_data = {
                "title": f"TEST_Updated_{unique_id}",
                "subtitle": "Updated subtitle",
                "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
                "order": 98,
                "is_active": False
            }
            update_response = requests.put(f"{BASE_URL}/api/admin/sliders/{slider_id}", json=update_data, headers=headers)
            assert update_response.status_code == 200, f"Update failed: {update_response.status_code} - {update_response.text}"
        finally:
            # Clean up
            requests.delete(f"{BASE_URL}/api/admin/sliders/{slider_id}", headers=headers)
    
    def test_delete_slider_success(self, headers):
        """Admin should be able to delete a slider"""
        # First create a slider
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "title": f"TEST_Delete_{unique_id}",
            "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
            "order": 97
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/sliders", json=create_data, headers=headers)
        assert create_response.status_code in [200, 201]
        slider_id = create_response.json().get("id")
        
        # Delete the slider
        delete_response = requests.delete(f"{BASE_URL}/api/admin/sliders/{slider_id}", headers=headers)
        assert delete_response.status_code in [200, 204], f"Delete failed: {delete_response.status_code}"
        
        # Verify it's deleted - get all sliders and check
        all_sliders = requests.get(f"{BASE_URL}/api/admin/sliders", headers=headers).json()
        slider_ids = [s.get("id") for s in all_sliders]
        assert slider_id not in slider_ids, "Slider should be deleted"
    
    def test_delete_slider_not_found(self, headers):
        """Deleting non-existent slider should not fail (idempotent)"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/admin/sliders/{fake_id}", headers=headers)
        # MongoDB delete returns success even if no document matched
        assert response.status_code in [200, 204, 404]


class TestSliderReorderAPI:
    """Test slider reorder endpoint - PUT /api/admin/sliders/reorder"""
    
    def test_reorder_sliders_success(self, headers):
        """Admin should be able to reorder sliders"""
        # Get existing sliders
        response = requests.get(f"{BASE_URL}/api/admin/sliders", headers=headers)
        assert response.status_code == 200
        sliders = response.json()
        
        if len(sliders) < 2:
            pytest.skip("Need at least 2 sliders to test reorder")
        
        # Create reorder request - reverse the order
        items = [{"id": s["id"], "order": len(sliders) - i - 1} for i, s in enumerate(sliders)]
        reorder_data = {"items": items}
        
        reorder_response = requests.put(f"{BASE_URL}/api/admin/sliders/reorder", json=reorder_data, headers=headers)
        assert reorder_response.status_code == 200, f"Reorder failed: {reorder_response.status_code} - {reorder_response.text}"
        
        # Restore original order
        restore_items = [{"id": s["id"], "order": i} for i, s in enumerate(sliders)]
        requests.put(f"{BASE_URL}/api/admin/sliders/reorder", json={"items": restore_items}, headers=headers)
    
    def test_reorder_requires_auth(self):
        """Reorder endpoint should require authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/sliders/reorder", json={"items": []})
        assert response.status_code in [401, 403]


class TestSliderDataValidation:
    """Test slider data structure and validation"""
    
    def test_slider_has_required_fields(self, headers):
        """Sliders should have required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/sliders", headers=headers)
        assert response.status_code == 200
        sliders = response.json()
        
        if len(sliders) == 0:
            pytest.skip("No sliders to validate")
        
        slider = sliders[0]
        required_fields = ["id", "image_url", "is_active", "order"]
        for field in required_fields:
            assert field in slider, f"Slider should have '{field}' field"
    
    def test_public_sliders_only_shows_active(self, headers):
        """Public API should only return active sliders"""
        # Create an inactive slider
        unique_id = str(uuid.uuid4())[:8]
        create_data = {
            "title": f"TEST_Inactive_{unique_id}",
            "image_url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800",
            "is_active": False,
            "order": 999
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/sliders", json=create_data, headers=headers)
        slider_id = create_response.json().get("id")
        
        try:
            # Check public API
            public_response = requests.get(f"{BASE_URL}/api/public/sliders")
            public_sliders = public_response.json()
            public_slider_ids = [s.get("id") for s in public_sliders]
            
            # The inactive slider should NOT appear in public API
            assert slider_id not in public_slider_ids, "Inactive slider should not appear in public API"
        finally:
            # Clean up
            requests.delete(f"{BASE_URL}/api/admin/sliders/{slider_id}", headers=headers)


class TestHealthCheck:
    """Basic health check for API accessibility"""
    
    def test_api_accessible(self):
        """API should be accessible"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200, f"API not accessible: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
