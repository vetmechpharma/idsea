"""Backend tests for POST /api/public/contact endpoint (iteration 39)."""
import os
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Direct mongo access for DB verification
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


@pytest.fixture(scope="module")
def mongo_db():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    # cleanup test entries
    db.contact_messages.delete_many({"subject": {"$regex": "^TEST_"}})
    client.close()


class TestPublicContact:
    """Public contact form endpoint tests."""

    def test_valid_submission_returns_success(self, mongo_db):
        payload = {
            "name": "TEST_User_Alpha",
            "email": "testalpha@example.com",
            "subject": "TEST_valid_submission",
            "message": "This is a test message from the automated backend test suite."
        }
        r = requests.post(f"{API}/public/contact", json=payload, timeout=15)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "message" in data
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0

        # Verify DB persistence
        doc = mongo_db.contact_messages.find_one({"subject": "TEST_valid_submission"})
        assert doc is not None, "Contact message not persisted in DB"
        assert doc["name"] == payload["name"]
        assert doc["email"] == payload["email"]
        assert doc["message"] == payload["message"]
        assert "id" in doc
        assert "created_at" in doc
        assert doc.get("status") in ("new", "emailed", "email_failed")

    def test_missing_name_returns_400(self):
        payload = {"name": "", "email": "x@y.com", "subject": "TEST_missing_name", "message": "hi"}
        r = requests.post(f"{API}/public/contact", json=payload, timeout=10)
        assert r.status_code == 400
        assert "detail" in r.json()

    def test_missing_email_returns_400(self):
        payload = {"name": "X", "email": "", "subject": "TEST_missing_email", "message": "hi"}
        r = requests.post(f"{API}/public/contact", json=payload, timeout=10)
        assert r.status_code == 400

    def test_missing_subject_returns_400(self):
        payload = {"name": "X", "email": "x@y.com", "subject": "", "message": "hi"}
        r = requests.post(f"{API}/public/contact", json=payload, timeout=10)
        assert r.status_code == 400

    def test_missing_message_returns_400(self):
        payload = {"name": "X", "email": "x@y.com", "subject": "TEST_missing_msg", "message": ""}
        r = requests.post(f"{API}/public/contact", json=payload, timeout=10)
        assert r.status_code == 400

    def test_whitespace_only_fields_returns_400(self):
        payload = {"name": "   ", "email": "  ", "subject": "  ", "message": "  "}
        r = requests.post(f"{API}/public/contact", json=payload, timeout=10)
        assert r.status_code == 400

    def test_empty_payload_returns_400(self):
        r = requests.post(f"{API}/public/contact", json={}, timeout=10)
        assert r.status_code == 400

    def test_multiple_submissions_all_persist(self, mongo_db):
        for i in range(3):
            payload = {
                "name": f"TEST_Multi_{i}",
                "email": f"multi{i}@example.com",
                "subject": f"TEST_multi_{i}",
                "message": f"multi test {i}"
            }
            r = requests.post(f"{API}/public/contact", json=payload, timeout=15)
            assert r.status_code == 200, f"submission {i} failed: {r.text}"
        count = mongo_db.contact_messages.count_documents({"subject": {"$regex": "^TEST_multi_"}})
        assert count == 3


class TestPublicCMSForContactPage:
    """Endpoints that the ContactPage frontend depends on for initial data."""

    def test_public_cms_returns_dict(self):
        r = requests.get(f"{API}/public/cms", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)

    def test_public_page_content_contact_returns_dict(self):
        r = requests.get(f"{API}/public/page-content/contact", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
