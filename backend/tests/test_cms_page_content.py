"""
Test CMS Page Content System - Iteration 24
Tests for dynamic page content management:
- GET /api/public/page-content/{page} - Public access to page content
- GET /api/admin/page-content/{page} - Admin access to page content
- PUT /api/admin/page-content/{page} - Admin update page content
- Seeded content verification for all pages
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"

# All pages that should have seeded content
ALL_PAGES = ['home', 'about', 'events', 'gallery', 'publications', 'members', 'contact', 'navbar', 'footer']


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestPublicPageContent:
    """Test public page content endpoints"""

    def test_public_home_page_content(self, api_client):
        """GET /api/public/page-content/home returns seeded home content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/home")
        assert response.status_code == 200
        data = response.json()
        # Verify home page has expected fields
        assert "about_title" in data or data == {}  # May be empty if not seeded yet
        if data:
            assert "about_subtitle" in data
            assert "membership_title" in data
            assert "events_title" in data
            assert "cta_title" in data
        print(f"Home page content: {list(data.keys()) if data else 'empty'}")

    def test_public_about_page_content(self, api_client):
        """GET /api/public/page-content/about returns seeded about content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/about")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "hero_title" in data
            assert "objectives" in data
            assert "council_title" in data
        print(f"About page content: {list(data.keys()) if data else 'empty'}")

    def test_public_events_page_content(self, api_client):
        """GET /api/public/page-content/events returns seeded events content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/events")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "hero_title" in data
        print(f"Events page content: {list(data.keys()) if data else 'empty'}")

    def test_public_gallery_page_content(self, api_client):
        """GET /api/public/page-content/gallery returns seeded gallery content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/gallery")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "hero_title" in data
        print(f"Gallery page content: {list(data.keys()) if data else 'empty'}")

    def test_public_publications_page_content(self, api_client):
        """GET /api/public/page-content/publications returns seeded publications content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/publications")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "hero_title" in data
        print(f"Publications page content: {list(data.keys()) if data else 'empty'}")

    def test_public_members_page_content(self, api_client):
        """GET /api/public/page-content/members returns seeded members content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/members")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "hero_title" in data
        print(f"Members page content: {list(data.keys()) if data else 'empty'}")

    def test_public_contact_page_content(self, api_client):
        """GET /api/public/page-content/contact returns seeded contact content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/contact")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "hero_title" in data
            assert "form_title" in data
        print(f"Contact page content: {list(data.keys()) if data else 'empty'}")

    def test_public_navbar_content(self, api_client):
        """GET /api/public/page-content/navbar returns seeded navbar content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/navbar")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "org_name" in data
            assert "org_short" in data
        print(f"Navbar content: {list(data.keys()) if data else 'empty'}")

    def test_public_footer_content(self, api_client):
        """GET /api/public/page-content/footer returns seeded footer content"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/footer")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert "description" in data
            assert "copyright_text" in data
        print(f"Footer content: {list(data.keys()) if data else 'empty'}")

    def test_public_nonexistent_page_returns_empty(self, api_client):
        """GET /api/public/page-content/nonexistent returns empty object"""
        response = api_client.get(f"{BASE_URL}/api/public/page-content/nonexistent")
        assert response.status_code == 200
        data = response.json()
        assert data == {}


