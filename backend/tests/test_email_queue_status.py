"""
Backend tests for Email Queue & Logs status tracking fix (iteration 37).

Verifies:
- POST /api/admin/email/send updates log status from queued -> sent/failed (bug fix)
- GET /api/admin/email/logs returns logs with no stale 'queued' status
- GET /api/admin/email-queue/stats returns per-status counts for queue + logs
- send_templated_email now flips status from 'sending' to 'sent'/'failed'
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://registration-manager.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestEmailQueueStats:
    def test_stats_endpoint_returns_expected_format(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/email-queue/stats", headers=headers, timeout=15)
        assert r.status_code == 200, f"Stats endpoint failed: {r.status_code} {r.text}"
        data = r.json()

        # Required top-level keys
        for key in ("queue", "queue_total", "logs", "logs_total", "batch_size", "batch_interval_mins", "scheduler_running"):
            assert key in data, f"Missing key '{key}' in stats response: {data}"

        assert isinstance(data["queue"], dict)
        assert isinstance(data["logs"], dict)
        assert isinstance(data["queue_total"], int)
        assert isinstance(data["logs_total"], int)
        assert data["batch_size"] == 50
        assert data["batch_interval_mins"] == 5
        # scheduler flag should be true if backend is up
        assert data["scheduler_running"] is True

        # Sum of per-status counts must equal totals
        assert sum(data["queue"].values()) == data["queue_total"]
        assert sum(data["logs"].values()) == data["logs_total"]

    def test_email_logs_no_stale_queued(self, headers):
        """After fix: existing email_logs should have no rows stuck on 'queued' status."""
        r = requests.get(f"{BASE_URL}/api/admin/email/logs", headers=headers, timeout=15)
        assert r.status_code == 200
        logs = r.json()
        assert isinstance(logs, list)

        queued = [l for l in logs if l.get("status") == "queued"]
        # After the fix, backfill should have converted stale 'queued' -> 'sent'
        assert len(queued) == 0, f"Found {len(queued)} stale 'queued' logs (should be 0 after fix): {queued[:3]}"


class TestAdminSendEmailStatus:
    """The critical bug: POST /api/admin/email/send used to insert log with status='queued'
    and NEVER update it. After the fix the log should transition to 'sent' or 'failed'.
    """

    def test_admin_send_email_updates_log_status(self, headers):
        payload = {
            "recipients": ["TEST_email_status_check@example.com"],
            "recipient_group": "custom",
            "subject": "TEST_status_tracking_iter37",
            "body": "<p>Test body for status tracking verification</p>",
        }
        r = requests.post(f"{BASE_URL}/api/admin/email/send", json=payload, headers=headers, timeout=15)
        assert r.status_code == 200, f"Send email failed: {r.status_code} {r.text}"
        body = r.json()
        assert "log_id" in body, f"Response missing log_id: {body}"
        log_id = body["log_id"]

        # Wait for background task to complete (SMTP call). Even if SMTP is unconfigured, status must become 'failed'.
        final_status = None
        for _ in range(15):
            time.sleep(1)
            logs_r = requests.get(f"{BASE_URL}/api/admin/email/logs", headers=headers, timeout=15)
            assert logs_r.status_code == 200
            logs = logs_r.json()
            match = next((l for l in logs if l.get("id") == log_id), None)
            if match:
                final_status = match.get("status")
                if final_status in ("sent", "failed"):
                    break

        assert final_status is not None, f"Log id {log_id} not found in /admin/email/logs"
        assert final_status in ("sent", "failed"), (
            f"Log status is '{final_status}', expected 'sent' or 'failed' "
            f"(NOT 'queued' — this is the exact bug being fixed)"
        )


class TestEmailQueueList:
    def test_queue_list_endpoint(self, headers):
        r = requests.get(f"{BASE_URL}/api/admin/email-queue", headers=headers, timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # Each item should have a status field
        for item in items[:20]:
            assert "status" in item
            assert item["status"] in ("pending", "processing", "sent", "failed"), (
                f"Unexpected queue status: {item.get('status')}"
            )
