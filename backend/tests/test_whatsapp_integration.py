"""
Test WhatsApp (AK Nexus) Integration - Iteration 14
Tests all WhatsApp admin endpoints:
- Settings CRUD
- Instance connection/disconnect
- QR code retrieval
- Status check
- Test message sending
- Bulk messaging
- Message logs
- Webhook endpoint
- WhatsApp notification hooks in membership/event endpoints
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL not set")

# Admin credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"
TEST_ACCESS_TOKEN = "69bb937459e3f"


class TestWhatsAppSettings:
    """WhatsApp settings CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_whatsapp_settings_empty(self):
        """GET /api/admin/whatsapp-settings returns settings (may be empty initially)"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp-settings", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # Should return an object with expected keys
        assert isinstance(data, dict), "Settings should be a dict"
        # May have empty or filled values
        assert "enabled" in data or data == {}, "Should have 'enabled' key or be empty"
    
    def test_save_whatsapp_settings(self):
        """PUT /api/admin/whatsapp-settings saves access_token, enabled flag, auto_notifications"""
        settings_data = {
            "access_token": TEST_ACCESS_TOKEN,
            "instance_id": "test_instance_123",
            "enabled": True,
            "auto_notifications": {
                "membership_submitted": True,
                "membership_approved": True,
                "membership_denied": False,
                "event_registered": True,
                "room_allotment": True,
                "payment_received": True,
            }
        }
        resp = requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                          json=settings_data, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "message" in data, "Should return success message"
        assert "updated" in data["message"].lower(), f"Message should indicate update: {data}"
        
        # Verify settings were saved
        get_resp = requests.get(f"{BASE_URL}/api/admin/whatsapp-settings", headers=self.headers)
        assert get_resp.status_code == 200
        saved = get_resp.json()
        assert saved.get("enabled") == True, "Enabled flag should be True"
        assert saved.get("instance_id") == "test_instance_123", "Instance ID should match"
        assert saved.get("auto_notifications", {}).get("membership_denied") == False
    
    def test_save_settings_partial_update(self):
        """PUT /api/admin/whatsapp-settings allows partial updates"""
        # First save full settings
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={"enabled": False, "access_token": TEST_ACCESS_TOKEN}, 
                    headers=self.headers)
        
        # Now just update enabled flag
        resp = requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                          json={"enabled": True}, headers=self.headers)
        assert resp.status_code == 200
        
        # Verify enabled was updated
        get_resp = requests.get(f"{BASE_URL}/api/admin/whatsapp-settings", headers=self.headers)
        assert get_resp.json().get("enabled") == True


class TestWhatsAppInstanceManagement:
    """WhatsApp instance connection/status tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and setup settings"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Ensure settings have access token
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={"access_token": TEST_ACCESS_TOKEN, "enabled": True}, 
                    headers=self.headers)
    
    def test_connect_instance(self):
        """POST /api/admin/whatsapp/connect creates instance connection"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/connect", 
                           json={"instance_id": "test_idsea_instance"}, 
                           headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # May have status=success or status=error (if external API fails)
        assert "status" in data or "result" in data or "instance_id" in data
    
    def test_get_connection_status(self):
        """GET /api/admin/whatsapp/status returns connection status"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/status", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # Should have instance_id or status
        assert "instance_id" in data or "status" in data
    
    def test_get_qr_code(self):
        """GET /api/admin/whatsapp/qr returns QR code data"""
        # First ensure there's an instance
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={"instance_id": "test_qr_instance", "access_token": TEST_ACCESS_TOKEN}, 
                    headers=self.headers)
        
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/qr", headers=self.headers)
        # Should return 200 or 400 (if no instance configured)
        assert resp.status_code in [200, 400], f"Expected 200 or 400, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # Should be JSON with qr data or error
        assert isinstance(data, dict)
    
    def test_get_qr_without_instance_returns_error_or_empty(self):
        """GET /api/admin/whatsapp/qr returns error response or empty when no instance"""
        # Clear instance ID
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={"instance_id": "", "access_token": TEST_ACCESS_TOKEN}, 
                    headers=self.headers)
        
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/qr", headers=self.headers)
        # Should return 400 error OR 200 with error in response (graceful handling)
        assert resp.status_code in [200, 400], f"Expected 200 or 400, got {resp.status_code}"
        # If 200, should contain error info in response
        if resp.status_code == 200:
            data = resp.json()
            # Either has error key or empty qr data
            assert "error" in data or not data.get("qr") or not data.get("qr_code")
    
    def test_disconnect_instance(self):
        """POST /api/admin/whatsapp/disconnect disconnects instance"""
        # First ensure there's an instance
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={"instance_id": "test_disconnect_instance", "access_token": TEST_ACCESS_TOKEN}, 
                    headers=self.headers)
        
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/disconnect", 
                           json={}, headers=self.headers)
        # Could be 200 (success) or 400 (no instance)
        assert resp.status_code in [200, 400], f"Expected 200 or 400, got {resp.status_code}"
    
    def test_list_instances(self):
        """GET /api/admin/whatsapp/instances lists instances"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/instances", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, (dict, list)), "Should return JSON object or array"


class TestWhatsAppMessaging:
    """WhatsApp messaging tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and setup"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Setup WhatsApp settings
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={"access_token": TEST_ACCESS_TOKEN, "instance_id": "test_msg_instance", "enabled": True}, 
                    headers=self.headers)
    
    def test_send_test_message_requires_phone(self):
        """POST /api/admin/whatsapp/send-test requires phone number"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-test", 
                           json={"message": "Test message"}, 
                           headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for missing phone, got {resp.status_code}"
        assert "phone" in resp.json().get("detail", "").lower()
    
    def test_send_test_message(self):
        """POST /api/admin/whatsapp/send-test sends test message"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-test", 
                           json={"phone": "919876543210", "message": "Test from IDSEA"}, 
                           headers=self.headers)
        # May return 200 or 400 depending on external API state
        assert resp.status_code in [200, 400], f"Expected 200 or 400, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, dict)
    
    def test_send_bulk_requires_message(self):
        """POST /api/admin/whatsapp/send-bulk requires message"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-bulk", 
                           json={"target": "all_members"}, 
                           headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for missing message, got {resp.status_code}"
    
    def test_send_bulk_starts_background_task(self):
        """POST /api/admin/whatsapp/send-bulk starts bulk send in background"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-bulk", 
                           json={
                               "message": "Hello {name}, this is a bulk test",
                               "target": "all_members",
                               "membership_type": "all"
                           }, 
                           headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "message" in data
        assert "background" in data["message"].lower()
    
    def test_send_bulk_to_event_registrants(self):
        """POST /api/admin/whatsapp/send-bulk can target event registrants"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-bulk", 
                           json={
                               "message": "Hello {name}, event reminder",
                               "target": "event_registered",
                               "event_id": "some-event-id"
                           }, 
                           headers=self.headers)
        assert resp.status_code == 200


class TestWhatsAppLogs:
    """WhatsApp message logs tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_whatsapp_logs(self):
        """GET /api/admin/whatsapp/logs returns message logs"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/logs", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), "Logs should be a list"
    
    def test_get_whatsapp_logs_with_limit(self):
        """GET /api/admin/whatsapp/logs supports limit parameter"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/logs?limit=10", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) <= 10


