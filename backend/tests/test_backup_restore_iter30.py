"""
Iteration 30: Backup / Restore / Factory Reset endpoint tests
Also verifies: requirements.txt has no emergentintegrations,
index.html has no Emergent watermark/analytics,
startup does not seed executive committee / member demo data.
"""
import os
import io
import re
import zipfile
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback: try to read frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("access_token") or data.get("token")
    assert token, f"No access_token in login response: {data}"
    return token


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ============ Static file checks ============

class TestStaticFiles:
    def test_requirements_no_emergentintegrations(self):
        with open("/app/backend/requirements.txt") as f:
            text = f.read()
        assert "emergentintegrations" not in text.lower(), \
            "requirements.txt still contains 'emergentintegrations'"

    def test_index_html_no_emergent(self):
        with open("/app/frontend/public/index.html") as f:
            html = f.read().lower()
        assert "emergent-badge" not in html, "index.html contains id='emergent-badge'"
        assert "made with emergent" not in html, "index.html contains 'Made with Emergent'"
        assert "posthog" not in html, "index.html contains posthog analytics"
        assert "emergentagent.com/logo" not in html

    def test_public_home_no_emergent_badge(self):
        r = requests.get(f"{BASE_URL}/", timeout=15)
        # SPA - the initial HTML shell should not have the badge
        assert r.status_code == 200
        low = r.text.lower()
        assert "emergent-badge" not in low
        assert "made with emergent" not in low
        assert "posthog" not in low


# ============ Backup info endpoint ============

class TestBackupInfo:
    def test_info_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/admin/backup/info", timeout=15)
        assert r.status_code in (401, 403)

    def test_info_returns_stats(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/backup/info", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "database" in data
        assert "uploads" in data
        assert "restore_instructions" in data
        assert "total_documents" in data["database"]
        assert "collections" in data["database"]
        assert isinstance(data["database"]["collections"], dict)
        assert "file_count" in data["uploads"]
        assert "size_mb" in data["uploads"]
        assert "restore_path" in data["uploads"]
        assert "database" in data["restore_instructions"]
        assert "uploads" in data["restore_instructions"]


# ============ Backup download endpoints ============

class TestBackupDownload:
    def test_backup_database_returns_zip(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/backup/database",
            headers=auth_headers,
            timeout=60,
        )
        assert r.status_code == 200, r.text[:500]
        ctype = r.headers.get("content-type", "")
        assert "application/zip" in ctype or "application/x-zip" in ctype, f"content-type={ctype}"
        # Verify it's a valid ZIP with _backup_info.json + at least one collection json
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        names = zf.namelist()
        assert "_backup_info.json" in names
        json_files = [n for n in names if n.endswith(".json") and not n.startswith("_")]
        assert len(json_files) >= 1, f"No collection JSONs in backup ZIP. names={names}"

    def test_backup_uploads_returns_zip(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/admin/backup/uploads",
            headers=auth_headers,
            timeout=60,
        )
        assert r.status_code == 200, r.text[:500]
        ctype = r.headers.get("content-type", "")
        assert "application/zip" in ctype or "application/x-zip" in ctype
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        names = zf.namelist()
        assert "_backup_info.json" in names


# ============ Restore endpoints (contract only — do not clobber real data) ============

class TestRestoreEndpoints:
    def test_restore_database_rejects_non_zip(self, auth_headers):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = requests.post(
            f"{BASE_URL}/api/admin/restore/database",
            headers=auth_headers,
            files=files,
            timeout=30,
        )
        assert r.status_code == 400
        assert "zip" in r.text.lower()

    def test_restore_uploads_rejects_non_zip(self, auth_headers):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = requests.post(
            f"{BASE_URL}/api/admin/restore/uploads",
            headers=auth_headers,
            files=files,
            timeout=30,
        )
        assert r.status_code == 400

    def test_restore_uploads_with_empty_zip(self, auth_headers):
        """Send a minimal valid ZIP with only a metadata file — should succeed with 0 files."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("_backup_info.json", "{}")
        buf.seek(0)
        files = {"file": ("empty.zip", buf.read(), "application/zip")}
        r = requests.post(
            f"{BASE_URL}/api/admin/restore/uploads",
            headers=auth_headers,
            files=files,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        j = r.json()
        assert "count" in j
        assert j["count"] == 0


# ============ Factory Reset — contract only ============

class TestFactoryReset:
    def test_factory_reset_without_confirm(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/factory-reset",
            headers=auth_headers,
            json={},
            timeout=15,
        )
        assert r.status_code == 400, r.text

    def test_factory_reset_wrong_confirm(self, auth_headers):
        r = requests.post(
            f"{BASE_URL}/api/admin/factory-reset",
            headers=auth_headers,
            json={"confirm": "yes please"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_factory_reset_requires_auth(self):
        r = requests.post(
            f"{BASE_URL}/api/admin/factory-reset",
            json={"confirm": "DELETE_ALL_DATA"},
            timeout=15,
        )
        assert r.status_code in (401, 403)


# ============ Seed data check — no demo executive/members ============

class TestNoSeedDemo:
    """The backend startup should NOT seed demo executive committee members
    or sample member data. Only admin + CMS page_contents should be seeded."""

    def test_no_seed_demo_members_or_executive_in_startup_code(self):
        with open("/app/backend/server.py") as f:
            code = f.read()
        # Find startup_event body — look for "async def startup_event" up to next "@app" or shutdown
        m = re.search(r"async def startup_event\(.*?\).*?(?=@app\.on_event\(\"shutdown\"\)|\Z)",
                      code, re.DOTALL)
        assert m, "startup_event function not found"
        startup_body = m.group(0)

        # It's OK to reference `executive_committee` in comments or backup lists elsewhere,
        # but startup MUST NOT insert into these collections.
        forbidden_inserts = [
            r"db\.executive_committee\.insert",
            r"db\.members\.insert",
            r"db\.executive_committee\.insert_many",
            r"db\.members\.insert_many",
        ]
        for pat in forbidden_inserts:
            assert not re.search(pat, startup_body), \
                f"startup_event contains forbidden seed insert matching {pat}"
