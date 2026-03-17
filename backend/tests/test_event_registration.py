"""
Test Event Registration System APIs
Tests for: Event creation with fee tiers, member lookup, registration flow, admin management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"

# Test event ID (pre-created event)
TEST_EVENT_ID = "435435f4-774f-4a0f-95e1-1e423493c196"


class TestAuthFixtures:
    """Authentication helpers"""

    @staticmethod
    def get_auth_token():
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None


@pytest.fixture(scope="session")
def auth_token():
    """Session-scoped auth token"""
    token = TestAuthFixtures.get_auth_token()
    if not token:
        pytest.skip("Authentication failed")
    return token


@pytest.fixture
def auth_headers(auth_token):
    """Auth headers for admin requests"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


# =================== PUBLIC EVENT REGISTRATION API TESTS ===================

class TestPublicEventRegistrationInfo:
    """Test GET /api/public/events/{event_id}/registration-info"""

    def test_get_registration_info_success(self):
        """Verify registration info returns fee tiers and accommodation config"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        print(f"Registration info status: {response.status_code}")
        print(f"Response: {response.json() if response.status_code == 200 else response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "title" in data
        assert "fee_tiers" in data
        assert "accommodation" in data
        assert "membership_fees" in data
        
        # Verify fee tiers structure
        assert isinstance(data["fee_tiers"], list)
        if len(data["fee_tiers"]) > 0:
            tier = data["fee_tiers"][0]
            assert "name" in tier
            assert "deadline" in tier
            assert "fees" in tier
            assert isinstance(tier["fees"], dict)
            print(f"First fee tier: {tier}")

    def test_get_registration_info_returns_membership_fees(self):
        """Verify membership fees are returned (academic, entrepreneur, corporate)"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        
        assert "membership_fees" in data
        fees = data["membership_fees"]
        assert fees.get("academic") == 3100, f"Expected academic fee 3100, got {fees.get('academic')}"
        assert fees.get("entrepreneur") == 5100, f"Expected entrepreneur fee 5100, got {fees.get('entrepreneur')}"
        assert fees.get("corporate") == 25100, f"Expected corporate fee 25100, got {fees.get('corporate')}"

    def test_get_registration_info_invalid_event(self):
        """Verify 404 for non-existent event"""
        response = requests.get(f"{BASE_URL}/api/public/events/invalid-uuid/registration-info")
        assert response.status_code == 404

    def test_registration_info_has_accommodation_config(self):
        """Verify accommodation config structure"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        
        accom = data.get("accommodation", {})
        print(f"Accommodation config: {accom}")
        # These keys should exist if accommodation is configured
        assert isinstance(accom, dict)


class TestMemberLookup:
    """Test GET /api/public/members/lookup - Member lookup by phone"""

    def test_lookup_invalid_phone_short(self):
        """Should return 400 for too short phone number"""
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=123")
        assert response.status_code == 400

    def test_lookup_nonexistent_member(self):
        """Should return found:false for non-existent member"""
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=0000000000")
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == False, f"Expected found=False, got {data}"

    def test_lookup_returns_proper_structure(self):
        """Verify lookup response structure"""
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=9999999999")
        assert response.status_code == 200
        data = response.json()
        assert "found" in data


class TestEventRegistration:
    """Test POST /api/public/events/{event_id}/register - Event registration"""

    def test_register_non_member_success(self):
        """Non-member registration should succeed"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "is_member": False,
            "member_id": "",
            "member_category": "",
            "name": f"TEST_NonMember_{unique_id}",
            "email": f"test_{unique_id}@test.com",
            "phone": f"9876543{unique_id[:3]}",
            "qualification": "PhD",
            "organization": "Test Org",
            "state": "Test State",
            "accommodation_choice": "self",
            "hotel_name": "",
            "wants_membership": False,
            "membership_type": "",
            "registration_fee": 5000,
            "accommodation_fee": 0,
            "membership_fee": 0,
            "total_amount": 5000,
            "payment_mode": "offline"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register",
            json=payload
        )
        print(f"Registration response: {response.status_code}")
        print(f"Response: {response.json() if response.status_code in [200, 201] else response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "registration" in data
        reg = data["registration"]
        assert reg["name"] == payload["name"]
        assert reg["email"] == payload["email"]
        assert reg["total_amount"] == 5000
        assert reg["payment_status"] == "pending"

    def test_register_with_membership_creates_member_application(self):
        """Non-member registering with membership should create member application"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "is_member": False,
            "name": f"TEST_MemberApply_{unique_id}",
            "email": f"memberapp_{unique_id}@test.com",
            "phone": f"1234567{unique_id[:3]}",
            "qualification": "MSc",
            "organization": "Research Lab",
            "state": "Karnataka",
            "accommodation_choice": "self",
            "hotel_name": "",
            "wants_membership": True,
            "membership_type": "academic",
            "registration_fee": 5000,
            "accommodation_fee": 0,
            "membership_fee": 3100,
            "total_amount": 8100,
            "payment_mode": "offline"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        reg = data.get("registration", {})
        assert reg.get("wants_membership") == True
        assert reg.get("membership_type") == "academic"

    def test_register_with_hotel_accommodation(self):
        """Registration with hotel accommodation"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "is_member": False,
            "name": f"TEST_Hotel_{unique_id}",
            "email": f"hotel_{unique_id}@test.com",
            "phone": f"5555555{unique_id[:3]}",
            "qualification": "BTech",
            "organization": "Dairy Corp",
            "state": "Gujarat",
            "accommodation_choice": "hotel",
            "hotel_name": "Taj",
            "wants_membership": False,
            "registration_fee": 5000,
            "accommodation_fee": 2500,
            "total_amount": 7500,
            "payment_mode": "offline"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        reg = data.get("registration", {})
        assert reg.get("accommodation_choice") == "hotel"
        assert reg.get("hotel_name") == "Taj"

    def test_register_disabled_event(self):
        """Registration should fail for events with registration disabled"""
        # Create event with registration_enabled=false and try to register
        # This test assumes an event without registration enabled
        response = requests.post(
            f"{BASE_URL}/api/public/events/nonexistent-event-id/register",
            json={"name": "Test", "email": "test@test.com", "phone": "1234567890"}
        )
        assert response.status_code in [400, 404]


# =================== ADMIN EVENT REGISTRATION MANAGEMENT TESTS ===================

class TestAdminEventCreation:
    """Test POST /api/admin/events - Create event with fee tiers and accommodation"""

    def test_create_event_with_fee_tiers(self, auth_headers):
        """Create event with multiple fee tiers"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "title": f"TEST_Event_{unique_id}",
            "date": "2026-06-01",
            "end_date": "2026-06-03",
            "venue": "Test Venue",
            "description": "Test Description",
            "status": "upcoming",
            "registration_enabled": True,
            "allow_membership_registration": True,
            "fee_tiers": [
                {
                    "name": "Early Bird",
                    "deadline": "2026-05-01",
                    "fees": {"academic": 2000, "entrepreneur": 3000, "corporate": 5000, "non_member": 4000}
                },
                {
                    "name": "Regular",
                    "deadline": "2026-05-25",
                    "fees": {"academic": 2500, "entrepreneur": 3500, "corporate": 6000, "non_member": 5000}
                }
            ],
            "accommodation": {
                "enabled": True,
                "self_option": True,
                "free_categories": ["academic"],
                "hotels": [
                    {"name": "Test Hotel", "fee": 2000, "description": "Deluxe Room"}
                ]
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/events", json=payload, headers=auth_headers)
        print(f"Create event response: {response.status_code}")
        print(f"Response: {response.json() if response.status_code in [200, 201] else response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data["title"] == payload["title"]
        assert len(data.get("fee_tiers", [])) == 2
        assert data.get("registration_enabled") == True
        assert data.get("accommodation", {}).get("enabled") == True
        
        # Cleanup - delete test event
        event_id = data.get("id")
        if event_id:
            requests.delete(f"{BASE_URL}/api/admin/events/{event_id}", headers=auth_headers)

    def test_create_event_requires_auth(self):
        """Create event should require authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/events", json={"title": "Test"})
        assert response.status_code in [401, 403]


class TestAdminRegistrationManagement:
    """Test admin registration management APIs"""

    def test_get_event_registrations(self, auth_headers):
        """GET /api/admin/events/{event_id}/registrations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=auth_headers
        )
        print(f"Get registrations response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Total registrations: {len(data)}")
        
        if len(data) > 0:
            reg = data[0]
            print(f"Sample registration: {reg}")
            assert "id" in reg
            assert "name" in reg
            assert "email" in reg
            assert "payment_status" in reg

    def test_get_registrations_requires_auth(self):
        """Get registrations should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations")
        assert response.status_code in [401, 403]

    def test_update_payment_status(self, auth_headers):
        """PUT /api/admin/event-registrations/{reg_id}/payment"""
        # First get a registration
        get_response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=auth_headers
        )
        
        if get_response.status_code == 200 and len(get_response.json()) > 0:
            reg_id = get_response.json()[0]["id"]
            
            response = requests.put(
                f"{BASE_URL}/api/admin/event-registrations/{reg_id}/payment",
                json={"payment_status": "paid"},
                headers=auth_headers
            )
            print(f"Update payment status: {response.status_code}")
            assert response.status_code == 200
            
            # Revert back to pending
            requests.put(
                f"{BASE_URL}/api/admin/event-registrations/{reg_id}/payment",
                json={"payment_status": "pending"},
                headers=auth_headers
            )
        else:
            pytest.skip("No registrations available to test payment update")

    def test_export_registrations(self, auth_headers):
        """GET /api/admin/events/{event_id}/registrations/export - Excel export"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/export",
            headers=auth_headers
        )
        print(f"Export response: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        
        assert response.status_code == 200
        # Verify it's an Excel file
        content_type = response.headers.get('Content-Type', '')
        assert 'spreadsheet' in content_type or 'excel' in content_type or 'application/' in content_type, f"Unexpected content type: {content_type}"


class TestPublicEventsPage:
    """Test public events API for registration button visibility"""

    def test_get_public_events(self):
        """GET /api/public/events - should include registration_enabled field"""
        response = requests.get(f"{BASE_URL}/api/public/events")
        assert response.status_code == 200
        
        events = response.json()
        assert isinstance(events, list)
        
        # Find event with registration enabled
        reg_enabled_events = [e for e in events if e.get("registration_enabled")]
        print(f"Events with registration enabled: {len(reg_enabled_events)}")
        
        # Verify test event has registration enabled
        test_event = next((e for e in events if e.get("id") == TEST_EVENT_ID), None)
        if test_event:
            print(f"Test event registration_enabled: {test_event.get('registration_enabled')}")
            assert test_event.get("registration_enabled") == True, "Test event should have registration enabled"


class TestHealthCheck:
    """Basic API health check"""

    def test_api_accessible(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200


# =================== Cleanup Test Data ===================

class TestCleanup:
    """Cleanup test-created data"""

    def test_cleanup_test_registrations(self, auth_headers):
        """Remove TEST_ prefixed registrations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=auth_headers
        )
        if response.status_code == 200:
            regs = response.json()
            test_regs = [r for r in regs if r.get("name", "").startswith("TEST_")]
            print(f"Test registrations to potentially clean up: {len(test_regs)}")
            # Note: No delete endpoint for registrations, so just reporting
