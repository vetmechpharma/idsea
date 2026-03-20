"""
Test Event Registration Admin Enhancements - Iteration 13
Tests: Edit, Delete, and Manual Admin Registration for Event Registrations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dairy-reg.preview.emergentagent.com').rstrip('/')
EVENT_ID = "435435f4-774f-4a0f-95e1-1e423493c196"  # International Dairy Conference 2026


class TestEventRegistrationAdminEnhancements:
    """Test Edit, Delete, and Manual Registration endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    # =================== MANUAL REGISTRATION TESTS ===================
    
    def test_manual_registration_basic(self, auth_headers):
        """POST /api/admin/events/{event_id}/register-manual - Create registration with payment_mode=manual"""
        payload = {
            "name": "TEST_ManualReg_Basic",
            "email": f"test_manual_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543210",
            "organization": "Test Organization",
            "qualification": "PhD",
            "state": "Tamil Nadu",
            "is_member": False,
            "member_category": "",
            "accommodation_choice": "none",
            "registration_fee": 2000,
            "accommodation_fee": 0,
            "membership_fee": 0,
            "total_amount": 2000,
            "payment_status": "pending"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manual registration failed: {response.text}"
        data = response.json()
        assert data["message"] == "Registration created"
        assert "registration" in data
        reg = data["registration"]
        
        # Verify payment_mode is 'manual'
        assert reg["payment_mode"] == "manual", f"Expected payment_mode='manual', got '{reg['payment_mode']}'"
        assert reg["name"] == payload["name"]
        assert reg["email"] == payload["email"]
        assert reg["registration_fee"] == payload["registration_fee"]
        assert reg["total_amount"] == payload["total_amount"]
        assert reg["payment_status"] == payload["payment_status"]
        
        # Store for cleanup
        self.__class__.manual_reg_id = reg["id"]
        return reg["id"]
    
    def test_manual_registration_with_accommodation(self, auth_headers):
        """Manual registration with accommodation and member details"""
        payload = {
            "name": "TEST_ManualReg_WithAccom",
            "email": f"test_manual_accom_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543211",
            "organization": "Dairy Research Institute",
            "qualification": "M.Tech",
            "state": "Karnataka",
            "is_member": True,
            "member_category": "academic",
            "accommodation_choice": "default",
            "hotel_name": "",
            "registration_fee": 1500,
            "accommodation_fee": 1000,
            "membership_fee": 0,
            "total_amount": 2500,
            "payment_status": "paid"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        reg = data["registration"]
        
        assert reg["payment_mode"] == "manual"
        assert reg["is_member"] == True
        assert reg["member_category"] == "academic"
        assert reg["accommodation_choice"] == "default"
        assert reg["accommodation_fee"] == 1000
        assert reg["payment_status"] == "paid"
        
        self.__class__.manual_reg_accom_id = reg["id"]
    
    def test_manual_registration_invalid_event(self, auth_headers):
        """Manual registration with non-existent event returns 404"""
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "1234567890"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/events/non-existent-event-id/register-manual",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Event not found" in response.json().get("detail", "")
    
    # =================== EDIT REGISTRATION TESTS ===================
    
    def test_edit_registration_name_email(self, auth_headers):
        """PUT /api/admin/event-registrations/{reg_id} - Update name and email"""
        # First create a registration to edit
        create_payload = {
            "name": "TEST_EditReg_Original",
            "email": f"test_edit_orig_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543212",
            "registration_fee": 2000,
            "total_amount": 2000,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Edit the registration
        edit_payload = {
            "name": "TEST_EditReg_Updated",
            "email": "test_edit_updated@example.com"
        }
        
        edit_resp = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            json=edit_payload,
            headers=auth_headers
        )
        
        assert edit_resp.status_code == 200
        assert edit_resp.json()["message"] == "Registration updated"
        
        # Verify the edit persisted via GET
        get_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        assert get_resp.status_code == 200
        regs = [r for r in get_resp.json() if r["id"] == reg_id]
        assert len(regs) == 1
        assert regs[0]["name"] == "TEST_EditReg_Updated"
        assert regs[0]["email"] == "test_edit_updated@example.com"
        
        self.__class__.edit_reg_id = reg_id
    
    def test_edit_registration_fees(self, auth_headers):
        """Edit registration fees and verify total recalculation"""
        # Create registration
        create_payload = {
            "name": "TEST_EditFees",
            "email": f"test_edit_fees_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543213",
            "registration_fee": 1000,
            "accommodation_fee": 500,
            "membership_fee": 0,
            "total_amount": 1500,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Edit fees
        edit_payload = {
            "registration_fee": 2500,
            "accommodation_fee": 1000,
            "membership_fee": 3100,
            "total_amount": 6600  # Frontend calculates: 2500 + 1000 + 3100
        }
        
        edit_resp = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            json=edit_payload,
            headers=auth_headers
        )
        
        assert edit_resp.status_code == 200
        
        # Verify
        get_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        regs = [r for r in get_resp.json() if r["id"] == reg_id]
        assert len(regs) == 1
        assert regs[0]["registration_fee"] == 2500
        assert regs[0]["accommodation_fee"] == 1000
        assert regs[0]["membership_fee"] == 3100
        assert regs[0]["total_amount"] == 6600
        
        self.__class__.edit_fees_reg_id = reg_id
    
    def test_edit_registration_payment_status(self, auth_headers):
        """Edit payment status from pending to paid"""
        # Create registration
        create_payload = {
            "name": "TEST_EditPayment",
            "email": f"test_edit_pay_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543214",
            "registration_fee": 2000,
            "total_amount": 2000,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Edit payment status
        edit_payload = {"payment_status": "paid"}
        
        edit_resp = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            json=edit_payload,
            headers=auth_headers
        )
        
        assert edit_resp.status_code == 200
        
        # Verify
        get_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        regs = [r for r in get_resp.json() if r["id"] == reg_id]
        assert len(regs) == 1
        assert regs[0]["payment_status"] == "paid"
        
        self.__class__.edit_payment_reg_id = reg_id
    
    def test_edit_registration_not_found(self, auth_headers):
        """Edit non-existent registration returns 404"""
        edit_payload = {"name": "Test"}
        
        edit_resp = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/non-existent-reg-id",
            json=edit_payload,
            headers=auth_headers
        )
        
        assert edit_resp.status_code == 404
        assert "Registration not found" in edit_resp.json().get("detail", "")
    
    # =================== DELETE REGISTRATION TESTS ===================
    
    def test_delete_registration(self, auth_headers):
        """DELETE /api/admin/event-registrations/{reg_id} - Delete registration"""
        # Create registration to delete
        create_payload = {
            "name": "TEST_DeleteReg",
            "email": f"test_delete_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543215",
            "registration_fee": 1000,
            "total_amount": 1000,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Delete the registration
        delete_resp = requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            headers=auth_headers
        )
        
        assert delete_resp.status_code == 200
        assert delete_resp.json()["message"] == "Registration deleted"
        
        # Verify deletion via GET - should not find the registration
        get_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        assert get_resp.status_code == 200
        regs = [r for r in get_resp.json() if r["id"] == reg_id]
        assert len(regs) == 0, "Registration should be deleted but still exists"
    
    def test_delete_registration_not_found(self, auth_headers):
        """Delete non-existent registration returns 404"""
        delete_resp = requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/non-existent-reg-id",
            headers=auth_headers
        )
        
        assert delete_resp.status_code == 404
        assert "Registration not found" in delete_resp.json().get("detail", "")
    
    def test_delete_then_verify_404(self, auth_headers):
        """After delete, attempting to edit returns 404"""
        # Create registration
        create_payload = {
            "name": "TEST_DeleteThenEdit",
            "email": f"test_delete_edit_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543216",
            "registration_fee": 1000,
            "total_amount": 1000,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Delete
        delete_resp = requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            headers=auth_headers
        )
        assert delete_resp.status_code == 200
        
        # Try to edit - should get 404
        edit_resp = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            json={"name": "Updated"},
            headers=auth_headers
        )
        assert edit_resp.status_code == 404
    
    # =================== CLEANUP ===================
    
    @pytest.fixture(scope="class", autouse=True)
    def cleanup_test_data(self, auth_headers):
        """Cleanup TEST_ prefixed registrations after tests"""
        yield
        # Cleanup all test registrations
        get_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        if get_resp.status_code == 200:
            regs = get_resp.json()
            for reg in regs:
                if reg.get("name", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/admin/event-registrations/{reg['id']}",
                        headers=auth_headers
                    )


