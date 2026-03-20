"""
Email Template System Tests for IDSEA Iteration 4
Tests for:
1. GET /api/admin/email-templates - List all 4 templates
2. GET /api/admin/email-templates/{key} - Get single template
3. PUT /api/admin/email-templates/{key} - Update template
4. POST /api/admin/email-templates/{key}/preview - Preview with sample data
5. POST /api/admin/email-templates/{key}/reset - Reset to default
6. POST /api/public/members/apply - Triggers registration email
7. PUT /api/admin/members/{id}/approve - Triggers welcome email with certificate
8. POST /api/admin/events/{id}/notify - Queue batch event notifications
9. PUT /api/admin/events/{id}/close - Close event and send participation certs
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://registration-manager.preview.emergentagent.com"


class TestEmailTemplatesAPI:
    """Test email template CRUD endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for admin operations"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_all_email_templates_returns_4_templates(self):
        """GET /api/admin/email-templates returns 4 templates"""
        resp = requests.get(f"{BASE_URL}/api/admin/email-templates", headers=self.headers)
        assert resp.status_code == 200
        templates = resp.json()
        assert len(templates) == 4, f"Expected 4 templates, got {len(templates)}"
        
        # Verify all expected template keys exist
        keys = {t["key"] for t in templates}
        expected_keys = {"registration_submitted", "membership_approved", "event_notification", "event_participation"}
        assert keys == expected_keys, f"Missing templates: {expected_keys - keys}"
        
        # Verify each template has required fields
        for t in templates:
            assert "key" in t
            assert "name" in t
            assert "subject" in t
            assert "body" in t
            assert "variables" in t
            assert "is_default" in t
        print(f"SUCCESS: 4 templates returned: {keys}")
    
    def test_get_single_template_registration_submitted(self):
        """GET /api/admin/email-templates/registration_submitted returns full template"""
        resp = requests.get(f"{BASE_URL}/api/admin/email-templates/registration_submitted", headers=self.headers)
        assert resp.status_code == 200
        template = resp.json()
        
        assert template["key"] == "registration_submitted"
        assert "subject" in template and len(template["subject"]) > 0
        assert "body" in template and len(template["body"]) > 0
        assert "variables" in template and isinstance(template["variables"], list)
        assert "member_name" in template["variables"]
        assert "email" in template["variables"]
        print(f"SUCCESS: Template 'registration_submitted' has {len(template['variables'])} variables")
    
    def test_get_single_template_membership_approved(self):
        """GET /api/admin/email-templates/membership_approved returns template with cert variables"""
        resp = requests.get(f"{BASE_URL}/api/admin/email-templates/membership_approved", headers=self.headers)
        assert resp.status_code == 200
        template = resp.json()
        
        assert template["key"] == "membership_approved"
        assert "membership_id" in template["variables"]
        print(f"SUCCESS: Template 'membership_approved' has membership_id variable")
    
    def test_get_single_template_event_notification(self):
        """GET /api/admin/email-templates/event_notification returns event template"""
        resp = requests.get(f"{BASE_URL}/api/admin/email-templates/event_notification", headers=self.headers)
        assert resp.status_code == 200
        template = resp.json()
        
        assert template["key"] == "event_notification"
        assert "event_title" in template["variables"]
        assert "event_date" in template["variables"]
        print(f"SUCCESS: Template 'event_notification' has event variables")
    
    def test_get_single_template_event_participation(self):
        """GET /api/admin/email-templates/event_participation returns participation cert template"""
        resp = requests.get(f"{BASE_URL}/api/admin/email-templates/event_participation", headers=self.headers)
        assert resp.status_code == 200
        template = resp.json()
        
        assert template["key"] == "event_participation"
        assert "event_title" in template["variables"]
        assert "member_name" in template["variables"]
        print(f"SUCCESS: Template 'event_participation' has participation variables")
    
    def test_update_template_subject_and_body(self):
        """PUT /api/admin/email-templates/registration_submitted updates subject and body"""
        # Get original
        orig_resp = requests.get(f"{BASE_URL}/api/admin/email-templates/registration_submitted", headers=self.headers)
        orig = orig_resp.json()
        
        # Update with new subject/body
        new_subject = f"TEST UPDATE - {orig['subject']}"
        resp = requests.put(
            f"{BASE_URL}/api/admin/email-templates/registration_submitted",
            headers=self.headers,
            json={
                "name": orig["name"],
                "subject": new_subject,
                "body": orig["body"],
                "description": orig.get("description", "")
            }
        )
        assert resp.status_code == 200
        
        # Verify update
        verify_resp = requests.get(f"{BASE_URL}/api/admin/email-templates/registration_submitted", headers=self.headers)
        updated = verify_resp.json()
        assert updated["subject"] == new_subject
        assert updated["is_default"] == False, "Template should be marked as customized"
        print(f"SUCCESS: Template subject updated and marked as customized")
    
    def test_preview_template_with_sample_data(self):
        """POST /api/admin/email-templates/registration_submitted/preview returns rendered HTML"""
        resp = requests.post(f"{BASE_URL}/api/admin/email-templates/registration_submitted/preview", headers=self.headers)
        assert resp.status_code == 200
        preview = resp.json()
        
        assert "subject" in preview
        assert "body" in preview
        # Check sample data was rendered
        assert "Dr. John Doe" in preview["body"], "Sample member_name should be rendered"
        assert "{{" not in preview["body"], "No unrendered placeholders should remain"
        print(f"SUCCESS: Preview rendered with sample data")
    
    def test_reset_template_to_default(self):
        """POST /api/admin/email-templates/registration_submitted/reset resets to default"""
        resp = requests.post(f"{BASE_URL}/api/admin/email-templates/registration_submitted/reset", headers=self.headers)
        assert resp.status_code == 200
        
        # Verify it's back to default
        verify_resp = requests.get(f"{BASE_URL}/api/admin/email-templates/registration_submitted", headers=self.headers)
        template = verify_resp.json()
        assert template["is_default"] == True, "Template should be marked as default after reset"
        print(f"SUCCESS: Template reset to default")


