"""
Iteration 29 - Sitewide QA before VPS deployment.
Tests all public API endpoints powering the pages, plus admin login and key admin endpoints,
plus SEO endpoints (sitemap.xml, robots.txt) and CMS page-content endpoints (navbar, scripts, footer).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://registration-manager.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
EVENT_ID = "eb488c54-2ee9-4160-b851-548846ec1038"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": "admin@idsea.org", "password": "Admin@123"})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text[:300]}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"No access_token in login response: {data}"
    return tok


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ----------------------------- SEO endpoints -----------------------------
class TestSEO:
    def test_sitemap_xml(self, session):
        r = session.get(f"{API}/public/sitemap.xml")
        assert r.status_code == 200
        assert "<urlset" in r.text or "<sitemapindex" in r.text
        assert "xml" in r.headers.get("content-type", "").lower()

    def test_robots_txt(self, session):
        r = session.get(f"{API}/public/robots.txt")
        assert r.status_code == 200
        assert "User-agent" in r.text or "user-agent" in r.text.lower()


# ----------------------------- CMS page-content -----------------------------
class TestPageContent:
    @pytest.mark.parametrize("page_key", ["navbar", "footer", "scripts", "home", "about", "contact"])
    def test_page_content_endpoint(self, session, page_key):
        r = session.get(f"{API}/public/page-content/{page_key}")
        # Endpoint should return 200 (even if empty content) or 404 if not seeded.
        assert r.status_code in (200, 404), f"{page_key}: {r.status_code} {r.text[:200]}"
        if r.status_code == 200:
            data = r.json()
            assert isinstance(data, (dict, list))


# ----------------------------- Public list endpoints -----------------------------
class TestPublicLists:
    def test_events_list(self, session):
        r = session.get(f"{API}/public/events")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)

    def test_event_detail(self, session):
        r = session.get(f"{API}/public/events/{EVENT_ID}")
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert data.get("id") == EVENT_ID or data.get("_id") == EVENT_ID or "title" in data

    def test_publications_list(self, session):
        r = session.get(f"{API}/public/publications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_gallery_list(self, session):
        r = session.get(f"{API}/public/gallery")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_executive_members(self, session):
        r = session.get(f"{API}/public/executive")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_membership_plans(self, session):
        r = session.get(f"{API}/public/membership-plans")
        assert r.status_code == 200

    def test_sliders(self, session):
        r = session.get(f"{API}/public/sliders")
        assert r.status_code in (200, 404)


# ----------------------------- Certificate verify -----------------------------
class TestCertificateVerify:
    def test_verify_invalid(self, session):
        r = session.get(f"{API}/public/certificates/verify/INVALID_XYZ_123")
        # Either 404 (not found) or 200 with {valid:false} is acceptable
        assert r.status_code in (200, 404)


# ----------------------------- Admin auth-protected endpoints -----------------------------
class TestAdminEndpoints:
    def test_dashboard_stats(self, session, auth_headers):
        r = session.get(f"{API}/admin/dashboard", headers=auth_headers)
        assert r.status_code == 200, r.text[:300]
        assert isinstance(r.json(), (dict, list))

    def test_members_list(self, session, auth_headers):
        r = session.get(f"{API}/admin/members", headers=auth_headers)
        assert r.status_code == 200

    def test_events_admin_list(self, session, auth_headers):
        r = session.get(f"{API}/admin/events", headers=auth_headers)
        assert r.status_code == 200

    def test_email_templates(self, session, auth_headers):
        r = session.get(f"{API}/admin/email-templates", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # 7 default templates expected
        assert len(data) >= 7

    def test_email_queue_stats(self, session, auth_headers):
        r = session.get(f"{API}/admin/email-queue/stats", headers=auth_headers)
        assert r.status_code == 200

    def test_smtp_settings(self, session, auth_headers):
        r = session.get(f"{API}/admin/smtp-settings", headers=auth_headers)
        assert r.status_code in (200, 404)

    def test_certificates_list(self, session, auth_headers):
        r = session.get(f"{API}/admin/certificates", headers=auth_headers)
        assert r.status_code in (200, 404)

    def test_executive_admin(self, session, auth_headers):
        r = session.get(f"{API}/admin/executive", headers=auth_headers)
        assert r.status_code == 200

    def test_cms_list(self, session, auth_headers):
        r = session.get(f"{API}/admin/cms", headers=auth_headers)
        assert r.status_code == 200

    def test_gallery_admin(self, session, auth_headers):
        # gallery is albums-based
        r = session.get(f"{API}/admin/gallery/albums", headers=auth_headers)
        assert r.status_code == 200

    def test_news_admin(self, session, auth_headers):
        r = session.get(f"{API}/admin/news", headers=auth_headers)
        assert r.status_code == 200

    def test_publications_admin(self, session, auth_headers):
        r = session.get(f"{API}/admin/publications", headers=auth_headers)
        assert r.status_code == 200

    def test_reports(self, session, auth_headers):
        r = session.get(f"{API}/admin/reports/stats", headers=auth_headers)
        assert r.status_code == 200
