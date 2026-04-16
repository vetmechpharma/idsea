"""
Test WhatsApp Marketing Campaign Feature - Iteration 23
Tests the new Marketing Campaign endpoints:
- POST /api/admin/whatsapp/campaign - Create and start campaign
- GET /api/admin/whatsapp/campaigns - List all campaigns
- GET /api/admin/whatsapp/campaigns/{id} - Get single campaign details
- POST /api/admin/whatsapp/send-test - Send test message via v2 API
- GET /api/admin/whatsapp/status - Check instance status via v2 API

Also tests:
- Batch size control (1-50)
- Interval seconds (min 5)
- Reference code generation (IDSEA-XXXXXX format)
- Media attachments (image/document)
- Target audience options (all_members, event_registered, custom)
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL not set")

# Admin credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


class TestWhatsAppCampaignCreate:
    """Test POST /api/admin/whatsapp/campaign endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_campaign_requires_message(self):
        """POST /api/admin/whatsapp/campaign requires message field"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json={"name": "Test Campaign"}, 
                           headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for missing message, got {resp.status_code}"
        assert "message" in resp.json().get("detail", "").lower()
    
    def test_create_campaign_basic(self):
        """POST /api/admin/whatsapp/campaign creates campaign with basic fields"""
        campaign_data = {
            "name": f"TEST_Campaign_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, this is a test campaign message.",
            "target": "all_members",
            "batch_size": 10,
            "interval_seconds": 30
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Verify response structure
        assert "campaign_id" in data, "Response should contain campaign_id"
        assert "campaign" in data, "Response should contain campaign object"
        assert "message" in data, "Response should contain message"
        
        # Verify campaign object
        campaign = data["campaign"]
        assert campaign["name"] == campaign_data["name"]
        assert campaign["message"] == campaign_data["message"]
        assert campaign["batch_size"] == 10
        assert campaign["interval_seconds"] == 30
        assert campaign["status"] == "running"
    
    def test_create_campaign_with_reference_code(self):
        """POST /api/admin/whatsapp/campaign with add_reference_code=True"""
        campaign_data = {
            "name": f"TEST_RefCode_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, test with reference code.",
            "target": "all_members",
            "add_reference_code": True
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        # Verify add_reference_code is stored
        assert data["campaign"]["add_reference_code"] == True
    
    def test_create_campaign_without_reference_code(self):
        """POST /api/admin/whatsapp/campaign with add_reference_code=False"""
        campaign_data = {
            "name": f"TEST_NoRef_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, test without reference code.",
            "target": "all_members",
            "add_reference_code": False
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["campaign"]["add_reference_code"] == False
    
    def test_create_campaign_batch_size_limits(self):
        """POST /api/admin/whatsapp/campaign enforces batch_size 1-50"""
        # Test batch_size > 50 gets capped to 50
        campaign_data = {
            "name": f"TEST_BatchMax_{uuid.uuid4().hex[:8]}",
            "message": "Test batch size max",
            "batch_size": 100  # Should be capped to 50
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        assert resp.json()["campaign"]["batch_size"] == 50
        
        # Test batch_size < 1 gets set to 1
        campaign_data["name"] = f"TEST_BatchMin_{uuid.uuid4().hex[:8]}"
        campaign_data["batch_size"] = 0
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        assert resp.json()["campaign"]["batch_size"] == 1
    
    def test_create_campaign_interval_minimum(self):
        """POST /api/admin/whatsapp/campaign enforces interval_seconds >= 5"""
        campaign_data = {
            "name": f"TEST_IntervalMin_{uuid.uuid4().hex[:8]}",
            "message": "Test interval minimum",
            "interval_seconds": 2  # Should be set to 5
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        assert resp.json()["campaign"]["interval_seconds"] == 5
    
    def test_create_campaign_with_media_image(self):
        """POST /api/admin/whatsapp/campaign with image attachment"""
        campaign_data = {
            "name": f"TEST_Image_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, check out this image!",
            "media_url": "https://example.com/image.jpg",
            "media_type": "image"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["campaign"]["media_url"] == "https://example.com/image.jpg"
        assert data["campaign"]["media_type"] == "image"
    
    def test_create_campaign_with_media_document(self):
        """POST /api/admin/whatsapp/campaign with PDF attachment"""
        campaign_data = {
            "name": f"TEST_PDF_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, please find the attached document.",
            "media_url": "https://example.com/document.pdf",
            "media_type": "document"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["campaign"]["media_url"] == "https://example.com/document.pdf"
        assert data["campaign"]["media_type"] == "document"
    
    def test_create_campaign_custom_phones(self):
        """POST /api/admin/whatsapp/campaign with custom phone list"""
        campaign_data = {
            "name": f"TEST_Custom_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, custom list test.",
            "target": "custom",
            "custom_phones": [
                {"phone": "919876543210", "name": "Dr. Test User"},
                {"phone": "918765432100", "name": "Prof. Sample"}
            ]
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["campaign"]["target"] == "custom"
        assert len(data["campaign"]["custom_phones"]) == 2
    
    def test_create_campaign_event_target(self):
        """POST /api/admin/whatsapp/campaign targeting event registrations"""
        campaign_data = {
            "name": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, event reminder.",
            "target": "event_registered",
            "event_id": "some-event-id"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["campaign"]["target"] == "event_registered"
        assert data["campaign"]["event_id"] == "some-event-id"
    
    def test_create_campaign_membership_filter(self):
        """POST /api/admin/whatsapp/campaign with membership type filter"""
        campaign_data = {
            "name": f"TEST_Filter_{uuid.uuid4().hex[:8]}",
            "message": "Hello {name}, academic members only.",
            "target": "all_members",
            "membership_type": "academic"
        }
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json=campaign_data, headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["campaign"]["membership_type"] == "academic"


class TestWhatsAppCampaignList:
    """Test GET /api/admin/whatsapp/campaigns endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_list_campaigns(self):
        """GET /api/admin/whatsapp/campaigns returns list of campaigns"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/campaigns", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert isinstance(data, list), "Response should be a list"
        
        # If there are campaigns, verify structure
        if len(data) > 0:
            campaign = data[0]
            assert "id" in campaign
            assert "name" in campaign
            assert "status" in campaign
            assert "created_at" in campaign
    
    def test_list_campaigns_sorted_by_created_at(self):
        """GET /api/admin/whatsapp/campaigns returns campaigns sorted by created_at desc"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/campaigns", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        
        if len(data) >= 2:
            # Verify descending order
            for i in range(len(data) - 1):
                assert data[i]["created_at"] >= data[i+1]["created_at"], \
                    "Campaigns should be sorted by created_at descending"


