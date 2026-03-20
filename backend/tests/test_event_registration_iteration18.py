"""
Test Event Registration Enhancements - Iteration 18
Tests for:
1. Registration-info API returns venue_map_link and additional_person_fee_usd
2. Admin events with registration_enabled have Registrations link
3. Premium hotels show USD prices for international delegates
4. Admin Events page has INR and USD additional person fee inputs
5. EventRegistrations page accessibility
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EVENT_ID = "a6d69db6-d6f8-4fb6-a707-14dc903f8bfc"
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"

@pytest.fixture(scope="module")
def auth_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def admin_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestRegistrationInfoAPI:
    """Test /api/public/events/{event_id}/registration-info endpoint"""
    
    def test_registration_info_returns_venue_map_link(self):
        """Verify venue_map_link is returned in registration-info response"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200, f"Failed to get registration info: {response.text}"
        data = response.json()
        
        # venue_map_link should be present
        assert "venue_map_link" in data, "venue_map_link field missing from response"
        assert data["venue_map_link"], "venue_map_link should have a value"
        assert data["venue_map_link"].startswith("http"), "venue_map_link should be a URL"
    
    def test_registration_info_returns_additional_person_fee_usd(self):
        """Verify additional_person_fee_usd is returned for international delegates"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        
        # additional_person_fee_usd should be present and >= 0
        assert "additional_person_fee_usd" in data, "additional_person_fee_usd field missing"
        assert isinstance(data["additional_person_fee_usd"], (int, float)), "additional_person_fee_usd should be numeric"
        assert data["additional_person_fee_usd"] >= 0, "additional_person_fee_usd should be >= 0"
    
    def test_registration_info_returns_additional_person_fee_inr(self):
        """Verify additional_person_fee (INR) is returned"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        
        # additional_person_fee should be present
        assert "additional_person_fee" in data, "additional_person_fee field missing"
        assert isinstance(data["additional_person_fee"], (int, float)), "additional_person_fee should be numeric"
    
    def test_premium_hotels_have_usd_prices(self):
        """Verify premium hotel room types have price_usd field"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        
        premium_hotels = data.get("premium_hotels", [])
        assert len(premium_hotels) > 0, "No premium hotels found - test data may be missing"
        
        for hotel in premium_hotels:
            room_types = hotel.get("room_types", [])
            for room in room_types:
                assert "price_usd" in room, f"Room type {room.get('type')} missing price_usd"
                assert isinstance(room["price_usd"], (int, float)), "price_usd should be numeric"
                assert room["price_usd"] > 0, "price_usd should be > 0 for premium hotels"


class TestAdminEventsAPI:
    """Test admin events API and Event model"""
    
    def test_admin_events_returns_additional_person_fee_usd(self, admin_headers):
        """Verify admin events endpoint returns additional_person_fee_usd"""
        response = requests.get(f"{BASE_URL}/api/admin/events", headers=admin_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        events = response.json()
        
        # Find test event
        test_event = next((e for e in events if e["id"] == TEST_EVENT_ID), None)
        assert test_event, f"Test event {TEST_EVENT_ID} not found"
        
        assert "additional_person_fee_usd" in test_event, "additional_person_fee_usd missing from event"
        assert "venue_map_link" in test_event, "venue_map_link missing from event"
    
    def test_admin_events_returns_registration_enabled(self, admin_headers):
        """Verify events have registration_enabled field for UI conditional rendering"""
        response = requests.get(f"{BASE_URL}/api/admin/events", headers=admin_headers)
        assert response.status_code == 200
        events = response.json()
        
        test_event = next((e for e in events if e["id"] == TEST_EVENT_ID), None)
        assert test_event, "Test event not found"
        assert "registration_enabled" in test_event, "registration_enabled field missing"
        assert test_event["registration_enabled"] == True, "Test event should have registration_enabled=True"


class TestEventRegistrationsPage:
    """Test EventRegistrations admin page API"""
    
    def test_event_registrations_endpoint_accessible(self, admin_headers):
        """Verify /admin/events/{eventId}/registrations endpoint exists and returns data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=admin_headers
        )
        assert response.status_code == 200, f"EventRegistrations endpoint failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of registrations"
    
    def test_event_registrations_returns_correct_structure(self, admin_headers):
        """Verify registration records have expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=admin_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # If there are registrations, check structure
        if len(data) > 0:
            reg = data[0]
            expected_fields = ["id", "event_id", "name", "email", "phone", "registration_category", "payment_status"]
            for field in expected_fields:
                assert field in reg, f"Registration missing field: {field}"


class TestPublicEventAPI:
    """Test public event endpoints"""
    
    def test_public_event_returns_venue_map_link(self):
        """Verify public event endpoint returns venue_map_link"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "venue_map_link" in data, "venue_map_link missing from public event"
    
    def test_public_events_list(self):
        """Verify public events list works"""
        response = requests.get(f"{BASE_URL}/api/public/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Events should be a list"


class TestEventUpdateWithNewFields:
    """Test updating event with new fields"""
    
    def test_update_event_additional_person_fee_usd(self, admin_headers):
        """Verify event can be updated with additional_person_fee_usd"""
        # First get current event data
        response = requests.get(f"{BASE_URL}/api/admin/events", headers=admin_headers)
        events = response.json()
        test_event = next((e for e in events if e["id"] == TEST_EVENT_ID), None)
        
        if not test_event:
            pytest.skip("Test event not found")
        
        # Prepare update data (keep existing values, verify usd field can be set)
        update_data = {
            "title": test_event["title"],
            "date": test_event["date"],
            "venue": test_event["venue"],
            "venue_map_link": test_event.get("venue_map_link", ""),
            "status": test_event.get("status", "upcoming"),
            "registration_enabled": test_event.get("registration_enabled", True),
            "additional_person_fee": test_event.get("additional_person_fee", 1500),
            "additional_person_fee_usd": 50,  # Set USD fee
            "fee_tiers": test_event.get("fee_tiers", []),
            "accommodation": test_event.get("accommodation", {}),
            "premium_hotels": test_event.get("premium_hotels", []),
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}",
            json=update_data,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify the update persisted
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        assert data["additional_person_fee_usd"] == 50, "additional_person_fee_usd not persisted"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
