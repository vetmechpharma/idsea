"""
Test: Admin Event Registrations Page APIs (Iteration 20)
Testing the overhauled admin event registrations page:
- Registrations list API with filters
- Export APIs (Excel, PDF, Accommodation report)
- Manual registration API
- Edit registration API
- Update payment status
- Update accommodation details
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com').rstrip('/')
EVENT_ID = "a6d69db6-d6f8-4fb6-a707-14dc903f8bfc"

class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """Test admin login to get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["admin"]["email"] == "admin@idsea.org"
        print(f"✓ Admin login successful, token received")
        return data["access_token"]


class TestEventRegistrationsAPIs:
    """Test event registrations admin APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_registrations_list(self):
        """Test fetching registrations list for event"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get registrations: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Registrations list API: {len(data)} registrations found")
        
        # Verify V2 fields are present in registration
        if len(data) > 0:
            reg = data[0]
            v2_fields = ["registration_category", "address_line1", "address_state", 
                        "accommodation_choice", "additional_persons", "selected_addons",
                        "registration_fee", "accommodation_fee", "addon_fee"]
            for field in v2_fields:
                assert field in reg or reg.get(field) is not None or reg.get(field) == "", \
                    f"V2 field '{field}' missing in registration response"
            print(f"✓ V2 fields present in registration response")
    
    def test_get_events_list(self):
        """Test fetching events list"""
        response = requests.get(f"{BASE_URL}/api/admin/events", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Events list API: {len(data)} events found")
    
    def test_export_excel(self):
        """Test Excel export endpoint - should return 200 with XLSX file"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations/export",
            headers=self.headers
        )
        assert response.status_code == 200, f"Excel export failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✓ Excel export API: {len(response.content)} bytes returned")
    
    def test_export_pdf(self):
        """Test PDF export endpoint - should return 200 with PDF file"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations/export/pdf",
            headers=self.headers
        )
        assert response.status_code == 200, f"PDF export failed: {response.text}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✓ PDF export API: {len(response.content)} bytes returned")
    
    def test_export_accommodation_report(self):
        """Test accommodation report export endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations/accommodation-report",
            headers=self.headers
        )
        assert response.status_code == 200, f"Accommodation report export failed: {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("Content-Type", "")
        print(f"✓ Accommodation report export API: {len(response.content)} bytes returned")


class TestManualRegistration:
    """Test manual registration CRUD"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.created_reg_id = None
    
    def test_create_manual_registration(self):
        """Test creating a manual registration with V2 fields"""
        timestamp = int(time.time())
        payload = {
            "name": f"TEST_Manual User {timestamp}",
            "email": f"test_manual_{timestamp}@example.com",
            "phone": "9876543210",
            "registration_category": "non_member",
            "organization": "Test Organization",
            "qualification": "PhD",
            "address_line1": "123 Test Street",
            "address_state": "Maharashtra",
            "pincode": "400001",
            "accommodation_choice": "none",
            "registration_fee": 5000,
            "accommodation_fee": 0,
            "addon_fee": 0,
            "membership_fee": 0,
            "additional_persons_fee": 0,
            "total_amount": 5000,
            "payment_status": "pending",
            "payment_mode": "offline"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Manual registration failed: {response.text}"
        data = response.json()
        assert "registration" in data
        assert data["registration"]["name"] == payload["name"]
        assert data["registration"]["email"] == payload["email"]
        assert data["registration"]["registration_category"] == "non_member"
        assert data["registration"]["address_line1"] == "123 Test Street"
        
        self.created_reg_id = data["registration"]["id"]
        print(f"✓ Manual registration created: {self.created_reg_id}")
        
        # Verify the registration appears in list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=self.headers
        )
        assert list_response.status_code == 200
        regs = list_response.json()
        found = any(r["id"] == self.created_reg_id for r in regs)
        assert found, "Newly created registration not found in list"
        print(f"✓ Manual registration verified in list")
        
        # Clean up - delete the test registration
        if self.created_reg_id:
            del_response = requests.delete(
                f"{BASE_URL}/api/admin/event-registrations/{self.created_reg_id}",
                headers=self.headers
            )
            assert del_response.status_code == 200
            print(f"✓ Test registration cleaned up")