class TestMemberApplyEmailTrigger:
    """Test that member application triggers registration email"""
    
    def test_member_apply_creates_email_log(self):
        """POST /api/public/members/apply triggers registration email (check email_logs)"""
        # Get current email log count
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        logs_before = requests.get(f"{BASE_URL}/api/admin/email/logs", headers=headers)
        count_before = len(logs_before.json())
        
        # Submit a new member application
        unique_email = f"test_apply_{uuid.uuid4().hex[:8]}@test.com"
        apply_resp = requests.post(f"{BASE_URL}/api/public/members/apply", json={
            "name": "Test Applicant",
            "email": unique_email,
            "phone": "+91 98765 43210",
            "qualification": "Ph.D.",
            "organization": "Test University",
            "membership_type": "academic",
            "state": "Tamil Nadu"
        })
        assert apply_resp.status_code == 200, f"Apply failed: {apply_resp.text}"
        member_id = apply_resp.json()["id"]
        
        # Wait for background task
        time.sleep(2)
        
        # Check email logs for new entry
        logs_after = requests.get(f"{BASE_URL}/api/admin/email/logs", headers=headers)
        logs_data = logs_after.json()
        
        # Find registration email log
        reg_logs = [l for l in logs_data if l.get("recipient_group") == "registration_submitted"]
        assert len(reg_logs) > 0, "Registration email log should be created"
        print(f"SUCCESS: Registration email queued (log entry found)")
        
        # Cleanup: delete test member
        requests.delete(f"{BASE_URL}/api/admin/members/{member_id}", headers=headers)


