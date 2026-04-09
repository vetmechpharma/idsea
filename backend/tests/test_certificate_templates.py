"""
Certificate Template Designer API Tests
Tests CRUD operations, preview, clone, and certificate generation endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"

# Test data
EXISTING_TEMPLATE_ID = "b9c02916-8547-4e92-8131-df54f340e351"
TEST_EVENT_ID = "a6d69db6-d6f8-4fb6-a707-14dc903f8bfc"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, "No access_token in response"
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestCertificateTemplatesCRUD:
    """Test CRUD operations for certificate templates"""
    
    created_template_id = None
    
    def test_01_list_templates(self, auth_headers):
        """GET /api/admin/certificate-templates - List all templates"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates",
            headers=auth_headers
        )
        assert response.status_code == 200, f"List templates failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} templates")
        
        # Verify template structure if templates exist
        if len(data) > 0:
            tpl = data[0]
            assert "id" in tpl, "Template should have id"
            assert "name" in tpl, "Template should have name"
            assert "type" in tpl, "Template should have type"
            assert "orientation" in tpl, "Template should have orientation"
            assert "elements" in tpl, "Template should have elements"
            print(f"First template: {tpl['name']} (type: {tpl['type']}, orientation: {tpl['orientation']})")
    
    def test_02_create_template(self, auth_headers):
        """POST /api/admin/certificate-templates - Create new template"""
        template_data = {
            "name": "TEST_Certificate_Template",
            "type": "membership",
            "orientation": "landscape",
            "background_color": "#f0f9ff",
            "background_image_url": "",
            "elements": [
                {
                    "id": "el_test1",
                    "type": "text",
                    "x": 400,
                    "y": 50,
                    "width": 200,
                    "height": 40,
                    "content": "Certificate of Membership",
                    "color": "#0c3c60",
                    "font_family": "Helvetica",
                    "font_size": 28,
                    "font_weight": "bold",
                    "font_style": "normal",
                    "text_align": "center",
                    "text_decoration": "none"
                },
                {
                    "id": "el_test2",
                    "type": "placeholder",
                    "x": 350,
                    "y": 200,
                    "width": 300,
                    "height": 50,
                    "placeholder_key": "name",
                    "content": "{{name}}",
                    "color": "#111827",
                    "font_family": "Times-Roman",
                    "font_size": 24,
                    "font_weight": "bold",
                    "font_style": "normal",
                    "text_align": "center",
                    "text_decoration": "none"
                },
                {
                    "id": "el_test3",
                    "type": "line",
                    "x": 300,
                    "y": 260,
                    "width": 400,
                    "height": 4,
                    "line_color": "#0c3c60",
                    "line_width": 2
                },
                {
                    "id": "el_test4",
                    "type": "signature_block",
                    "x": 400,
                    "y": 500,
                    "width": 160,
                    "height": 100,
                    "signer_name": "Dr. Test Signer",
                    "signer_title": "President",
                    "signature_image_url": "",
                    "color": "#000000",
                    "font_family": "Helvetica",
                    "font_size": 11
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates",
            headers=auth_headers,
            json=template_data
        )
        assert response.status_code == 200, f"Create template failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data, "Created template should have id"
        assert data["name"] == template_data["name"], "Name mismatch"
        assert data["type"] == template_data["type"], "Type mismatch"
        assert data["orientation"] == template_data["orientation"], "Orientation mismatch"
        assert len(data["elements"]) == 4, "Should have 4 elements"
        
        # Store for later tests
        TestCertificateTemplatesCRUD.created_template_id = data["id"]
        print(f"Created template: {data['id']}")
    
    def test_03_get_template(self, auth_headers):
        """GET /api/admin/certificate-templates/{id} - Get single template"""
        tpl_id = TestCertificateTemplatesCRUD.created_template_id
        assert tpl_id, "No template ID from create test"
        
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get template failed: {response.text}"
        data = response.json()
        
        assert data["id"] == tpl_id, "ID mismatch"
        assert data["name"] == "TEST_Certificate_Template", "Name mismatch"
        assert len(data["elements"]) == 4, "Should have 4 elements"
        print(f"Retrieved template: {data['name']}")
    
    def test_04_update_template(self, auth_headers):
        """PUT /api/admin/certificate-templates/{id} - Update template"""
        tpl_id = TestCertificateTemplatesCRUD.created_template_id
        assert tpl_id, "No template ID from create test"
        
        update_data = {
            "name": "TEST_Certificate_Template_Updated",
            "type": "event",
            "orientation": "portrait",
            "background_color": "#ffffff",
            "elements": [
                {
                    "id": "el_updated1",
                    "type": "text",
                    "x": 250,
                    "y": 100,
                    "width": 200,
                    "height": 40,
                    "content": "Updated Certificate",
                    "color": "#1e40af",
                    "font_family": "Helvetica",
                    "font_size": 32,
                    "font_weight": "bold",
                    "font_style": "normal",
                    "text_align": "center",
                    "text_decoration": "none"
                }
            ]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200, f"Update template failed: {response.text}"
        data = response.json()
        
        assert data["name"] == "TEST_Certificate_Template_Updated", "Name not updated"
        assert data["type"] == "event", "Type not updated"
        assert data["orientation"] == "portrait", "Orientation not updated"
        assert len(data["elements"]) == 1, "Elements not updated"
        print(f"Updated template: {data['name']}")
    
    def test_05_clone_template(self, auth_headers):
        """POST /api/admin/certificate-templates/{id}/clone - Clone template"""
        tpl_id = TestCertificateTemplatesCRUD.created_template_id
        assert tpl_id, "No template ID from create test"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/clone",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Clone template failed: {response.text}"
        data = response.json()
        
        assert data["id"] != tpl_id, "Cloned template should have different ID"
        assert "(Copy)" in data["name"], "Cloned template name should contain (Copy)"
        print(f"Cloned template: {data['id']} - {data['name']}")
        
        # Clean up cloned template
        requests.delete(
            f"{BASE_URL}/api/admin/certificate-templates/{data['id']}",
            headers=auth_headers
        )
    
    def test_06_preview_template(self, auth_headers):
        """POST /api/admin/certificate-templates/{id}/preview - Generate preview PDF"""
        tpl_id = TestCertificateTemplatesCRUD.created_template_id
        assert tpl_id, "No template ID from create test"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Preview template failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf", "Response should be PDF"
        assert len(response.content) > 1000, "PDF content should be substantial"
        print(f"Preview PDF generated: {len(response.content)} bytes")
    
    def test_07_preview_existing_template(self, auth_headers):
        """POST /api/admin/certificate-templates/{id}/preview - Preview existing template"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{EXISTING_TEMPLATE_ID}/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Preview existing template failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf", "Response should be PDF"
        print(f"Existing template preview PDF: {len(response.content)} bytes")
    
    def test_08_delete_template(self, auth_headers):
        """DELETE /api/admin/certificate-templates/{id} - Delete template"""
        tpl_id = TestCertificateTemplatesCRUD.created_template_id
        assert tpl_id, "No template ID from create test"
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Delete template failed: {response.text}"
        data = response.json()
        assert "message" in data, "Should have message"
        print(f"Deleted template: {tpl_id}")
        
        # Verify deletion
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers
        )
        assert response.status_code == 404, "Template should not exist after deletion"


class TestCertificateGeneration:
    """Test certificate generation for members and events"""
    
    def test_01_get_members_for_generation(self, auth_headers):
        """GET /api/admin/members - Get approved members for certificate generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members",
            headers=auth_headers,
            params={"status": "approved"}
        )
        assert response.status_code == 200, f"Get members failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} approved members")
        
        if len(data) > 0:
            member = data[0]
            assert "id" in member, "Member should have id"
            assert "name" in member, "Member should have name"
            print(f"First member: {member.get('name')} ({member.get('membership_id', 'N/A')})")
            return member["id"]
        return None
    
    def test_02_generate_member_certificate(self, auth_headers):
        """POST /api/admin/certificate-templates/{tpl_id}/generate-member/{member_id}"""
        # First get a member
        response = requests.get(
            f"{BASE_URL}/api/admin/members",
            headers=auth_headers,
            params={"status": "approved"}
        )
        members = response.json()
        
        if len(members) == 0:
            pytest.skip("No approved members available for certificate generation")
        
        member_id = members[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{EXISTING_TEMPLATE_ID}/generate-member/{member_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Generate member certificate failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf", "Response should be PDF"
        assert len(response.content) > 1000, "PDF content should be substantial"
        print(f"Member certificate PDF generated: {len(response.content)} bytes")
    
    def test_03_get_events_for_generation(self, auth_headers):
        """GET /api/admin/events - Get events for bulk certificate generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get events failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Found {len(data)} events")
        
        if len(data) > 0:
            event = data[0]
            assert "id" in event, "Event should have id"
            assert "title" in event, "Event should have title"
            print(f"First event: {event.get('title')}")
    
    def test_04_generate_event_certificates_bulk(self, auth_headers):
        """POST /api/admin/certificate-templates/{tpl_id}/generate-event/{event_id} - Bulk ZIP"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{EXISTING_TEMPLATE_ID}/generate-event/{TEST_EVENT_ID}",
            headers=auth_headers,
            timeout=60  # Bulk generation may take time
        )
        assert response.status_code == 200, f"Generate event certificates failed: {response.text}"
        assert response.headers.get("content-type") == "application/zip", "Response should be ZIP"
        print(f"Event certificates ZIP generated: {len(response.content)} bytes")


class TestCertificateTemplateValidation:
    """Test validation and error handling"""
    
    def test_01_get_nonexistent_template(self, auth_headers):
        """GET /api/admin/certificate-templates/{id} - 404 for nonexistent"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_02_update_nonexistent_template(self, auth_headers):
        """PUT /api/admin/certificate-templates/{id} - 404 for nonexistent"""
        response = requests.put(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id-12345",
            headers=auth_headers,
            json={"name": "Test"}
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_03_delete_nonexistent_template(self, auth_headers):
        """DELETE /api/admin/certificate-templates/{id} - 404 for nonexistent"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id-12345",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_04_clone_nonexistent_template(self, auth_headers):
        """POST /api/admin/certificate-templates/{id}/clone - 404 for nonexistent"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id-12345/clone",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_05_preview_nonexistent_template(self, auth_headers):
        """POST /api/admin/certificate-templates/{id}/preview - 404 for nonexistent"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id-12345/preview",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_06_generate_member_cert_nonexistent_template(self, auth_headers):
        """POST generate-member with nonexistent template - 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id/generate-member/some-member-id",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_07_generate_event_cert_nonexistent_template(self, auth_headers):
        """POST generate-event with nonexistent template - 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/nonexistent-id/generate-event/some-event-id",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for nonexistent template"
    
    def test_08_unauthorized_access(self):
        """Test endpoints without auth token - should fail"""
        response = requests.get(f"{BASE_URL}/api/admin/certificate-templates")
        assert response.status_code in [401, 403], "Should require authentication"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
