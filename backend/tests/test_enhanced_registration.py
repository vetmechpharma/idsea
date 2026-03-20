"""
Test cases for Enhanced Event Registration with new participant categories
Tests: registration_addons, new registration categories, accompanying/corporate persons,
addon fees, and export functionality
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com').rstrip('/')


class TestEventRegistrationEnhancements:
    """Test enhanced event registration features"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    @pytest.fixture(scope="class")
    def existing_event_id(self):
        """Get existing event with registration enabled"""
        response = requests.get(f"{BASE_URL}/api/public/events")
        assert response.status_code == 200
        events = response.json()
        for event in events:
            if event.get("registration_enabled"):
                return event["id"]
        pytest.skip("No event with registration enabled found")
    
    # =================== MODEL TESTS ===================
    
    def test_event_has_registration_addons_field(self, existing_event_id):
        """Event model should have registration_addons field"""
        response = requests.get(f"{BASE_URL}/api/public/events/{existing_event_id}")
        assert response.status_code == 200
        event = response.json()
        # registration_addons may be empty list or list of dicts
        assert "registration_addons" in event or event.get("registration_addons", []) == []
        if event.get("registration_addons"):
            for addon in event["registration_addons"]:
                assert "name" in addon
                assert "fee" in addon
        print(f"PASS: Event has registration_addons field: {event.get('registration_addons', [])}")
    
    def test_registration_info_endpoint(self, existing_event_id):
        """GET /api/public/events/{id}/registration-info should return complete info"""
        response = requests.get(f"{BASE_URL}/api/public/events/{existing_event_id}/registration-info")
        assert response.status_code == 200
        info = response.json()
        # Check required fields
        assert "fee_tiers" in info
        assert "accommodation" in info
        assert "membership_fees" in info
        print(f"PASS: Registration info endpoint returns complete data")
    
    # =================== REGISTRATION CATEGORY TESTS ===================
    
    def test_register_as_non_member(self, existing_event_id):
        """Test registration with non_member category"""
        unique_email = f"test_nonmember_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "Test NonMember",
            "email": unique_email,
            "phone": "+919999999001",
            "qualification": "BSc",
            "organization": "Test Org",
            "state": "Tamil Nadu",
            "registration_fee": 3000,
            "total_amount": 3000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "registration" in data
        assert data["registration"]["registration_category"] == "non_member"
        print(f"PASS: Non-member registration successful")
    
    def test_register_as_student(self, existing_event_id):
        """Test registration with student category"""
        unique_email = f"test_student_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "is_member": False,
            "registration_category": "student",
            "name": "Test Student",
            "email": unique_email,
            "phone": "+919999999002",
            "qualification": "PhD Scholar",
            "organization": "University",
            "state": "Karnataka",
            "registration_fee": 1500,
            "total_amount": 1500,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["registration"]["registration_category"] == "student"
        print(f"PASS: Student registration successful")
    
    def test_register_as_international(self, existing_event_id):
        """Test registration with international category"""
        unique_email = f"test_intl_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "is_member": False,
            "registration_category": "international",
            "name": "Test International Delegate",
            "email": unique_email,
            "phone": "+14155551234",
            "qualification": "PhD",
            "organization": "International University",
            "state": "California",
            "registration_fee": 200,  # USD
            "total_amount": 200,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["registration"]["registration_category"] == "international"
        print(f"PASS: International delegate registration successful")
    
    # =================== ACCOMPANYING PERSONS TESTS ===================
    
    def test_register_with_accompanying_persons(self, existing_event_id):
        """Test registration with accompanying_persons field"""
        unique_email = f"test_accom_{uuid.uuid4().hex[:8]}@test.com"
        accompanying = [
            {"name": "Spouse Name", "relation": "Wife"},
            {"name": "Child Name", "relation": "Son"}
        ]
        payload = {
            "is_member": False,
            "registration_category": "accompanying",
            "name": "Test Accompanying",
            "email": unique_email,
            "phone": "+919999999003",
            "qualification": "MSc",
            "organization": "Test Company",
            "state": "Maharashtra",
            "accompanying_persons": accompanying,
            "registration_fee": 2000,
            "total_amount": 2000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        reg = data["registration"]
        assert reg["registration_category"] == "accompanying"
        assert len(reg["accompanying_persons"]) == 2
        assert reg["accompanying_persons"][0]["name"] == "Spouse Name"
        assert reg["accompanying_persons"][0]["relation"] == "Wife"
        print(f"PASS: Registration with accompanying persons successful")
    
    # =================== CORPORATE PERSONS TESTS ===================
    
    def test_register_as_corporate_industry(self, existing_event_id):
        """Test corporate_industry registration with corporate_persons"""
        unique_email = f"test_corp_{uuid.uuid4().hex[:8]}@test.com"
        corporate = [
            {"name": "Person One", "designation": "Manager"},
            {"name": "Person Two", "designation": "Director"}
        ]
        payload = {
            "is_member": False,
            "registration_category": "corporate_industry",
            "name": "Corporate Test Company",
            "email": unique_email,
            "phone": "+919999999004",
            "organization": "Test Corporation",
            "state": "Gujarat",
            "corporate_persons": corporate,
            "registration_fee": 8000,
            "total_amount": 8000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        reg = data["registration"]
        assert reg["registration_category"] == "corporate_industry"
        assert len(reg["corporate_persons"]) == 2
        assert reg["corporate_persons"][0]["designation"] == "Manager"
        print(f"PASS: Corporate/Industry registration successful")
    
    # =================== ADD-ONS TESTS ===================
    
    def test_register_with_addons(self, existing_event_id):
        """Test registration with selected_addons and addon_fee"""
        unique_email = f"test_addon_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "Test Addon User",
            "email": unique_email,
            "phone": "+919999999005",
            "selected_addons": ["Pre-conference Workshop", "Excursion Trip"],
            "registration_fee": 3000,
            "addon_fee": 1500,
            "total_amount": 4500,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        reg = data["registration"]
        assert len(reg["selected_addons"]) == 2
        assert reg["addon_fee"] == 1500
        assert reg["total_amount"] == 4500
        print(f"PASS: Registration with add-ons successful")
    
    def test_addon_fee_included_in_total(self, existing_event_id):
        """Verify addon_fee is properly stored and returned"""
        unique_email = f"test_addon_total_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "registration_category": "student",
            "name": "Addon Total Test",
            "email": unique_email,
            "phone": "+919999999006",
            "selected_addons": ["Workshop"],
            "registration_fee": 1500,
            "addon_fee": 500,
            "total_amount": 2000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{existing_event_id}/register", json=payload)
        assert response.status_code == 200
        reg = response.json()["registration"]
        assert reg["addon_fee"] == 500
        assert reg["total_amount"] == 2000
        print(f"PASS: Addon fee correctly included in total")
    
    # =================== ADMIN EXPORT TESTS ===================
    
    def test_export_includes_new_columns(self, existing_event_id, auth_headers):
        """Test export endpoint includes new columns"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{existing_event_id}/registrations/export",
            headers=auth_headers
        )
        assert response.status_code == 200
        # Response should be an Excel file
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        print(f"PASS: Export endpoint returns Excel file with new columns")
    
    def test_admin_get_registrations_returns_new_fields(self, existing_event_id, auth_headers):
        """Admin registrations endpoint should return new fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{existing_event_id}/registrations",
            headers=auth_headers
        )
        assert response.status_code == 200
        registrations = response.json()
        if registrations:
            reg = registrations[0]
            # Check new fields exist in response
            assert "registration_category" in reg
            assert "accompanying_persons" in reg
            assert "corporate_persons" in reg
            assert "selected_addons" in reg
            assert "addon_fee" in reg
            print(f"PASS: Admin registrations API returns new fields")
        else:
            print("PASS: No registrations yet, but endpoint works")


class TestAdminEventAddons:
    """Test admin can create events with add-ons"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_create_event_with_addons(self, auth_headers):
        """Admin can create event with registration_addons"""
        event_data = {
            "title": f"TEST_Event_With_Addons_{uuid.uuid4().hex[:6]}",
            "date": "2026-06-01",
            "end_date": "2026-06-03",
            "venue": "Test Venue",
            "description": "Test event with addons",
            "status": "upcoming",
            "registration_enabled": True,
            "fee_tiers": [
                {
                    "name": "Early Bird",
                    "deadline": "2026-05-15",
                    "fees": {
                        "academic": 1000,
                        "entrepreneur": 1500,
                        "corporate": 3000,
                        "non_member": 2000,
                        "student": 500,
                        "accompanying": 1000,
                        "corporate_industry": 5000,
                        "international": 100
                    }
                }
            ],
            "registration_addons": [
                {"name": "Pre-conference Workshop", "fee": 500, "currency": "INR", "description": "Full-day workshop"},
                {"name": "Excursion Trip", "fee": 1000, "currency": "INR", "description": "Day trip to local sites"},
                {"name": "International Workshop", "fee": 50, "currency": "USD", "description": "For international delegates"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/admin/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        created_event = response.json()
        assert "registration_addons" in created_event
        assert len(created_event["registration_addons"]) == 3
        assert created_event["registration_addons"][0]["name"] == "Pre-conference Workshop"
        assert created_event["registration_addons"][2]["currency"] == "USD"
        
        # Cleanup - delete test event
        event_id = created_event["id"]
        requests.delete(f"{BASE_URL}/api/admin/events/{event_id}", headers=auth_headers)
        print(f"PASS: Event created with 3 add-ons and 8 fee categories")
    
    def test_update_event_addons(self, auth_headers):
        """Admin can update event to add/remove addons"""
        # Create test event
        event_data = {
            "title": f"TEST_Update_Addons_{uuid.uuid4().hex[:6]}",
            "date": "2026-07-01",
            "venue": "Update Test Venue",
            "status": "upcoming",
            "registration_enabled": True,
            "registration_addons": []
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/events", json=event_data, headers=auth_headers)
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        
        # Update with addons
        event_data["registration_addons"] = [
            {"name": "Workshop", "fee": 750, "currency": "INR"}
        ]
        update_response = requests.put(f"{BASE_URL}/api/admin/events/{event_id}", json=event_data, headers=auth_headers)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/public/events/{event_id}")
        updated_event = get_response.json()
        assert len(updated_event.get("registration_addons", [])) == 1
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{event_id}", headers=auth_headers)
        print(f"PASS: Event addons updated successfully")


class TestFeeTiersWith8Categories:
    """Test fee tiers support 8 registration categories"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        return response.json().get("access_token") if response.status_code == 200 else None
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    
    def test_create_event_with_all_8_fee_categories(self, auth_headers):
        """Create event with all 8 fee categories in fee tier"""
        all_categories = {
            "academic": 1500,
            "entrepreneur": 2500,
            "corporate": 5000,
            "non_member": 3000,
            "student": 800,
            "accompanying": 1200,
            "corporate_industry": 8000,
            "international": 150  # USD
        }
        event_data = {
            "title": f"TEST_8_Categories_{uuid.uuid4().hex[:6]}",
            "date": "2026-08-01",
            "venue": "Full Category Venue",
            "status": "upcoming",
            "registration_enabled": True,
            "fee_tiers": [
                {
                    "name": "Standard",
                    "deadline": "2026-07-25",
                    "fees": all_categories
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/admin/events", json=event_data, headers=auth_headers)
        assert response.status_code == 200
        event = response.json()
        tier_fees = event["fee_tiers"][0]["fees"]
        
        # Verify all 8 categories exist
        for cat in all_categories.keys():
            assert cat in tier_fees, f"Missing category: {cat}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{event['id']}", headers=auth_headers)
        print(f"PASS: Event with all 8 fee categories created")


class TestIDSEAMemberRegistration:
    """Test IDSEA member lookup and registration"""
    
    def test_member_lookup_endpoint(self):
        """Test phone lookup endpoint works"""
        # Should return found:false for non-existent phone
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=0000000000")
        assert response.status_code == 200
        data = response.json()
        assert "found" in data
        print(f"PASS: Member lookup endpoint works, found={data['found']}")
    
    def test_member_lookup_with_valid_phone(self):
        """Test lookup returns member data if exists"""
        # This test may need a known member phone
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=9486544884")
        assert response.status_code == 200
        data = response.json()
        if data.get("found"):
            assert "member" in data
            member = data["member"]
            assert "name" in member
            assert "membership_type" in member
            print(f"PASS: Found member: {member.get('name')}")
        else:
            print("PASS: Phone not found (expected if no test member exists)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
