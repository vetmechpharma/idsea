"""
Iteration 28 - Email Template & Campaign System Tests
Verifies:
 - 7 default templates (3 new: membership_rejected, event_registration_confirmed, certificate_issued)
 - GET /admin/email-templates
 - GET /admin/email-templates/{key}
 - PUT /admin/email-templates/{key} update + persistence
 - POST /admin/email-templates/{key}/reset
 - POST /admin/email-templates (create custom)
 - DELETE /admin/email-templates/{key} (custom deletes, default 400)
 - POST /admin/email-templates/{key}/preview (render sample data)
 - GET /admin/email-queue and /stats (scheduler_running, batch_size=50, batch_interval_mins=5)
 - POST /admin/email-campaign/send queues emails
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL not set"

EXPECTED_DEFAULT_KEYS = {
    "registration_submitted",
    "membership_approved",
    "event_notification",
    "event_participation",
    "membership_rejected",
    "event_registration_confirmed",
    "certificate_issued",
}


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@idsea.org", "password": "Admin@123"},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed: {r.text}"
    token = r.json().get("access_token")
    assert token, "no access_token in login response"
    return {"Authorization": f"Bearer {token}"}


# ---------------- Templates: list & individual ----------------

class TestTemplateList:
    def test_list_returns_all_7_default_templates(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/email-templates", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        templates = r.json()
        assert isinstance(templates, list)
        keys = {t["key"] for t in templates}
        missing = EXPECTED_DEFAULT_KEYS - keys
        assert not missing, f"Missing default templates: {missing}. Got: {keys}"
        # required fields
        for t in templates:
            assert "key" in t
            assert "name" in t
            assert "subject" in t
            assert "body" in t
            assert "variables" in t

    @pytest.mark.parametrize("key", sorted(EXPECTED_DEFAULT_KEYS))
    def test_get_each_default_template(self, admin_headers, key):
        r = requests.get(f"{BASE_URL}/api/admin/email-templates/{key}", headers=admin_headers, timeout=15)
        assert r.status_code == 200, f"{key} -> {r.status_code}: {r.text}"
        t = r.json()
        assert t["key"] == key
        assert isinstance(t.get("subject", ""), str) and len(t["subject"]) > 0
        assert isinstance(t.get("body", ""), str) and len(t["body"]) > 0
        assert isinstance(t.get("variables", []), list)


# ---------------- Template update + reset ----------------

class TestTemplateUpdateReset:
    KEY = "event_registration_confirmed"

    def test_update_subject_body_reflects_in_get(self, admin_headers):
        # get original
        orig = requests.get(
            f"{BASE_URL}/api/admin/email-templates/{self.KEY}", headers=admin_headers, timeout=15
        ).json()
        new_subject = f"TEST_UPDATED_{uuid.uuid4().hex[:6]} - {orig['subject']}"
        new_body = orig["body"] + "\n<!-- TEST_MARKER -->"
        r = requests.put(
            f"{BASE_URL}/api/admin/email-templates/{self.KEY}",
            headers=admin_headers,
            json={
                "name": orig.get("name", ""),
                "subject": new_subject,
                "body": new_body,
                "description": orig.get("description", ""),
                "variables": orig.get("variables", []),
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # verify GET reflects
        got = requests.get(
            f"{BASE_URL}/api/admin/email-templates/{self.KEY}", headers=admin_headers, timeout=15
        ).json()
        assert got["subject"] == new_subject
        assert "TEST_MARKER" in got["body"]

    def test_reset_default_template(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/email-templates/{self.KEY}/reset",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # after reset, no TEST_MARKER
        got = requests.get(
            f"{BASE_URL}/api/admin/email-templates/{self.KEY}", headers=admin_headers, timeout=15
        ).json()
        assert "TEST_MARKER" not in got["body"]


# ---------------- Custom template CRUD ----------------

class TestCustomTemplateCRUD:
    @pytest.fixture(scope="class")
    def custom_key(self):
        return f"test_custom_{uuid.uuid4().hex[:6]}"

    def test_create_custom_template(self, admin_headers, custom_key):
        r = requests.post(
            f"{BASE_URL}/api/admin/email-templates",
            headers=admin_headers,
            json={
                "key": custom_key,
                "name": "TEST Custom Template",
                "subject": "TEST Subject {{member_name}}",
                "body": "<p>Hello {{member_name}}</p>",
                "description": "Test custom template for iter28",
                "variables": ["member_name"],
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("key") == custom_key

    def test_custom_template_in_list_marked_is_custom(self, admin_headers, custom_key):
        r = requests.get(f"{BASE_URL}/api/admin/email-templates", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        match = next((t for t in items if t["key"] == custom_key), None)
        assert match is not None, f"custom template {custom_key} not in list"
        assert match.get("is_custom") is True

    def test_delete_default_template_returns_400(self, admin_headers):
        r = requests.delete(
            f"{BASE_URL}/api/admin/email-templates/registration_submitted",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 400, f"expected 400 for default delete, got {r.status_code}: {r.text}"

    def test_delete_custom_template(self, admin_headers, custom_key):
        r = requests.delete(
            f"{BASE_URL}/api/admin/email-templates/{custom_key}",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # confirm removal
        r2 = requests.get(f"{BASE_URL}/api/admin/email-templates", headers=admin_headers, timeout=15)
        keys = {t["key"] for t in r2.json()}
        assert custom_key not in keys


# ---------------- Template preview ----------------

class TestTemplatePreview:
    @pytest.mark.parametrize("key", sorted(EXPECTED_DEFAULT_KEYS))
    def test_preview_renders_sample_data(self, admin_headers, key):
        r = requests.post(
            f"{BASE_URL}/api/admin/email-templates/{key}/preview",
            headers=admin_headers,
            timeout=15,
        )
        assert r.status_code == 200, f"{key} -> {r.status_code}: {r.text}"
        data = r.json()
        assert "subject" in data and "body" in data
        # No unrendered placeholders left (curly-brace pairs)
        assert "{{" not in data["body"], f"unrendered placeholders in {key} body"
        assert "{{" not in data["subject"], f"unrendered placeholders in {key} subject"


# ---------------- Email queue & stats ----------------

class TestEmailQueue:
    def test_get_queue(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/email-queue", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_queue_stats(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/email-queue/stats", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        s = r.json()
        assert s.get("batch_size") == 50
        assert s.get("batch_interval_mins") == 5
        assert s.get("scheduler_running") is True, f"scheduler not running: {s}"


# ---------------- Campaign send ----------------

class TestCampaignSend:
    def test_send_campaign_queues_emails(self, admin_headers):
        # get an existing default template
        r = requests.post(
            f"{BASE_URL}/api/admin/email-campaign/send",
            headers=admin_headers,
            json={
                "template_key": "membership_approved",
                "recipient_group": "all_members",
                "campaign_name": f"TEST Campaign {uuid.uuid4().hex[:6]}",
            },
            timeout=30,
        )
        # If there are no approved members, endpoint returns 400 - acceptable, but log it
        if r.status_code == 400 and "No recipients" in r.text:
            pytest.skip("No approved members available to test campaign send")
        assert r.status_code == 200, r.text
        body = r.json()
        assert "count" in body
        assert isinstance(body["count"], int)
        assert body["count"] > 0