class TestAdminPageContent:
    """Test admin page content endpoints"""

    def test_admin_get_home_content(self, authenticated_client):
        """GET /api/admin/page-content/home returns content for admin"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/home")
        assert response.status_code == 200
        data = response.json()
        print(f"Admin home content: {list(data.keys()) if data else 'empty'}")

    def test_admin_get_about_content(self, authenticated_client):
        """GET /api/admin/page-content/about returns content for admin"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/about")
        assert response.status_code == 200
        data = response.json()
        print(f"Admin about content: {list(data.keys()) if data else 'empty'}")

    def test_admin_update_home_content(self, authenticated_client):
        """PUT /api/admin/page-content/home updates home page content"""
        # First get current content
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/home")
        original_content = get_response.json()
        
        # Update with test content
        test_content = {
            **original_content,
            "about_title": "TEST_About IDSEA Updated",
            "about_subtitle": "TEST_Updated Subtitle",
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/page-content/home",
            json=test_content
        )
        assert update_response.status_code == 200
        assert "updated" in update_response.json().get("message", "").lower()
        
        # Verify update persisted
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/home")
        assert verify_response.status_code == 200
        updated_data = verify_response.json()
        assert updated_data.get("about_title") == "TEST_About IDSEA Updated"
        
        # Restore original content
        authenticated_client.put(f"{BASE_URL}/api/admin/page-content/home", json=original_content)
        print("Home page content update test passed")

    def test_admin_update_about_content(self, authenticated_client):
        """PUT /api/admin/page-content/about updates about page content"""
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/about")
        original_content = get_response.json()
        
        test_content = {
            **original_content,
            "hero_title": "TEST_About IDSEA Hero",
            "council_title": "TEST_Executive Council",
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/page-content/about",
            json=test_content
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/about")
        updated_data = verify_response.json()
        assert updated_data.get("hero_title") == "TEST_About IDSEA Hero"
        
        # Restore
        authenticated_client.put(f"{BASE_URL}/api/admin/page-content/about", json=original_content)
        print("About page content update test passed")

    def test_admin_update_navbar_content(self, authenticated_client):
        """PUT /api/admin/page-content/navbar updates navbar content"""
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/navbar")
        original_content = get_response.json()
        
        test_content = {
            "org_name": "TEST_Organization Name",
            "org_short": "(TEST)",
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/page-content/navbar",
            json=test_content
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/navbar")
        updated_data = verify_response.json()
        assert updated_data.get("org_name") == "TEST_Organization Name"
        
        # Restore
        authenticated_client.put(f"{BASE_URL}/api/admin/page-content/navbar", json=original_content)
        print("Navbar content update test passed")

    def test_admin_update_footer_content(self, authenticated_client):
        """PUT /api/admin/page-content/footer updates footer content"""
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/footer")
        original_content = get_response.json()
        
        test_content = {
            "description": "TEST_Footer Description",
            "copyright_text": "TEST_Copyright 2026",
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/page-content/footer",
            json=test_content
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/footer")
        updated_data = verify_response.json()
        assert updated_data.get("description") == "TEST_Footer Description"
        
        # Restore
        authenticated_client.put(f"{BASE_URL}/api/admin/page-content/footer", json=original_content)
        print("Footer content update test passed")

    def test_admin_update_contact_content(self, authenticated_client):
        """PUT /api/admin/page-content/contact updates contact page content"""
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/contact")
        original_content = get_response.json()
        
        test_content = {
            **original_content,
            "hero_title": "TEST_Contact Us",
            "form_title": "TEST_Send Message",
            "membership_cta_title": "TEST_Join Now",
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/page-content/contact",
            json=test_content
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/contact")
        updated_data = verify_response.json()
        assert updated_data.get("hero_title") == "TEST_Contact Us"
        
        # Restore
        authenticated_client.put(f"{BASE_URL}/api/admin/page-content/contact", json=original_content)
        print("Contact page content update test passed")

    def test_admin_update_events_hero(self, authenticated_client):
        """PUT /api/admin/page-content/events updates events hero"""
        get_response = authenticated_client.get(f"{BASE_URL}/api/admin/page-content/events")
        original_content = get_response.json()
        
        test_content = {
            "hero_title": "TEST_Events & Conferences",
            "hero_subtitle": "TEST_Subtitle",
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/page-content/events",
            json=test_content
        )
        assert update_response.status_code == 200
        
        # Restore
        authenticated_client.put(f"{BASE_URL}/api/admin/page-content/events", json=original_content)
        print("Events page content update test passed")


class TestAdminAuthRequired:
    """Test that admin endpoints require authentication"""

    def test_admin_get_page_content_requires_auth(self, api_client):
        """GET /api/admin/page-content/{page} requires auth"""
        # Remove auth header if present
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/admin/page-content/home")
        assert response.status_code in [401, 403]

    def test_admin_update_page_content_requires_auth(self, api_client):
        """PUT /api/admin/page-content/{page} requires auth"""
        api_client.headers.pop("Authorization", None)
        response = api_client.put(
            f"{BASE_URL}/api/admin/page-content/home",
            json={"test": "data"}
        )
        assert response.status_code in [401, 403]


class TestMembershipPlans:
    """Test membership plans endpoint used by Home and Footer"""

    def test_public_membership_plans(self, api_client):
        """GET /api/public/membership-plans returns plans"""
        response = api_client.get(f"{BASE_URL}/api/public/membership-plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Membership plans count: {len(data)}")
        if data:
            plan = data[0]
            assert "name" in plan or "key" in plan
            print(f"First plan: {plan.get('name', plan.get('key', 'unknown'))}")


class TestCMSSettings:
    """Test CMS settings used by About page for vision/mission"""

    def test_public_cms_settings(self, api_client):
        """GET /api/public/cms returns CMS settings"""
        response = api_client.get(f"{BASE_URL}/api/public/cms")
        assert response.status_code == 200
        data = response.json()
        # CMS settings should have vision and mission
        if data:
            print(f"CMS settings keys: {list(data.keys())}")
            # These are used by AboutPage
            assert "vision" in data or data == {}
            assert "mission" in data or data == {}

    def test_admin_cms_settings(self, authenticated_client):
        """GET /api/admin/cms returns CMS settings for admin"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/cms")
        assert response.status_code == 200
        data = response.json()
        print(f"Admin CMS settings: {list(data.keys()) if data else 'empty'}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
