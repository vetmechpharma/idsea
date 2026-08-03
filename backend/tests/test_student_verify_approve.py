"""Tests for student college-ID verify/approve flow (iteration 46)"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://registration-manager.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@idsea.org", "password": "Admin@123"}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def three_students(headers):
    """Create 3 pending student members with college_id_url set."""
    ids = []
    for i in range(3):
        suffix = uuid.uuid4().hex[:6]
        payload = {
            "prefix": "Mr",
            "name": f"TEST_Stu_{suffix}",
            "email": f"test_stu_{suffix}@example.com",
            "phone": f"90000{i:05d}",
            "membership_type": "student",
            "college_id_url": f"https://example.com/id_{suffix}.jpg",
            "status": "pending",
        }
        r = requests.post(f"{API}/admin/members", json=payload, headers=headers, timeout=30)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        mid = data.get("id") or data.get("member", {}).get("id")
        if not mid:
            # Fallback: fetch list and find by email
            lst = requests.get(f"{API}/admin/members", headers=headers, timeout=30).json()
            items = lst if isinstance(lst, list) else lst.get("items", [])
            found = next((m for m in items if m.get("email") == payload["email"]), None)
            assert found, f"Could not locate created member for {payload['email']}"
            mid = found["id"]
        ids.append(mid)
    yield ids
    # cleanup
    for mid in ids:
        requests.delete(f"{API}/admin/members/{mid}", headers=headers, timeout=30)


def _get_member(mid, headers):
    r = requests.get(f"{API}/admin/members/{mid}", headers=headers, timeout=30)
    if r.status_code == 200:
        return r.json()
    # fallback: list
    lst = requests.get(f"{API}/admin/members", headers=headers, timeout=30).json()
    items = lst if isinstance(lst, list) else lst.get("items", [])
    return next((m for m in items if m.get("id") == mid), None)


def test_verify_only_targets_one_member(three_students, headers):
    target = three_students[0]
    r = requests.put(f"{API}/admin/members/{target}/verify-college-id", headers=headers, timeout=30)
    assert r.status_code == 200, r.text

    m0 = _get_member(three_students[0], headers)
    m1 = _get_member(three_students[1], headers)
    m2 = _get_member(three_students[2], headers)
    assert m0 and m0.get("college_id_verified") is True
    assert m1 and m1.get("college_id_verified") is False, f"Member 1 should NOT be verified: {m1}"
    assert m2 and m2.get("college_id_verified") is False, f"Member 2 should NOT be verified: {m2}"


def test_approve_blocked_when_not_verified(three_students, headers):
    unverified = three_students[1]
    r = requests.put(f"{API}/admin/members/{unverified}/approve", headers=headers, timeout=30)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
    body = r.json()
    detail = body.get("detail", "")
    assert "verified" in detail.lower(), f"Expected verify-message, got: {detail}"


def test_approve_succeeds_when_verified(three_students, headers):
    verified = three_students[0]
    r = requests.put(f"{API}/admin/members/{verified}/approve", headers=headers, timeout=30)
    assert r.status_code == 200, r.text
    m = _get_member(verified, headers)
    assert m.get("status") == "approved"


def test_request_reupload_clears_url_and_verified(three_students, headers):
    # Use student index 2 (still unverified w/ college_id_url)
    target = three_students[2]
    r = requests.put(f"{API}/admin/members/{target}/request-reupload-college-id", headers=headers, timeout=30)
    assert r.status_code == 200, r.text
    m = _get_member(target, headers)
    assert m.get("college_id_url", "") == ""
    assert m.get("college_id_verified") is False


def test_verify_fails_without_college_id(three_students, headers):
    # student 2 had url cleared in previous test
    target = three_students[2]
    r = requests.put(f"{API}/admin/members/{target}/verify-college-id", headers=headers, timeout=30)
    assert r.status_code == 400