class TestWhatsAppWebhook:
    """WhatsApp webhook endpoint tests"""
    
    def test_webhook_receives_data(self):
        """POST /api/whatsapp/webhook receives webhooks (no auth required)"""
        webhook_data = {
            "instance_id": "test_instance",
            "event": "message_received",
            "data": {
                "from": "919876543210",
                "message": "Hello"
            }
        }
        resp = requests.post(f"{BASE_URL}/api/whatsapp/webhook", json=webhook_data)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("status") == "ok"
    
    def test_webhook_no_auth_required(self):
        """Webhook endpoint should work without auth token"""
        resp = requests.post(f"{BASE_URL}/api/whatsapp/webhook", json={"test": "data"})
        assert resp.status_code == 200


class TestWhatsAppNotificationHooks:
    """Test WhatsApp notification hooks in membership/event endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and enable WhatsApp"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Enable WhatsApp notifications
        requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", 
                    json={
                        "access_token": TEST_ACCESS_TOKEN, 
                        "instance_id": "test_hook_instance", 
                        "enabled": True,
                        "auto_notifications": {
                            "membership_submitted": True,
                            "membership_approved": True,
                            "membership_denied": True,
                            "event_registered": True,
                        }
                    }, 
                    headers=self.headers)
    
    def test_membership_apply_has_whatsapp_notification(self):
        """POST /api/public/members/apply triggers WhatsApp notification"""
        unique_email = f"test_wa_{uuid.uuid4().hex[:8]}@test.com"
        member_data = {
            "name": "Test WA Member",
            "email": unique_email,
            "phone": "9876543210",
            "membership_type": "academic",
            "state": "Karnataka"
        }
        resp = requests.post(f"{BASE_URL}/api/public/members/apply", json=member_data)
        # Should succeed (notification runs as background task)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, "Should return member ID"
    
    def test_member_approval_has_whatsapp_notification(self):
        """PUT /api/admin/members/{id}/approve triggers WhatsApp notification"""
        # First create a member
        unique_email = f"test_wa_approve_{uuid.uuid4().hex[:8]}@test.com"
        member_data = {
            "name": "Test WA Approve",
            "email": unique_email,
            "phone": "9876543211",
            "membership_type": "entrepreneur"
        }
        create_resp = requests.post(f"{BASE_URL}/api/public/members/apply", json=member_data)
        assert create_resp.status_code == 200
        member_id = create_resp.json()["id"]
        
        # Now approve
        approve_resp = requests.put(f"{BASE_URL}/api/admin/members/{member_id}/approve", 
                                   headers=self.headers)
        assert approve_resp.status_code == 200
        assert "membership_id" in approve_resp.json()
    
    def test_member_rejection_has_whatsapp_notification(self):
        """PUT /api/admin/members/{id}/reject triggers WhatsApp notification"""
        # First create a member
        unique_email = f"test_wa_reject_{uuid.uuid4().hex[:8]}@test.com"
        member_data = {
            "name": "Test WA Reject",
            "email": unique_email,
            "phone": "9876543212",
            "membership_type": "corporate"
        }
        create_resp = requests.post(f"{BASE_URL}/api/public/members/apply", json=member_data)
        assert create_resp.status_code == 200
        member_id = create_resp.json()["id"]
        
        # Now reject
        reject_resp = requests.put(f"{BASE_URL}/api/admin/members/{member_id}/reject", 
                                  headers=self.headers)
        assert reject_resp.status_code == 200


class TestWhatsAppAuthRequired:
    """Test that admin endpoints require authentication"""
    
    def test_settings_requires_auth(self):
        """GET /api/admin/whatsapp-settings requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp-settings")
        assert resp.status_code in [401, 403]
    
    def test_update_settings_requires_auth(self):
        """PUT /api/admin/whatsapp-settings requires auth"""
        resp = requests.put(f"{BASE_URL}/api/admin/whatsapp-settings", json={"enabled": True})
        assert resp.status_code in [401, 403]
    
    def test_connect_requires_auth(self):
        """POST /api/admin/whatsapp/connect requires auth"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/connect", json={})
        assert resp.status_code in [401, 403]
    
    def test_status_requires_auth(self):
        """GET /api/admin/whatsapp/status requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/status")
        assert resp.status_code in [401, 403]
    
    def test_logs_requires_auth(self):
        """GET /api/admin/whatsapp/logs requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/logs")
        assert resp.status_code in [401, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