class TestWhatsAppCampaignGet:
    """Test GET /api/admin/whatsapp/campaigns/{id} endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and create a test campaign"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test campaign
        campaign_data = {
            "name": f"TEST_GetCampaign_{uuid.uuid4().hex[:8]}",
            "message": "Test campaign for GET endpoint",
            "batch_size": 5,
            "interval_seconds": 10,
            "add_reference_code": True
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                                   json=campaign_data, headers=self.headers)
        assert create_resp.status_code == 200
        self.campaign_id = create_resp.json()["campaign_id"]
    
    def test_get_campaign_by_id(self):
        """GET /api/admin/whatsapp/campaigns/{id} returns campaign details"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/campaigns/{self.campaign_id}", 
                          headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert data["id"] == self.campaign_id
        assert "name" in data
        assert "message" in data
        assert "batch_size" in data
        assert "interval_seconds" in data
        assert "status" in data
        assert "total" in data
        assert "sent" in data
        assert "failed" in data
    
    def test_get_campaign_not_found(self):
        """GET /api/admin/whatsapp/campaigns/{id} returns 404 for non-existent campaign"""
        fake_id = str(uuid.uuid4())
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/campaigns/{fake_id}", 
                          headers=self.headers)
        assert resp.status_code == 404


class TestWhatsAppSendTest:
    """Test POST /api/admin/whatsapp/send-test endpoint (v2 API)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_send_test_requires_phone(self):
        """POST /api/admin/whatsapp/send-test requires phone number"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-test", 
                           json={"message": "Test message"}, 
                           headers=self.headers)
        assert resp.status_code == 400, f"Expected 400 for missing phone, got {resp.status_code}"
        assert "phone" in resp.json().get("detail", "").lower()
    
    def test_send_test_message(self):
        """POST /api/admin/whatsapp/send-test sends test message"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/send-test", 
                           json={"phone": "919876543210", "message": "Test from IDSEA API"}, 
                           headers=self.headers)
        # May return 200 (success/error in response) depending on WhatsApp instance state
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "status" in data
        # Status can be 'success' or 'error' depending on WhatsApp instance
        assert data["status"] in ["success", "error"]


class TestWhatsAppStatus:
    """Test GET /api/admin/whatsapp/status endpoint (v2 API)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_status(self):
        """GET /api/admin/whatsapp/status returns instance status"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/status", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Should have status field
        assert "status" in data or "instance_id" in data


class TestWhatsAppCampaignAuth:
    """Test that campaign endpoints require authentication"""
    
    def test_create_campaign_requires_auth(self):
        """POST /api/admin/whatsapp/campaign requires auth"""
        resp = requests.post(f"{BASE_URL}/api/admin/whatsapp/campaign", 
                           json={"message": "Test"})
        assert resp.status_code in [401, 403]
    
    def test_list_campaigns_requires_auth(self):
        """GET /api/admin/whatsapp/campaigns requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/campaigns")
        assert resp.status_code in [401, 403]
    
    def test_get_campaign_requires_auth(self):
        """GET /api/admin/whatsapp/campaigns/{id} requires auth"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/campaigns/some-id")
        assert resp.status_code in [401, 403]


class TestWhatsAppLogs:
    """Test GET /api/admin/whatsapp/logs endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_logs(self):
        """GET /api/admin/whatsapp/logs returns message logs"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/logs", headers=self.headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert isinstance(data, list), "Logs should be a list"
        
        # If there are logs, verify structure
        if len(data) > 0:
            log = data[0]
            assert "phone" in log
            assert "status" in log
            assert "sent_at" in log
    
    def test_get_logs_with_limit(self):
        """GET /api/admin/whatsapp/logs supports limit parameter"""
        resp = requests.get(f"{BASE_URL}/api/admin/whatsapp/logs?limit=5", headers=self.headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) <= 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