class TestMemberApproveEmailTrigger:
    """Test that member approval triggers welcome email with certificate"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create test member"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a pending member
        unique_email = f"test_approve_{uuid.uuid4().hex[:8]}@test.com"
        resp = requests.post(f"{BASE_URL}/api/public/members/apply", json={
            "name": "Test Approval Member",
            "email": unique_email,
            "phone": "+91 98765 11111",
            "qualification": "M.Sc.",
            "organization": "Approval Test Org",
            "membership_type": "academic",
            "state": "Kerala"
        })
        self.member_id = resp.json()["id"]
        self.member_email = unique_email
        time.sleep(1)  # Wait for registration email
    
    def test_approve_member_triggers_welcome_email(self):
        """PUT /api/admin/members/{id}/approve triggers welcome email with certificate"""
        # Approve the member
        resp = requests.put(f"{BASE_URL}/api/admin/members/{self.member_id}/approve", headers=self.headers)
        assert resp.status_code == 200
        assert "membership_id" in resp.json()
        
        # Wait for background task
        time.sleep(2)
        
        # Check email logs
        logs_resp = requests.get(f"{BASE_URL}/api/admin/email/logs", headers=self.headers)
        logs = logs_resp.json()
        
        # Find approval email log
        approval_logs = [l for l in logs if l.get("recipient_group") == "membership_approved"]
        assert len(approval_logs) > 0, "Membership approval email log should be created"
        print(f"SUCCESS: Welcome email with certificate queued")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/members/{self.member_id}", headers=self.headers)


class TestEventNotification:
    """Test event notification batch sending"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_notify_event_queues_batch_notification(self):
        """POST /api/admin/events/{id}/notify queues batch notification"""
        # Create test event
        event_resp = requests.post(f"{BASE_URL}/api/admin/events", headers=self.headers, json={
            "title": f"Test Event Notify {uuid.uuid4().hex[:6]}",
            "date": "2026-03-15",
            "end_date": "2026-03-17",
            "venue": "Test Venue",
            "description": "Test event for notification testing",
            "registration_fee": 500,
            "status": "upcoming"
        })
        assert event_resp.status_code == 200
        event_id = event_resp.json()["id"]
        
        # Send notification with membership_type filter
        notify_resp = requests.post(
            f"{BASE_URL}/api/admin/events/{event_id}/notify?membership_type=all",
            headers=self.headers
        )
        assert notify_resp.status_code == 200
        assert "queued" in notify_resp.json()["message"].lower() or "notification" in notify_resp.json()["message"].lower()
        print(f"SUCCESS: Event notification queued for 'all' members")
        
        # Test with specific membership type filter
        notify_resp2 = requests.post(
            f"{BASE_URL}/api/admin/events/{event_id}/notify?membership_type=academic",
            headers=self.headers
        )
        assert notify_resp2.status_code == 200
        print(f"SUCCESS: Event notification queued for 'academic' members")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{event_id}", headers=self.headers)
    
    def test_notify_event_not_found(self):
        """POST /api/admin/events/invalid/notify returns 404"""
        resp = requests.post(f"{BASE_URL}/api/admin/events/nonexistent-id/notify", headers=self.headers)
        assert resp.status_code == 404


class TestEventClose:
    """Test event close and participation certificate sending"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        self.token = login_resp.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_close_event_triggers_participation_certs(self):
        """PUT /api/admin/events/{id}/close triggers participation certificates"""
        # Create test event
        event_resp = requests.post(f"{BASE_URL}/api/admin/events", headers=self.headers, json={
            "title": f"Test Event Close {uuid.uuid4().hex[:6]}",
            "date": "2026-02-10",
            "end_date": "2026-02-12",
            "venue": "Close Test Venue",
            "description": "Test event for close testing",
            "registration_fee": 300,
            "status": "ongoing"
        })
        assert event_resp.status_code == 200
        event_id = event_resp.json()["id"]
        
        # Close the event
        close_resp = requests.put(f"{BASE_URL}/api/admin/events/{event_id}/close", headers=self.headers)
        assert close_resp.status_code == 200
        assert "closed" in close_resp.json()["message"].lower() or "certificate" in close_resp.json()["message"].lower()
        print(f"SUCCESS: Event closed and participation certificates being sent")
        
        # Verify event status changed
        event_check = requests.get(f"{BASE_URL}/api/admin/events", headers=self.headers)
        events = event_check.json()
        closed_event = next((e for e in events if e["id"] == event_id), None)
        if closed_event:
            assert closed_event["status"] == "completed", "Event status should be 'completed'"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/events/{event_id}", headers=self.headers)
    
    def test_close_event_not_found(self):
        """PUT /api/admin/events/invalid/close returns 404"""
        resp = requests.put(f"{BASE_URL}/api/admin/events/nonexistent-id/close", headers=self.headers)
        assert resp.status_code == 404


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_accessible(self):
        """Verify API is accessible"""
        resp = requests.get(f"{BASE_URL}/api/public/stats")
        assert resp.status_code == 200
        print(f"SUCCESS: API is accessible at {BASE_URL}")
