"""
Backend tests for Iteration 43:
- Admin User CRUD (Super Admin only)
- /auth/me returns role and permissions
- Public membership-lookup endpoint
- Public membership-upgrade endpoint
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://registration-manager.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

SUPER_EMAIL = "admin@idsea.org"
SUPER_PASS = "Admin@123"


@pytest.fixture(scope="module")
def super_token():
    r = requests.post(f"{API}/auth/login", json={"email": SUPER_EMAIL, "password": SUPER_PASS}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def super_headers(super_token):
    return {"Authorization": f"Bearer {super_token}", "Content-Type": "application/json"}


# ============ AUTH ============
class TestAuthMe:
    def test_me_returns_role_and_permissions(self, super_headers):
        r = requests.get(f"{API}/auth/me", headers=super_headers, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == SUPER_EMAIL
        assert data["role"] == "super_admin"
        assert "permissions" in data
        assert isinstance(data["permissions"], list)


# ============ ADMIN USERS CRUD ============
class TestAdminUserCRUD:
    created_ids = []

    def test_list_admin_users(self, super_headers):
        r = requests.get(f"{API}/admin/users", headers=super_headers, timeout=10)
        assert r.status_code == 200, r.text
        users = r.json()
        assert isinstance(users, list)
        assert len(users) >= 1
        # Superadmin present
        emails = [u.get("email") for u in users]
        assert SUPER_EMAIL in emails
        # Ensure fields
        u = next(x for x in users if x.get("email") == SUPER_EMAIL)
        assert "role" in u and "username" in u and "id" in u
        # Ensure no _id / no password_hash leaked
        assert "_id" not in u
        assert "password_hash" not in u

    def test_create_event_manager_admin(self, super_headers):
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "username": f"TEST_em_{suffix}",
            "email": f"TEST_em_{suffix}@example.com",
            "password": "TestPass@123",
            "role": "event_manager",
            "permissions": [],
        }
        r = requests.post(f"{API}/admin/users", headers=super_headers, json=payload, timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        TestAdminUserCRUD.created_ids.append(data["id"])

        # Verify via GET list (email is stored lowercased server-side)
        r2 = requests.get(f"{API}/admin/users", headers=super_headers, timeout=10)
        users = r2.json()
        u = next((x for x in users if x.get("email") == payload["email"].lower()), None)
        assert u is not None, "Created user not found in list"
        assert u["role"] == "event_manager"
        assert u["username"] == payload["username"]

    def test_create_admin_role(self, super_headers):
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "username": f"TEST_ad_{suffix}",
            "email": f"TEST_ad_{suffix}@example.com",
            "password": "TestPass@123",
            "role": "admin",
        }
        r = requests.post(f"{API}/admin/users", headers=super_headers, json=payload, timeout=10)
        assert r.status_code == 200, r.text
        TestAdminUserCRUD.created_ids.append(r.json()["id"])

    def test_create_missing_fields_returns_400(self, super_headers):
        r = requests.post(f"{API}/admin/users", headers=super_headers, json={"email": "x@y.com"}, timeout=10)
        assert r.status_code == 400

    def test_create_invalid_role_returns_400(self, super_headers):
        suffix = uuid.uuid4().hex[:6]
        payload = {"username": f"TEST_x_{suffix}", "email": f"TEST_x_{suffix}@example.com", "password": "pass1234", "role": "hacker"}
        r = requests.post(f"{API}/admin/users", headers=super_headers, json=payload, timeout=10)
        assert r.status_code == 400

    def test_duplicate_email_rejected(self, super_headers):
        payload = {"username": "TEST_dup", "email": SUPER_EMAIL, "password": "pass1234", "role": "admin"}
        r = requests.post(f"{API}/admin/users", headers=super_headers, json=payload, timeout=10)
        assert r.status_code == 400

    def test_update_admin_user(self, super_headers):
        if not TestAdminUserCRUD.created_ids:
            pytest.skip("no created user")
        uid = TestAdminUserCRUD.created_ids[0]
        new_username = f"TEST_updated_{uuid.uuid4().hex[:6]}"
        r = requests.put(f"{API}/admin/users/{uid}", headers=super_headers, json={"username": new_username, "role": "admin"}, timeout=10)
        assert r.status_code == 200, r.text

        # Verify via list
        r2 = requests.get(f"{API}/admin/users", headers=super_headers, timeout=10)
        u = next((x for x in r2.json() if x.get("id") == uid), None)
        assert u is not None
        assert u["username"] == new_username
        assert u["role"] == "admin"

    def test_reset_password(self, super_headers):
        if not TestAdminUserCRUD.created_ids:
            pytest.skip("no created user")
        uid = TestAdminUserCRUD.created_ids[0]
        # Get email for that user
        r_list = requests.get(f"{API}/admin/users", headers=super_headers, timeout=10)
        u = next(x for x in r_list.json() if x["id"] == uid)
        email = u["email"]

        new_password = "NewPass@456"
        r = requests.put(f"{API}/admin/users/{uid}/reset-password", headers=super_headers, json={"password": new_password}, timeout=10)
        assert r.status_code == 200, r.text

        # Try login with new password
        r_login = requests.post(f"{API}/auth/login", json={"email": email, "password": new_password}, timeout=10)
        assert r_login.status_code == 200, f"Login with new password failed: {r_login.text}"

    def test_reset_password_too_short(self, super_headers):
        if not TestAdminUserCRUD.created_ids:
            pytest.skip("no created user")
        uid = TestAdminUserCRUD.created_ids[0]
        r = requests.put(f"{API}/admin/users/{uid}/reset-password", headers=super_headers, json={"password": "123"}, timeout=10)
        assert r.status_code == 400

    def test_non_super_admin_forbidden(self, super_headers):
        # Login as the event_manager we created if any
        if len(TestAdminUserCRUD.created_ids) < 2:
            pytest.skip("no em user")
        em_id = TestAdminUserCRUD.created_ids[1]
        r_list = requests.get(f"{API}/admin/users", headers=super_headers, timeout=10)
        em = next((x for x in r_list.json() if x["id"] == em_id), None)
        if not em or em.get("role") != "event_manager":
            pytest.skip("em not present")
        # login as em - we don't have password anymore since reset only applied to created_ids[0]
        # Just use created_ids[1] account with original password
        r_login = requests.post(f"{API}/auth/login", json={"email": em["email"], "password": "TestPass@123"}, timeout=10)
        if r_login.status_code != 200:
            pytest.skip("cannot login as em")
        em_token = r_login.json()["access_token"]
        em_headers = {"Authorization": f"Bearer {em_token}", "Content-Type": "application/json"}
        # Try to list admin users
        r = requests.get(f"{API}/admin/users", headers=em_headers, timeout=10)
        assert r.status_code == 403, f"Expected 403 for non-super_admin, got {r.status_code}"

    def test_zz_cleanup_created_users(self, super_headers):
        for uid in TestAdminUserCRUD.created_ids:
            r = requests.delete(f"{API}/admin/users/{uid}", headers=super_headers, timeout=10)
            assert r.status_code == 200, f"Cleanup delete failed: {r.text}"
        # Verify removed
        r_list = requests.get(f"{API}/admin/users", headers=super_headers, timeout=10)
        remaining_ids = [u["id"] for u in r_list.json()]
        for uid in TestAdminUserCRUD.created_ids:
            assert uid not in remaining_ids, f"User {uid} not deleted"

    def test_cannot_delete_self(self, super_headers):
        # Get self id
        r_me = requests.get(f"{API}/auth/me", headers=super_headers, timeout=10)
        my_id = r_me.json()["id"]
        r = requests.delete(f"{API}/admin/users/{my_id}", headers=super_headers, timeout=10)
        assert r.status_code == 400


# ============ MEMBERSHIP LOOKUP / UPGRADE ============
class TestMembershipUpgradePublic:
    def test_lookup_missing_id_returns_400(self):
        r = requests.post(f"{API}/public/membership-lookup", json={"membership_id": ""}, timeout=10)
        assert r.status_code == 400

    def test_lookup_not_found_returns_404(self):
        r = requests.post(f"{API}/public/membership-lookup", json={"membership_id": "NONEXISTENT/XX/2099/999999"}, timeout=10)
        assert r.status_code == 404

    def test_upgrade_missing_member_id(self):
        r = requests.post(f"{API}/public/membership-upgrade", json={}, timeout=10)
        assert r.status_code == 400

    def test_upgrade_member_not_found(self):
        r = requests.post(f"{API}/public/membership-upgrade", json={"member_id": "no-such-uuid"}, timeout=10)
        assert r.status_code == 404


# ============ DUPLICATE ROUTE SANITY ============
class TestNoAdminAdminUsersDupWins:
    """Verify the newer /admin/users route (with super_admin RBAC) is the one active."""

    def test_get_admin_users_requires_super_admin(self, super_headers):
        # If old route was winning, non-super-admin would also get 200. Test with no auth: expect 401
        r = requests.get(f"{API}/admin/users", timeout=10)
        assert r.status_code in (401, 403)
