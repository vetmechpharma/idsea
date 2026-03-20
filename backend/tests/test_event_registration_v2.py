"""
Test Suite for Event Registration System V2 (4-Category System)
Tests: Membership Plans CRUD, Event Registration with premium hotels, add-ons, 
       additional persons, and "Become a Member" flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com')
TEST_EVENT_ID = "a6d69db6-d6f8-4fb6-a707-14dc903f8bfc"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "Missing access_token"
        assert "admin" in data, "Missing admin data"
        assert data["admin"]["email"] == "admin@idsea.org"
        print("PASS: Admin login successful")
        return data["access_token"]


class TestMembershipPlansAPI:
    """Membership Plans CRUD API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        # Get admin token
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_membership_plans_admin(self):
        """GET /api/admin/membership-plans - Get all plans (admin)"""
        response = requests.get(f"{BASE_URL}/api/admin/membership-plans", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        plans = response.json()
        assert isinstance(plans, list), "Response should be a list"
        print(f"PASS: GET admin membership plans - Found {len(plans)} plans")
        return plans
    
    def test_get_public_membership_plans(self):
        """GET /api/public/membership-plans - Get enabled plans (public)"""
        response = requests.get(f"{BASE_URL}/api/public/membership-plans")
        assert response.status_code == 200, f"Failed: {response.text}"
        plans = response.json()
        assert isinstance(plans, list), "Response should be a list"
        # All returned plans should be enabled
        for plan in plans:
            assert plan.get("enabled", True) != False, f"Plan {plan.get('key')} should be enabled"
        print(f"PASS: GET public membership plans - Found {len(plans)} enabled plans")
    
    def test_create_membership_plan(self):
        """POST /api/admin/membership-plans - Create a new plan"""
        test_plan = {
            "key": "test_plan_pytest",
            "label": "PyTest Test Plan",
            "fee_inr": 9999,
            "fee_usd": 199,
            "enabled": True,
            "description": "Test plan created by pytest"
        }
        response = requests.post(f"{BASE_URL}/api/admin/membership-plans", 
                                 json=test_plan, headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data, "Created plan should have an ID"
        print(f"PASS: Created membership plan with ID: {data['id']}")
        return data["id"]
    
    def test_update_membership_plan(self):
        """PUT /api/admin/membership-plans/{id} - Update plan"""
        # First get existing plans
        plans_resp = requests.get(f"{BASE_URL}/api/admin/membership-plans", headers=self.headers)
        plans = plans_resp.json()
        test_plan = next((p for p in plans if p.get("key") == "test_plan_pytest"), None)
        
        if not test_plan:
            # Create one first
            create_resp = requests.post(f"{BASE_URL}/api/admin/membership-plans", json={
                "key": "test_plan_pytest",
                "label": "PyTest Test Plan",
                "fee_inr": 9999,
                "fee_usd": 199,
                "enabled": True
            }, headers=self.headers)
            test_plan = create_resp.json()
        
        # Update the plan
        update_data = {"fee_inr": 8888, "description": "Updated by pytest"}
        response = requests.put(f"{BASE_URL}/api/admin/membership-plans/{test_plan['id']}", 
                               json=update_data, headers=self.headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        print(f"PASS: Updated membership plan {test_plan['id']}")
    
    def test_toggle_membership_plan(self):
        """PUT /api/admin/membership-plans/{id} - Toggle enabled status"""
        plans_resp = requests.get(f"{BASE_URL}/api/admin/membership-plans", headers=self.headers)
        plans = plans_resp.json()
        test_plan = next((p for p in plans if p.get("key") == "test_plan_pytest"), None)
        
        if test_plan:
            current_enabled = test_plan.get("enabled", True)
            response = requests.put(f"{BASE_URL}/api/admin/membership-plans/{test_plan['id']}", 
                                   json={"enabled": not current_enabled}, headers=self.headers)
            assert response.status_code == 200, f"Toggle failed: {response.text}"
            
            # Toggle back
            requests.put(f"{BASE_URL}/api/admin/membership-plans/{test_plan['id']}", 
                        json={"enabled": current_enabled}, headers=self.headers)
            print(f"PASS: Toggled membership plan enabled status")
    
    def test_delete_membership_plan(self):
        """DELETE /api/admin/membership-plans/{id} - Delete plan"""
        plans_resp = requests.get(f"{BASE_URL}/api/admin/membership-plans", headers=self.headers)
        plans = plans_resp.json()
        test_plan = next((p for p in plans if p.get("key") == "test_plan_pytest"), None)
        
        if test_plan:
            response = requests.delete(f"{BASE_URL}/api/admin/membership-plans/{test_plan['id']}", 
                                       headers=self.headers)
            assert response.status_code == 200, f"Delete failed: {response.text}"
            print(f"PASS: Deleted membership plan {test_plan['id']}")
        else:
            print("INFO: No test plan to delete")


class TestEventRegistrationInfo:
    """Event registration info API tests"""
    
    def test_get_registration_info(self):
        """GET /api/public/events/{id}/registration-info - Returns all registration data"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "id" in data, "Missing event ID"
        assert "title" in data, "Missing title"
        assert "fee_tiers" in data, "Missing fee_tiers"
        assert "accommodation" in data, "Missing accommodation"
        assert "membership_plans" in data, "Missing membership_plans"
        assert "additional_person_fee" in data, "Missing additional_person_fee"
        assert "registration_addons" in data, "Missing registration_addons"
        assert "premium_hotels" in data, "Missing premium_hotels"
        
        # Verify fee_tiers structure with 4 categories
        if data["fee_tiers"]:
            tier = data["fee_tiers"][0]
            assert "fees" in tier, "Fee tier missing fees"
            fees = tier["fees"]
            assert "member" in fees, "Missing member fee"
            assert "non_member" in fees, "Missing non_member fee"
            assert "student" in fees, "Missing student fee"
            assert "international" in fees, "Missing international fee"
        
        # Verify premium hotels structure
        if data["premium_hotels"]:
            hotel = data["premium_hotels"][0]
            assert "name" in hotel, "Hotel missing name"
            assert "tax_percent" in hotel, "Hotel missing tax_percent"
            assert "room_types" in hotel, "Hotel missing room_types"
        
        print("PASS: Registration info contains all required fields")
        print(f"  - Fee tiers: {len(data['fee_tiers'])}")
        print(f"  - Membership plans: {len(data['membership_plans'])}")
        print(f"  - Premium hotels: {len(data['premium_hotels'])}")
        print(f"  - Add-ons: {len(data['registration_addons'])}")
        print(f"  - Additional person fee: {data['additional_person_fee']}")
    
    def test_current_tier_is_early_bird(self):
        """Verify current tier is Early Bird (before 2026-05-01)"""
        response = requests.get(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/registration-info")
        data = response.json()
        
        if data["fee_tiers"]:
            # Sort by deadline and find current tier
            from datetime import datetime
            today = datetime.now().strftime("%Y-%m-%d")
            sorted_tiers = sorted(data["fee_tiers"], key=lambda t: t.get("deadline", ""))
            
            current_tier = None
            for tier in sorted_tiers:
                if tier.get("deadline") and today <= tier["deadline"]:
                    current_tier = tier
                    break
            
            if not current_tier:
                current_tier = sorted_tiers[-1] if sorted_tiers else None
            
            if current_tier:
                print(f"INFO: Current tier is '{current_tier['name']}' (deadline: {current_tier.get('deadline')})")
                # Since we're testing in Jan 2026, Early Bird should be current
                assert current_tier["name"] == "Early Bird", f"Expected Early Bird, got {current_tier['name']}"
                print("PASS: Current tier is Early Bird as expected")


class TestMemberLookup:
    """Member lookup by phone tests"""
    
    def test_member_lookup_not_found(self):
        """GET /api/public/members/lookup - Phone not found"""
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=9999999999")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("found") == False, "Should return found: false for non-existent phone"
        print("PASS: Member lookup returns found:false for unknown phone")
    
    def test_member_lookup_invalid_phone(self):
        """GET /api/public/members/lookup - Invalid phone (too short)"""
        response = requests.get(f"{BASE_URL}/api/public/members/lookup?phone=123")
        assert response.status_code == 400, f"Expected 400 for short phone, got {response.status_code}"
        print("PASS: Member lookup rejects too-short phone numbers")


class TestEventRegistrationSubmission:
    """Event registration submission tests for all 4 categories"""
    
    def test_register_as_non_member(self):
        """POST /api/public/events/{id}/register - Non-member registration"""
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "TEST_NonMember Registration",
            "email": "test_nonmember@pytest.com",
            "phone": "+91 98765 11111",
            "qualification": "PhD",
            "organization": "Test Org",
            "state": "Delhi",
            "address_line1": "123 Test Street",
            "address_line2": "Floor 2",
            "district": "Central Delhi",
            "address_state": "Delhi",
            "country": "India",
            "pincode": "110001",
            "identity_proof_url": "/api/uploads/test.pdf",
            "accommodation_choice": "default",
            "registration_fee": 5000,
            "accommodation_fee": 3000,
            "total_amount": 8000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "registration" in data, "Missing registration in response"
        reg = data["registration"]
        assert reg["registration_category"] == "non_member", "Category should be non_member"
        print(f"PASS: Non-member registration created with ID: {reg['id']}")
        return reg["id"]
    
    def test_register_as_student(self):
        """POST /api/public/events/{id}/register - Student registration with free accommodation"""
        payload = {
            "is_member": False,
            "registration_category": "student",
            "name": "TEST_Student Registration",
            "email": "test_student@pytest.com",
            "phone": "+91 98765 22222",
            "qualification": "MSc",
            "organization": "Test University",
            "state": "Maharashtra",
            "college": "Test College of Dairy Sciences",
            "university": "Test State University",
            "bonafide_cert_url": "/api/uploads/test_bonafide.pdf",
            "accommodation_choice": "default",
            "registration_fee": 2000,
            "accommodation_fee": 0,  # Free for students
            "total_amount": 2000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        assert reg["registration_category"] == "student", "Category should be student"
        assert reg["college"] == "Test College of Dairy Sciences", "College should be saved"
        print(f"PASS: Student registration created with ID: {reg['id']}")
    
    def test_register_as_international(self):
        """POST /api/public/events/{id}/register - International delegate registration"""
        payload = {
            "is_member": False,
            "registration_category": "international",
            "name": "TEST_International Delegate",
            "email": "test_intl@pytest.com",
            "phone": "+1 555 1234567",
            "qualification": "PhD",
            "organization": "International Dairy Institute",
            "country": "United States",
            "accommodation_choice": "self",
            "registration_fee": 200,  # USD
            "accommodation_fee": 0,
            "total_amount": 200,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        assert reg["registration_category"] == "international", "Category should be international"
        assert reg["country"] == "United States", "Country should be saved"
        print(f"PASS: International registration created with ID: {reg['id']}")
    
    def test_register_with_premium_hotel(self):
        """POST /api/public/events/{id}/register - With premium hotel and room type"""
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "TEST_PremiumHotel Guest",
            "email": "test_hotel@pytest.com",
            "phone": "+91 98765 33333",
            "address_line1": "456 Hotel St",
            "address_state": "Delhi",
            "pincode": "110002",
            "identity_proof_url": "/api/uploads/test.pdf",
            "accommodation_choice": "premium_hotel",
            "hotel_name": "The Oberoi",
            "hotel_room_type": "Deluxe",
            "hotel_tax_percent": 18,
            "hotel_base_amount": 8000,
            "registration_fee": 5000,
            "accommodation_fee": 9440,  # 8000 + 18% tax = 9440
            "hotel_tax_amount": 1440,
            "total_amount": 14440,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        assert reg["hotel_name"] == "The Oberoi", "Hotel name should be saved"
        assert reg["hotel_room_type"] == "Deluxe", "Room type should be saved"
        assert reg["hotel_tax_percent"] == 18, "Tax percent should be saved"
        print(f"PASS: Premium hotel registration created with ID: {reg['id']}")
    
    def test_register_with_additional_persons(self):
        """POST /api/public/events/{id}/register - With additional persons"""
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "TEST_WithFamily Guest",
            "email": "test_family@pytest.com",
            "phone": "+91 98765 44444",
            "address_line1": "789 Family Ave",
            "address_state": "Karnataka",
            "pincode": "560001",
            "identity_proof_url": "/api/uploads/test.pdf",
            "accommodation_choice": "default",
            "additional_persons": [
                {"name": "Spouse Name", "age": "35", "mobile": "+91 98765 44445"},
                {"name": "Child Name", "age": "10", "mobile": ""}
            ],
            "additional_persons_fee": 3000,  # 1500 * 2 persons
            "registration_fee": 5000,
            "accommodation_fee": 3000,
            "total_amount": 11000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        assert len(reg.get("additional_persons", [])) == 2, "Should have 2 additional persons"
        assert reg["additional_persons_fee"] == 3000, "Additional persons fee should be 3000"
        print(f"PASS: Registration with additional persons created with ID: {reg['id']}")
    
    def test_register_with_addons(self):
        """POST /api/public/events/{id}/register - With add-ons selected"""
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "TEST_WithAddons Guest",
            "email": "test_addons@pytest.com",
            "phone": "+91 98765 55555",
            "address_line1": "101 Addon Street",
            "address_state": "Tamil Nadu",
            "pincode": "600001",
            "identity_proof_url": "/api/uploads/test.pdf",
            "accommodation_choice": "self",
            "selected_addons": ["Pre-conference Workshop", "Excursion Trip"],
            "addon_fee": 3000,  # 1000 + 2000
            "registration_fee": 5000,
            "accommodation_fee": 0,
            "total_amount": 8000,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        assert len(reg.get("selected_addons", [])) == 2, "Should have 2 add-ons selected"
        assert reg["addon_fee"] == 3000, "Addon fee should be 3000"
        print(f"PASS: Registration with add-ons created with ID: {reg['id']}")
    
    def test_register_with_membership(self):
        """POST /api/public/events/{id}/register - With 'Become a Member' option"""
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "TEST_BecomeMember Guest",
            "email": "test_becomemember@pytest.com",
            "phone": "+91 98765 66666",
            "address_line1": "202 Member Lane",
            "address_state": "Gujarat",
            "pincode": "380001",
            "identity_proof_url": "/api/uploads/test.pdf",
            "accommodation_choice": "self",
            "wants_membership": True,
            "membership_type": "academic",
            "membership_fee": 3100,
            "registration_fee": 5000,
            "accommodation_fee": 0,
            "total_amount": 8100,
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        assert reg["wants_membership"] == True, "wants_membership should be True"
        assert reg["membership_type"] == "academic", "Membership type should be academic"
        assert reg["membership_fee"] == 3100, "Membership fee should be 3100"
        print(f"PASS: Registration with membership created with ID: {reg['id']}")
    
    def test_full_registration_all_features(self):
        """POST /api/public/events/{id}/register - Full registration with all features"""
        payload = {
            "is_member": False,
            "registration_category": "non_member",
            "name": "TEST_FullFeature Guest",
            "email": "test_fullfeature@pytest.com",
            "phone": "+91 98765 77777",
            "qualification": "PhD",
            "organization": "Full Feature University",
            "state": "Rajasthan",
            "address_line1": "Full Feature Address Line 1",
            "address_line2": "Floor 5",
            "district": "Jaipur",
            "address_state": "Rajasthan",
            "pincode": "302001",
            "identity_proof_url": "/api/uploads/test_full.pdf",
            "accommodation_choice": "premium_hotel",
            "hotel_name": "Holiday Inn",
            "hotel_room_type": "Standard",
            "hotel_tax_percent": 12,
            "hotel_base_amount": 4000,
            "hotel_tax_amount": 480,
            "additional_persons": [
                {"name": "Full Feature Spouse", "age": "30", "mobile": "+91 98765 77778"}
            ],
            "additional_persons_fee": 1500,
            "wants_membership": True,
            "membership_type": "entrepreneur",
            "selected_addons": ["Pre-conference Workshop"],
            "addon_fee": 1000,
            "registration_fee": 5000,
            "accommodation_fee": 4480,  # 4000 + 12% tax
            "membership_fee": 5100,
            "total_amount": 17080,  # 5000 + 4480 + 1500 + 1000 + 5100
            "payment_mode": "offline"
        }
        response = requests.post(f"{BASE_URL}/api/public/events/{TEST_EVENT_ID}/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        reg = data["registration"]
        
        # Verify all fields
        assert reg["name"] == "TEST_FullFeature Guest"
        assert reg["registration_category"] == "non_member"
        assert reg["hotel_name"] == "Holiday Inn"
        assert reg["hotel_room_type"] == "Standard"
        assert reg["hotel_tax_percent"] == 12
        assert len(reg.get("additional_persons", [])) == 1
        assert reg["wants_membership"] == True
        assert reg["membership_type"] == "entrepreneur"
        assert len(reg.get("selected_addons", [])) == 1
        
        print(f"PASS: Full feature registration created with ID: {reg['id']}")
        print(f"  - Total amount: {reg['total_amount']}")


class TestAdminRegistrations:
    """Admin registration management tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_event_registrations(self):
        """GET /api/admin/events/{id}/registrations - List all registrations"""
        response = requests.get(f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations", 
                               headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        registrations = response.json()
        assert isinstance(registrations, list), "Should return a list"
        
        # Count TEST_ registrations
        test_regs = [r for r in registrations if r.get("name", "").startswith("TEST_")]
        print(f"PASS: Found {len(registrations)} registrations total, {len(test_regs)} are test registrations")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_cleanup_test_registrations(self):
        """Clean up TEST_ prefixed registrations"""
        # Get all registrations
        response = requests.get(f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations", 
                               headers=self.headers)
        if response.status_code == 200:
            registrations = response.json()
            test_regs = [r for r in registrations if r.get("name", "").startswith("TEST_")]
            
            deleted = 0
            for reg in test_regs:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/{reg['id']}", 
                    headers=self.headers
                )
                if del_resp.status_code == 200:
                    deleted += 1
            
            print(f"INFO: Cleaned up {deleted} test registrations")
    
    def test_cleanup_test_membership_plans(self):
        """Clean up test membership plans"""
        response = requests.get(f"{BASE_URL}/api/admin/membership-plans", headers=self.headers)
        if response.status_code == 200:
            plans = response.json()
            test_plans = [p for p in plans if p.get("key", "").startswith("test_")]
            
            for plan in test_plans:
                requests.delete(f"{BASE_URL}/api/admin/membership-plans/{plan['id']}", 
                               headers=self.headers)
            
            print(f"INFO: Cleaned up {len(test_plans)} test membership plans")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