class TestStatsUpdate:
    """Test that stats update after add/edit/delete operations"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    def test_stats_update_on_add(self, auth_headers):
        """Adding a registration increases total count"""
        # Get initial count
        initial_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        initial_count = len(initial_resp.json())
        
        # Add registration
        create_payload = {
            "name": "TEST_StatsAdd",
            "email": f"test_stats_add_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543217",
            "registration_fee": 1000,
            "total_amount": 1000,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Get new count
        new_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        new_count = len(new_resp.json())
        
        assert new_count == initial_count + 1, f"Expected count {initial_count + 1}, got {new_count}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/event-registrations/{reg_id}", headers=auth_headers)
    
    def test_stats_update_on_delete(self, auth_headers):
        """Deleting a registration decreases total count"""
        # Create registration
        create_payload = {
            "name": "TEST_StatsDelete",
            "email": f"test_stats_del_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "9876543218",
            "registration_fee": 1000,
            "total_amount": 1000,
            "payment_status": "pending"
        }
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=create_payload,
            headers=auth_headers
        )
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["registration"]["id"]
        
        # Get count after create
        after_create_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        after_create_count = len(after_create_resp.json())
        
        # Delete
        requests.delete(f"{BASE_URL}/api/admin/event-registrations/{reg_id}", headers=auth_headers)
        
        # Get count after delete
        after_delete_resp = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=auth_headers
        )
        after_delete_count = len(after_delete_resp.json())
        
        assert after_delete_count == after_create_count - 1
