"""
Backend tests for Event Detail Page endpoints (GET/PUT).
Iteration 25 - Tests for /api/public/events/{id}/details and admin editor endpoints.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com').rstrip('/')
EVENT_ID = "eb488c54-2ee9-4160-b851-548846ec1038"
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASS = "Admin@123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


class TestPublicEvent:
    """Public endpoints for event detail page"""

    def test_public_event_exists(self):
        r = requests.get(f"{BASE_URL}/api/public/events/{EVENT_ID}", timeout=15)
        assert r.status_code == 200, f"Event not found: {r.text}"
        data = r.json()
        assert data.get("id") == EVENT_ID
        assert "title" in data
        assert "venue" in data

    def test_public_event_details_endpoint(self):
        r = requests.get(f"{BASE_URL}/api/public/events/{EVENT_ID}/details", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        assert data.get("event_id") == EVENT_ID

    def test_public_event_details_not_leak_objectid(self):
        r = requests.get(f"{BASE_URL}/api/public/events/{EVENT_ID}/details", timeout=15)
        assert "_id" not in r.text or "_id" not in r.json()

    def test_public_event_details_missing_returns_empty(self):
        r = requests.get(f"{BASE_URL}/api/public/events/nonexistent-id-999/details", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("event_id") == "nonexistent-id-999"


class TestAdminEventDetails:
    """Admin CRUD for event details"""

    def test_admin_get_event_details_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/events/{EVENT_ID}/details", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_get_event_details_ok(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/events/{EVENT_ID}/details", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("event_id") == EVENT_ID

    def test_admin_put_event_details_persists(self, auth_headers):
        # Prepare rich payload with colored dates, venue_info, sightseeing, committee
        payload = {
            "gallery_images": ["/api/uploads/test1.jpg", "/api/uploads/test2.jpg"],
            "countdown_date": "2026-06-01T10:00:00",
            "countdown_label": "Registration Closes In",
            "about_content": "TEST_ABOUT This is a comprehensive event.",
            "themes": ["Sustainability", "Innovation"],
            "important_dates": [
                {"label": "Abstract Submission", "date": "2026-03-01", "color": "red", "status": "active"},
                {"label": "Full Paper", "date": "2026-04-15", "color": "green", "status": ""},
                {"label": "Registration Closes", "date": "2026-05-15", "color": "purple", "status": "closed"},
                {"label": "Early Bird", "date": "2026-04-01", "color": "amber", "status": "active"},
                {"label": "Event Date", "date": "2026-06-01", "color": "blue", "status": ""},
            ],
            "awards": "Best Paper Award\nStudent Innovation Award",
            "sponsors": [{"name": "Platinum", "amount": "5L", "color": "#7c3aed", "benefits": "Logo\nBooth"}],
            "committee": [
                {"role": "Chairman", "name": "TEST_Dr. Alpha", "affiliation": "IIT", "phone": "9999999999", "photo_url": ""},
                {"role": "Convener", "name": "TEST_Dr. Beta", "affiliation": "NDRI", "phone": "8888888888", "photo_url": "/api/uploads/photo.jpg"},
            ],
            "venue_info": {
                "name": "Grand Hall",
                "address": "123 Test Street, Bangalore",
                "map_embed_url": "https://www.google.com/maps/embed?pb=test",
                "map_qr_link": "https://maps.google.com/?q=test",
            },
            "how_to_reach": "By Air: BLR airport 30km\nBy Rail: SBC station 5km",
            "weather": "Pleasant 20-28C",
            "sightseeing_places": [
                {"name": "Lalbagh", "distance": "5 km", "image_url": "/api/uploads/lalbagh.jpg"},
                {"name": "Cubbon Park", "distance": "6 km", "image_url": ""},
            ],
            "contacts": [{"name": "TEST_Contact", "role": "Coordinator", "phone": "111", "email": "test@x.com"}],
        }
        r = requests.put(f"{BASE_URL}/api/admin/events/{EVENT_ID}/details", headers=auth_headers, json=payload, timeout=20)
        assert r.status_code == 200, f"PUT failed: {r.text}"

        # Verify via public GET
        r2 = requests.get(f"{BASE_URL}/api/public/events/{EVENT_ID}/details", timeout=15)
        assert r2.status_code == 200
        data = r2.json()
        assert data.get("about_content") == "TEST_ABOUT This is a comprehensive event."
        assert len(data.get("important_dates", [])) == 5
        assert data["important_dates"][0]["color"] == "red"
        assert data["important_dates"][0]["status"] == "active"
        assert data.get("venue_info", {}).get("map_embed_url") == "https://www.google.com/maps/embed?pb=test"
        assert data.get("venue_info", {}).get("map_qr_link") == "https://maps.google.com/?q=test"
        assert len(data.get("sightseeing_places", [])) == 2
        assert len(data.get("committee", [])) == 2
        assert len(data.get("gallery_images", [])) == 2

    def test_admin_members_endpoint_for_committee_linking(self, auth_headers):
        """Committee editor uses /api/admin/members?status=approved for search"""
        r = requests.get(f"{BASE_URL}/api/admin/members", headers=auth_headers, params={"status": "approved"}, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
