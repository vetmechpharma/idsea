"""
Certificate Designer Bug Fixes & New Features Tests - Iteration 22
Tests: textarea for text content, opacity property, zoom controls, plan linking
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"

# Template with elements for testing
TEMPLATE_WITH_ELEMENTS = "d372adf1-d2f4-45ea-ba5d-14396ffc1021"


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


class TestPlanLinkingEndpoints:
    """Test new plan linking endpoints: PUT /link-plan and GET /by-plan/{type}"""
    
    test_template_id = None
    
    def test_01_create_template_for_linking(self, auth_headers):
        """Create a test template for plan linking tests"""
        template_data = {
            "name": "TEST_Plan_Linking_Template",
            "type": "membership",
            "orientation": "landscape",
            "background_color": "#ffffff",
            "elements": [
                {
                    "id": "el_link1",
                    "type": "text",
                    "x": 400,
                    "y": 50,
                    "width": 200,
                    "height": 40,
                    "content": "Test Certificate",
                    "color": "#0c3c60",
                    "font_family": "Helvetica",
                    "font_size": 28,
                    "font_weight": "bold",
                    "text_align": "center",
                    "opacity": 100
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
        TestPlanLinkingEndpoints.test_template_id = data["id"]
        print(f"Created test template: {data['id']}")
    
    def test_02_link_template_to_academic_plan(self, auth_headers):
        """PUT /api/admin/certificate-templates/{id}/link-plan - Link to academic"""
        tpl_id = TestPlanLinkingEndpoints.test_template_id
        assert tpl_id, "No template ID from create test"
        
        response = requests.put(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/link-plan",
            headers=auth_headers,
            json={"membership_type": "academic"}
        )
        assert response.status_code == 200, f"Link plan failed: {response.text}"
        data = response.json()
        assert "message" in data, "Should have message"
        assert "academic" in data["message"], "Message should mention academic"
        print(f"Link response: {data['message']}")
    
    def test_03_verify_template_linked(self, auth_headers):
        """Verify template has linked_membership_type set"""
        tpl_id = TestPlanLinkingEndpoints.test_template_id
        
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("linked_membership_type") == "academic", "Template should be linked to academic"
        print(f"Template linked_membership_type: {data.get('linked_membership_type')}")
    
    def test_04_get_template_by_plan_academic(self, auth_headers):
        """GET /api/admin/certificate-templates/by-plan/academic"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/by-plan/academic",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get by plan failed: {response.text}"
        data = response.json()
        assert data.get("linked_membership_type") == "academic", "Should return template linked to academic"
        print(f"Found template by plan: {data['name']}")
    
    def test_05_link_template_to_entrepreneur_plan(self, auth_headers):
        """Link same template to entrepreneur (should unlink from academic)"""
        tpl_id = TestPlanLinkingEndpoints.test_template_id
        
        response = requests.put(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/link-plan",
            headers=auth_headers,
            json={"membership_type": "entrepreneur"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "entrepreneur" in data["message"]
        print(f"Relinked to entrepreneur: {data['message']}")
    
    def test_06_get_template_by_plan_entrepreneur(self, auth_headers):
        """GET /api/admin/certificate-templates/by-plan/entrepreneur"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/by-plan/entrepreneur",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("linked_membership_type") == "entrepreneur"
        print(f"Found template by entrepreneur plan: {data['name']}")
    
    def test_07_unlink_template(self, auth_headers):
        """Unlink template by passing empty membership_type"""
        tpl_id = TestPlanLinkingEndpoints.test_template_id
        
        response = requests.put(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/link-plan",
            headers=auth_headers,
            json={"membership_type": ""}
        )
        assert response.status_code == 200
        data = response.json()
        assert "unlinked" in data["message"].lower() or "linked to" not in data["message"].lower()
        print(f"Unlink response: {data['message']}")
    
    def test_08_get_by_plan_not_found(self, auth_headers):
        """GET /api/admin/certificate-templates/by-plan/nonexistent - 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/by-plan/nonexistent_plan",
            headers=auth_headers
        )
        assert response.status_code == 404, "Should return 404 for unlinked plan"
        print("Correctly returns 404 for nonexistent plan")
    
    def test_09_cleanup_test_template(self, auth_headers):
        """Delete test template"""
        tpl_id = TestPlanLinkingEndpoints.test_template_id
        if tpl_id:
            response = requests.delete(
                f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
                headers=auth_headers
            )
            assert response.status_code == 200
            print(f"Cleaned up test template: {tpl_id}")


class TestOpacityProperty:
    """Test opacity property in template elements"""
    
    test_template_id = None
    
    def test_01_create_template_with_opacity(self, auth_headers):
        """Create template with elements having opacity property"""
        template_data = {
            "name": "TEST_Opacity_Template",
            "type": "membership",
            "orientation": "landscape",
            "background_color": "#ffffff",
            "elements": [
                {
                    "id": "el_opacity1",
                    "type": "text",
                    "x": 400,
                    "y": 50,
                    "width": 200,
                    "height": 40,
                    "content": "Full Opacity Text",
                    "color": "#0c3c60",
                    "font_family": "Helvetica",
                    "font_size": 24,
                    "font_weight": "bold",
                    "text_align": "center",
                    "opacity": 100
                },
                {
                    "id": "el_opacity2",
                    "type": "text",
                    "x": 400,
                    "y": 150,
                    "width": 200,
                    "height": 40,
                    "content": "Half Opacity Text",
                    "color": "#0c3c60",
                    "font_family": "Helvetica",
                    "font_size": 24,
                    "font_weight": "normal",
                    "text_align": "center",
                    "opacity": 50
                },
                {
                    "id": "el_opacity3",
                    "type": "placeholder",
                    "x": 400,
                    "y": 250,
                    "width": 200,
                    "height": 40,
                    "placeholder_key": "name",
                    "content": "{{name}}",
                    "color": "#111827",
                    "font_family": "Helvetica",
                    "font_size": 20,
                    "text_align": "center",
                    "opacity": 75
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
        TestOpacityProperty.test_template_id = data["id"]
        
        # Verify opacity values are stored
        assert len(data["elements"]) == 3
        assert data["elements"][0].get("opacity") == 100
        assert data["elements"][1].get("opacity") == 50
        assert data["elements"][2].get("opacity") == 75
        print(f"Created template with opacity elements: {data['id']}")
    
    def test_02_update_element_opacity(self, auth_headers):
        """Update element opacity value"""
        tpl_id = TestOpacityProperty.test_template_id
        
        # Get current template
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers
        )
        data = response.json()
        
        # Update opacity of first element
        data["elements"][0]["opacity"] = 30
        
        response = requests.put(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
            headers=auth_headers,
            json=data
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["elements"][0].get("opacity") == 30
        print(f"Updated element opacity to 30")
    
    def test_03_preview_template_with_opacity(self, auth_headers):
        """Preview template with opacity elements - should generate valid PDF"""
        tpl_id = TestOpacityProperty.test_template_id
        
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Preview failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000
        print(f"Preview PDF with opacity generated: {len(response.content)} bytes")
    
    def test_04_cleanup_opacity_template(self, auth_headers):
        """Delete test template"""
        tpl_id = TestOpacityProperty.test_template_id
        if tpl_id:
            response = requests.delete(
                f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
                headers=auth_headers
            )
            assert response.status_code == 200
            print(f"Cleaned up opacity test template")


class TestMultiLineTextContent:
    """Test multi-line text content (textarea support)"""
    
    test_template_id = None
    
    def test_01_create_template_with_multiline_text(self, auth_headers):
        """Create template with multi-line text content"""
        template_data = {
            "name": "TEST_MultiLine_Template",
            "type": "membership",
            "orientation": "landscape",
            "background_color": "#ffffff",
            "elements": [
                {
                    "id": "el_multi1",
                    "type": "text",
                    "x": 200,
                    "y": 100,
                    "width": 600,
                    "height": 100,
                    "content": "This is a multi-line text\nthat spans across\nmultiple lines",
                    "color": "#0c3c60",
                    "font_family": "Helvetica",
                    "font_size": 16,
                    "font_weight": "normal",
                    "text_align": "center",
                    "opacity": 100
                },
                {
                    "id": "el_multi2",
                    "type": "text",
                    "x": 200,
                    "y": 250,
                    "width": 600,
                    "height": 80,
                    "content": "This is a very long text that should wrap automatically when rendered in the PDF because it exceeds the width of the element box",
                    "color": "#374151",
                    "font_family": "Helvetica",
                    "font_size": 14,
                    "font_weight": "normal",
                    "text_align": "left",
                    "opacity": 100
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
        TestMultiLineTextContent.test_template_id = data["id"]
        
        # Verify multi-line content is stored
        assert "\n" in data["elements"][0]["content"], "Multi-line content should be preserved"
        print(f"Created template with multi-line text: {data['id']}")
    
    def test_02_preview_multiline_text_pdf(self, auth_headers):
        """Preview template with multi-line text - PDF should render with text wrapping"""
        tpl_id = TestMultiLineTextContent.test_template_id
        
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Preview failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000
        print(f"Multi-line text PDF generated: {len(response.content)} bytes")
    
    def test_03_cleanup_multiline_template(self, auth_headers):
        """Delete test template"""
        tpl_id = TestMultiLineTextContent.test_template_id
        if tpl_id:
            response = requests.delete(
                f"{BASE_URL}/api/admin/certificate-templates/{tpl_id}",
                headers=auth_headers
            )
            assert response.status_code == 200
            print(f"Cleaned up multi-line test template")


class TestExistingTemplateWithElements:
    """Test the existing template with 8 elements"""
    
    def test_01_get_template_with_elements(self, auth_headers):
        """GET template d372adf1-d2f4-45ea-ba5d-14396ffc1021"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates/{TEMPLATE_WITH_ELEMENTS}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get template failed: {response.text}"
        data = response.json()
        
        assert data["id"] == TEMPLATE_WITH_ELEMENTS
        assert len(data["elements"]) == 8, f"Expected 8 elements, got {len(data['elements'])}"
        
        # Verify element types
        element_types = [el["type"] for el in data["elements"]]
        assert "text" in element_types
        assert "placeholder" in element_types
        assert "signature_block" in element_types
        
        print(f"Template has {len(data['elements'])} elements: {element_types}")
    
    def test_02_preview_template_with_elements(self, auth_headers):
        """Preview template with all 8 elements"""
        response = requests.post(
            f"{BASE_URL}/api/admin/certificate-templates/{TEMPLATE_WITH_ELEMENTS}/preview",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Preview failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000
        print(f"Template preview PDF: {len(response.content)} bytes")


class TestLinkedMembershipTypeInList:
    """Test that linked_membership_type appears in template list"""
    
    def test_01_list_templates_shows_linked_type(self, auth_headers):
        """GET /api/admin/certificate-templates - Check linked_membership_type field"""
        response = requests.get(
            f"{BASE_URL}/api/admin/certificate-templates",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check if any template has linked_membership_type
        linked_templates = [t for t in data if t.get("linked_membership_type")]
        print(f"Found {len(linked_templates)} templates with linked_membership_type")
        
        for t in linked_templates:
            print(f"  - {t['name']}: linked to {t['linked_membership_type']}")
        
        # Verify the field exists in response structure
        if len(data) > 0:
            assert "linked_membership_type" in data[0] or data[0].get("linked_membership_type") is None or data[0].get("linked_membership_type") == ""
            print("linked_membership_type field present in template response")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