class TestEditRegistration:
    """Test edit registration functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create test registration"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test registration
        timestamp = int(time.time())
        create_response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json={
                "name": f"TEST_Edit User {timestamp}",
                "email": f"test_edit_{timestamp}@example.com",
                "phone": "9876543211",
                "registration_category": "non_member",
                "registration_fee": 5000,
                "total_amount": 5000,
                "payment_status": "pending"
            },
            headers=self.headers
        )
        assert create_response.status_code == 200
        self.test_reg_id = create_response.json()["registration"]["id"]
    
    def test_edit_registration_v2_fields(self):
        """Test editing a registration with V2 fields"""
        edit_payload = {
            "name": "TEST_Updated Name",
            "email": "test_updated@example.com",
            "phone": "9999999999",
            "organization": "Updated Org",
            "registration_category": "student",
            "address_line1": "456 Updated Street",
            "address_state": "Karnataka",
            "pincode": "560001",
            "college": "Test College",
            "accommodation_choice": "default",
            "registration_fee": 2000,
            "accommodation_fee": 1500,
            "total_amount": 3500,
            "payment_status": "paid"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{self.test_reg_id}",
            json=edit_payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Edit registration failed: {response.text}"
        print(f"✓ Registration edited successfully")
        
        # Verify changes by fetching the list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=self.headers
        )
        assert list_response.status_code == 200
        regs = list_response.json()
        updated_reg = next((r for r in regs if r["id"] == self.test_reg_id), None)
        assert updated_reg is not None
        assert updated_reg["name"] == "TEST_Updated Name"
        assert updated_reg["registration_category"] == "student"
        assert updated_reg["payment_status"] == "paid"
        assert updated_reg["total_amount"] == 3500
        print(f"✓ Edit registration changes verified")
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/{self.test_reg_id}",
            headers=self.headers
        )


class TestPaymentStatus:
    """Test payment status update"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create test registration"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test registration
        timestamp = int(time.time())
        create_response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json={
                "name": f"TEST_Payment User {timestamp}",
                "email": f"test_payment_{timestamp}@example.com",
                "registration_category": "non_member",
                "total_amount": 5000,
                "payment_status": "pending"
            },
            headers=self.headers
        )
        assert create_response.status_code == 200
        self.test_reg_id = create_response.json()["registration"]["id"]
    
    def test_update_payment_status(self):
        """Test updating payment status to paid"""
        response = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{self.test_reg_id}/payment",
            json={"payment_status": "paid"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Payment update failed: {response.text}"
        print(f"✓ Payment status updated to paid")
        
        # Verify change
        list_response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=self.headers
        )
        assert list_response.status_code == 200
        regs = list_response.json()
        updated_reg = next((r for r in regs if r["id"] == self.test_reg_id), None)
        assert updated_reg is not None
        assert updated_reg["payment_status"] == "paid"
        print(f"✓ Payment status change verified")
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/{self.test_reg_id}",
            headers=self.headers
        )


class TestAccommodationUpdate:
    """Test accommodation update functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create test registration"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test registration with accommodation
        timestamp = int(time.time())
        create_response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json={
                "name": f"TEST_Accom User {timestamp}",
                "email": f"test_accom_{timestamp}@example.com",
                "registration_category": "non_member",
                "accommodation_choice": "default",
                "total_amount": 6500,
                "payment_status": "paid"
            },
            headers=self.headers
        )
        assert create_response.status_code == 200
        self.test_reg_id = create_response.json()["registration"]["id"]
    
    def test_update_accommodation_assignment(self):
        """Test assigning room and accommodation details"""
        payload = {
            "assigned_room_no": "101-A",
            "assigned_location": "Hotel Grand Plaza",
            "assigned_location_type": "Hotel",
            "assigned_map_link": "https://maps.google.com/test"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{self.test_reg_id}/accommodation",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200, f"Accommodation update failed: {response.text}"
        print(f"✓ Accommodation details assigned")
        
        # Verify assignment
        list_response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=self.headers
        )
        assert list_response.status_code == 200
        regs = list_response.json()
        updated_reg = next((r for r in regs if r["id"] == self.test_reg_id), None)
        assert updated_reg is not None
        assert updated_reg["assigned_room_no"] == "101-A"
        assert updated_reg["assigned_location"] == "Hotel Grand Plaza"
        print(f"✓ Accommodation assignment verified")
        
        # Clean up
        requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/{self.test_reg_id}",
            headers=self.headers
        )


class TestDeleteRegistration:
    """Test delete registration functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_delete_registration(self):
        """Test deleting a registration"""
        # Create a test registration
        timestamp = int(time.time())
        create_response = requests.post(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/register-manual",
            json={
                "name": f"TEST_Delete User {timestamp}",
                "email": f"test_delete_{timestamp}@example.com",
                "registration_category": "non_member",
                "total_amount": 5000
            },
            headers=self.headers
        )
        assert create_response.status_code == 200
        reg_id = create_response.json()["registration"]["id"]
        
        # Delete the registration
        response = requests.delete(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Delete failed: {response.text}"
        print(f"✓ Registration deleted")
        
        # Verify deletion
        list_response = requests.get(
            f"{BASE_URL}/api/admin/events/{EVENT_ID}/registrations",
            headers=self.headers
        )
        assert list_response.status_code == 200
        regs = list_response.json()
        found = any(r["id"] == reg_id for r in regs)
        assert not found, "Deleted registration still appears in list"
        print(f"✓ Registration deletion verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
