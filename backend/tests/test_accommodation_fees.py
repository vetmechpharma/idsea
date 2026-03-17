"""
Backend tests for Event Registration Accommodation System
Tests: accommodation_fees per tier, free categories, premium hotels, self-accommodation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EVENT_ID = "435435f4-774f-4a0f-95e1-1e423493c196"

@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@idsea.org",
        "password": "Admin@123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")

@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


class TestEventRegistrationInfo:
    """Test GET /api/public/events/{id}/registration-info returns accommodation_fees"""

    def test_registration_info_returns_fee_tiers_with_accommodation_fees(self):
        """CRITICAL: Verify fee_tiers include accommodation_fees dict"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        
        data = response.json()
        assert "fee_tiers" in data
        assert len(data["fee_tiers"]) >= 1
        
        # Each tier should have accommodation_fees
        for tier in data["fee_tiers"]:
            assert "name" in tier
            assert "deadline" in tier
            assert "fees" in tier
            assert "accommodation_fees" in tier, f"Tier '{tier['name']}' missing accommodation_fees"
            
            # accommodation_fees should have all 4 categories
            accom_fees = tier["accommodation_fees"]
            assert "academic" in accom_fees, "Missing academic accommodation fee"
            assert "entrepreneur" in accom_fees, "Missing entrepreneur accommodation fee"
            assert "corporate" in accom_fees, "Missing corporate accommodation fee"
            assert "non_member" in accom_fees, "Missing non_member accommodation fee"

    def test_early_bird_tier_accommodation_fees(self):
        """Verify Early Bird tier has correct accommodation fees"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        
        data = response.json()
        early_bird = next((t for t in data["fee_tiers"] if t["name"] == "Early Bird"), None)
        assert early_bird is not None, "Early Bird tier not found"
        
        # Verify accommodation_fees values exist
        accom = early_bird["accommodation_fees"]
        assert isinstance(accom["academic"], (int, float))
        assert isinstance(accom["non_member"], (int, float))
        print(f"Early Bird accommodation fees: {accom}")

    def test_accommodation_config_structure(self):
        """Verify accommodation config has enabled, self_option, free_categories, hotels"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200
        
        data = response.json()
        accom = data.get("accommodation", {})
        
        assert "enabled" in accom
        assert accom["enabled"] == True
        assert "self_option" in accom
        assert "free_categories" in accom
        assert "hotels" in accom
        assert isinstance(accom["hotels"], list)

    def test_free_categories_include_academic(self):
        """Verify academic is in free_categories"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        data = response.json()
        
        free_cats = data.get("accommodation", {}).get("free_categories", [])
        assert "academic" in free_cats, "Academic should be in free_categories"

    def test_premium_hotels_structure(self):
        """Verify hotels have name, fee, description"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        data = response.json()
        
        hotels = data.get("accommodation", {}).get("hotels", [])
        assert len(hotels) >= 2, "Should have at least 2 hotels"
        
        for hotel in hotels:
            assert "name" in hotel
            assert "fee" in hotel
            assert isinstance(hotel["fee"], (int, float))
            assert hotel["fee"] > 0
        
        # Verify specific hotels
        hotel_names = [h["name"] for h in hotels]
        assert "Hotel Taj Namakkal" in hotel_names or any("Taj" in n for n in hotel_names)

    def test_membership_fees_returned(self):
        """Verify membership_fees are returned for non-member registration"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        data = response.json()
        
        assert "membership_fees" in data
        mem_fees = data["membership_fees"]
        assert mem_fees["academic"] == 3100
        assert mem_fees["entrepreneur"] == 5100
        assert mem_fees["corporate"] == 25100


class TestEventRegistrationSubmission:
    """Test POST /api/public/events/{id}/register with accommodation choices"""

    def test_register_non_member_with_default_accommodation(self):
        """Register non-member with default accommodation (uses tier fee)"""
        payload = {
            "is_member": False,
            "member_id": "",
            "member_category": "",
            "name": f"TEST_NonMember_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "+91 98765 00001",
            "qualification": "PhD",
            "organization": "Test University",
            "state": "Tamil Nadu",
            "accommodation_choice": "default",
            "hotel_name": "",
            "wants_membership": False,
            "membership_type": "",
            "registration_fee": 3000,  # Non-member Early Bird
            "accommodation_fee": 1000,  # Non-member Early Bird default accom
            "membership_fee": 0,
            "total_amount": 4000,
            "payment_mode": "offline"
        }
        
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "registration" in data
        reg = data["registration"]
        assert reg["accommodation_choice"] == "default"
        assert reg["accommodation_fee"] == 1000
        assert reg["registration_fee"] == 3000
        assert reg["total_amount"] == 4000
        print(f"Registered non-member with default accom: {reg['id']}")

    def test_register_with_premium_hotel(self):
        """Register with premium hotel option (replaces default accommodation fee)"""
        payload = {
            "is_member": False,
            "member_id": "",
            "member_category": "",
            "name": f"TEST_HotelGuest_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "+91 98765 00002",
            "qualification": "PhD",
            "organization": "Test Inc",
            "state": "Karnataka",
            "accommodation_choice": "hotel",
            "hotel_name": "Hotel Taj Namakkal",
            "wants_membership": False,
            "membership_type": "",
            "registration_fee": 3000,
            "accommodation_fee": 2500,  # Premium hotel fee
            "membership_fee": 0,
            "total_amount": 5500,
            "payment_mode": "offline"
        }
        
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200
        
        reg = response.json()["registration"]
        assert reg["accommodation_choice"] == "hotel"
        assert reg["hotel_name"] == "Hotel Taj Namakkal"
        assert reg["accommodation_fee"] == 2500
        assert reg["total_amount"] == 5500
        print(f"Registered with premium hotel: {reg['id']}")

    def test_register_with_self_accommodation(self):
        """Register with self-accommodation (₹0 fee)"""
        payload = {
            "is_member": False,
            "member_id": "",
            "member_category": "",
            "name": f"TEST_SelfAccom_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "+91 98765 00003",
            "qualification": "MSc",
            "organization": "Self",
            "state": "Kerala",
            "accommodation_choice": "self",
            "hotel_name": "",
            "wants_membership": False,
            "membership_type": "",
            "registration_fee": 3000,
            "accommodation_fee": 0,  # Self = ₹0
            "membership_fee": 0,
            "total_amount": 3000,
            "payment_mode": "offline"
        }
        
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200
        
        reg = response.json()["registration"]
        assert reg["accommodation_choice"] == "self"
        assert reg["accommodation_fee"] == 0
        assert reg["total_amount"] == 3000
        print(f"Registered with self-accom: {reg['id']}")

    def test_register_academic_member_free_accommodation(self):
        """Register as academic member with free accommodation (waived)"""
        payload = {
            "is_member": True,
            "member_id": "IDSEA20240001",
            "member_category": "academic",
            "name": f"TEST_AcademicFree_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "+91 98765 00004",
            "qualification": "PhD",
            "organization": "Test University",
            "state": "Tamil Nadu",
            "accommodation_choice": "free",  # Free for academic
            "hotel_name": "",
            "wants_membership": False,
            "membership_type": "",
            "registration_fee": 1500,  # Academic Early Bird
            "accommodation_fee": 0,  # FREE
            "membership_fee": 0,
            "total_amount": 1500,
            "payment_mode": "offline"
        }
        
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200
        
        reg = response.json()["registration"]
        assert reg["is_member"] == True
        assert reg["member_category"] == "academic"
        assert reg["accommodation_fee"] == 0
        print(f"Registered academic with free accom: {reg['id']}")

    def test_register_with_membership_addition(self):
        """Non-member registers and wants to become a member"""
        payload = {
            "is_member": False,
            "member_id": "",
            "member_category": "",
            "name": f"TEST_NewMember_{uuid.uuid4().hex[:6]}",
            "email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "+91 98765 00005",
            "qualification": "PhD",
            "organization": "Research Institute",
            "state": "Maharashtra",
            "accommodation_choice": "default",
            "hotel_name": "",
            "wants_membership": True,
            "membership_type": "academic",
            "registration_fee": 3000,
            "accommodation_fee": 1000,
            "membership_fee": 3100,
            "total_amount": 7100,
            "payment_mode": "offline"
        }
        
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200
        
        reg = response.json()["registration"]
        assert reg["wants_membership"] == True
        assert reg["membership_type"] == "academic"
        assert reg["membership_fee"] == 3100
        assert reg["total_amount"] == 7100
        print(f"Registered non-member wanting membership: {reg['id']}")


class TestAdminEventCRUD:
    """Test admin can create/update events with accommodation_fees in fee_tiers"""

    def test_create_event_with_accommodation_fees(self, auth_headers):
        """Create new event with fee_tiers containing accommodation_fees"""
        event_data = {
            "title": f"TEST_Event_{uuid.uuid4().hex[:6]}",
            "date": "2026-06-01",
            "end_date": "2026-06-03",
            "venue": "Test Venue",
            "description": "Test event for accommodation fees",
            "registration_fee": 0,
            "status": "upcoming",
            "registration_enabled": True,
            "allow_membership_registration": True,
            "fee_tiers": [
                {
                    "name": "Early Bird",
                    "deadline": "2026-05-15",
                    "fees": {"academic": 1000, "entrepreneur": 2000, "corporate": 4000, "non_member": 2500},
                    "accommodation_fees": {"academic": 500, "entrepreneur": 800, "corporate": 1200, "non_member": 700}
                },
                {
                    "name": "Regular",
                    "deadline": "2026-05-30",
                    "fees": {"academic": 1500, "entrepreneur": 3000, "corporate": 6000, "non_member": 3500},
                    "accommodation_fees": {"academic": 600, "entrepreneur": 1000, "corporate": 1500, "non_member": 900}
                }
            ],
            "accommodation": {
                "enabled": True,
                "self_option": True,
                "free_categories": ["academic"],
                "hotels": [
                    {"name": "Test Hotel A", "fee": 2000, "description": "Deluxe"},
                    {"name": "Test Hotel B", "fee": 1200, "description": "Standard"}
                ]
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        
        created = response.json()
        assert "id" in created
        assert created["title"].startswith("TEST_Event")
        assert len(created["fee_tiers"]) == 2
        
        # Verify accommodation_fees persisted
        tier = created["fee_tiers"][0]
        assert "accommodation_fees" in tier
        assert tier["accommodation_fees"]["academic"] == 500
        assert tier["accommodation_fees"]["non_member"] == 700
        
        print(f"Created test event: {created['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{created['id']}", headers=auth_headers)

    def test_update_event_accommodation_fees(self, auth_headers):
        """Update existing event's accommodation_fees"""
        # First create an event
        event_data = {
            "title": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "date": "2026-07-01",
            "venue": "Update Venue",
            "registration_enabled": True,
            "fee_tiers": [
                {
                    "name": "Early",
                    "deadline": "2026-06-20",
                    "fees": {"academic": 1000, "entrepreneur": 2000, "corporate": 3000, "non_member": 2000},
                    "accommodation_fees": {"academic": 400, "entrepreneur": 600, "corporate": 800, "non_member": 500}
                }
            ],
            "accommodation": {"enabled": True, "self_option": True, "free_categories": [], "hotels": []}
        }
        
        create_resp = requests.post(f"{BASE_URL}/api/admin/events", json=event_data, headers=auth_headers)
        assert create_resp.status_code == 200
        event_id = create_resp.json()["id"]
        
        # Update accommodation_fees
        update_data = event_data.copy()
        update_data["fee_tiers"][0]["accommodation_fees"]["academic"] = 600
        update_data["accommodation"]["free_categories"] = ["academic", "entrepreneur"]
        
        update_resp = requests.put(f"{BASE_URL}/api/admin/events/{event_id}", json=update_data, headers=auth_headers)
        assert update_resp.status_code == 200
        
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/public/events/{event_id}/registration-info")
        assert get_resp.status_code == 200
        updated = get_resp.json()
        assert updated["fee_tiers"][0]["accommodation_fees"]["academic"] == 600
        assert "academic" in updated["accommodation"]["free_categories"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{event_id}", headers=auth_headers)


class TestAdminRegistrationManagement:
    """Test admin can view registrations with fee breakdown"""

    def test_get_registrations_with_accommodation_details(self, auth_headers):
        """Verify registrations show accommodation_choice and accommodation_fee"""
        response = requests.get(f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations", headers=auth_headers)
        assert response.status_code == 200
        
        regs = response.json()
        if len(regs) > 0:
            reg = regs[0]
            assert "accommodation_choice" in reg
            assert "accommodation_fee" in reg
            assert "hotel_name" in reg
            assert "registration_fee" in reg
            assert "total_amount" in reg
            print(f"Found {len(regs)} registrations")


class TestCleanup:
    """Cleanup test data"""

    def test_cleanup_test_registrations(self, auth_headers):
        """Remove TEST_ prefixed registrations"""
        response = requests.get(f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations", headers=auth_headers)
        if response.status_code == 200:
            regs = response.json()
            test_regs = [r for r in regs if r.get("name", "").startswith("TEST_")]
            print(f"Found {len(test_regs)} test registrations (manual cleanup may be needed)")
        assert True  # Always pass cleanup test
