"""
Iteration 47 backend tests:
- POST /api/admin/members/regenerate-certificates (bulk cert regen)
- POST /api/admin/members/{id}/send-email (upgraded email endpoint)
- PUT /api/admin/cms with byelaws_pdf_url + GET /api/public/cms
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text[:200]}"
    tok = r.json().get("token") or r.json().get("access_token")
    assert tok
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def some_member_id(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/members?limit=5", headers=admin_headers, timeout=20)
    assert r.status_code == 200, r.text[:200]
    data = r.json()
    members = data if isinstance(data, list) else data.get("members", data.get("items", []))
    assert members, "No members exist to test with"
    return members[0]["id"]


# ---------- CMS byelaws_pdf_url ----------
class TestCMSByelaws:
    def test_get_current_cms(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/admin/cms", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        # byelaws_pdf_url may be absent or empty
        self.original = r.json()

    def test_update_and_persist_byelaws(self, admin_headers):
        # fetch current
        cur = requests.get(f"{BASE_URL}/api/admin/cms", headers=admin_headers, timeout=15).json()
        payload = dict(cur) if isinstance(cur, dict) else {}
        payload.pop("_id", None)
        payload.pop("updated_at", None)
        test_url = "https://example.com/test_byelaws.pdf"
        payload["byelaws_pdf_url"] = test_url
        r = requests.put(f"{BASE_URL}/api/admin/cms", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text[:300]

        # verify on public
        pr = requests.get(f"{BASE_URL}/api/public/cms", timeout=15)
        assert pr.status_code == 200
        assert pr.json().get("byelaws_pdf_url") == test_url

        # reset
        payload["byelaws_pdf_url"] = cur.get("byelaws_pdf_url", "") if isinstance(cur, dict) else ""
        requests.put(f"{BASE_URL}/api/admin/cms", json=payload, headers=admin_headers, timeout=15)


# ---------- Bulk certificate regeneration ----------
class TestRegenerateCertificates:
    def test_regen_response_structure(self, admin_headers):
        r = requests.post(f"{BASE_URL}/api/admin/members/regenerate-certificates",
                          json={"send_email": False, "membership_type": "all"},
                          headers=admin_headers, timeout=30)
        # 200 if members exist, 400 if none
        assert r.status_code in (200, 400), r.text[:300]
        if r.status_code == 200:
            data = r.json()
            assert "message" in data
            assert "total" in data
            assert isinstance(data["total"], int)

    def test_regen_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/members/regenerate-certificates",
                          json={"send_email": False}, timeout=15)
        assert r.status_code in (401, 403)


# ---------- Upgraded send-email endpoint ----------
class TestSendEmailUpgraded:
    def test_missing_subject_body_400(self, admin_headers, some_member_id):
        r = requests.post(f"{BASE_URL}/api/admin/members/{some_member_id}/send-email",
                          json={"send_email": True}, headers=admin_headers, timeout=15)
        assert r.status_code == 400

    def test_send_email_only(self, admin_headers, some_member_id):
        payload = {
            "subject": "TEST Iteration 47",
            "body": "<p>Hello <b>Test</b></p>",
            "cc": "",
            "send_email": True,
            "send_whatsapp": False,
            "attachments": [],
        }
        r = requests.post(f"{BASE_URL}/api/admin/members/{some_member_id}/send-email",
                          json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "results" in data
        assert "email" in data["results"]
        assert "whatsapp" in data["results"]
        assert data["results"]["email"] == "sending"
        assert data["results"]["whatsapp"] is None

    def test_send_whatsapp_only(self, admin_headers, some_member_id):
        payload = {
            "subject": "TEST",
            "body": "<p>Body</p>",
            "send_email": False,
            "send_whatsapp": True,
        }
        r = requests.post(f"{BASE_URL}/api/admin/members/{some_member_id}/send-email",
                          json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        # whatsapp may be None if member has no phone; but 'sending' expected if phone exists
        assert d["results"]["email"] is None

    def test_send_both_with_cc_and_attachment(self, admin_headers, some_member_id):
        # tiny 1x1 png in base64 data url
        b64 = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
        payload = {
            "subject": "TEST both",
            "body": "<p>hi</p>",
            "cc": "cc1@test.com, invalid, cc2@test.com",
            "send_email": True,
            "send_whatsapp": True,
            "attachments": [{"filename": "px.png", "data_url": f"data:image/png;base64,{b64}"}],
        }
        r = requests.post(f"{BASE_URL}/api/admin/members/{some_member_id}/send-email",
                          json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["results"]["email"] == "sending"
