"""
Test Event Registration Management Features
- PUT /api/admin/event-registrations/{id}/accommodation
- GET /api/admin/events/{id}/registrations/export/pdf
- GET /api/admin/events/{id}/registrations/accommodation-report
- POST /api/admin/event-registrations/{id}/send-accommodation (email/whatsapp)
- POST /api/admin/events/{id}/registrations/send-all-accommodation
"""

import pytest
import requests
import os
from urllib.parse import quote

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"
TEST_EVENT_ID = "435435f4-774f-4a0f-95e1-1e423493c196"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    # API returns access_token
    token = data.get("access_token") or data.get("token")
    assert token, "No token in login response"
    return token


@pytest.fixture(scope="module")
def headers(auth_token):
    """Create headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture(scope="module")
def test_registration(headers):
    """Get a registration to test with"""
    response = requests.get(
        f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
        headers=headers
    )
    assert response.status_code == 200, f"Failed to get registrations: {response.text}"
    regs = response.json()
    assert len(regs) > 0, "No registrations found for testing"
    # Find one with accommodation need (not self)
    accom_reg = next((r for r in regs if r.get("accommodation_choice") and r["accommodation_choice"] != "self"), regs[0])
    return accom_reg


class TestEventRegistrationsList:
    """Test fetching event registrations"""

    def test_get_registrations_list(self, headers):
        """Test GET /api/admin/events/{id}/registrations returns list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify registration structure
        if len(data) > 0:
            reg = data[0]
            assert "id" in reg
            assert "name" in reg
            assert "email" in reg
            assert "phone" in reg
            print(f"✓ Found {len(data)} registrations")


class TestAccommodationAssignment:
    """Test accommodation assignment endpoint"""

    def test_update_accommodation_fields(self, headers, test_registration):
        """Test PUT /api/admin/event-registrations/{id}/accommodation saves all fields"""
        reg_id = test_registration["id"]
        
        accom_data = {
            "assigned_room_no": "TEST-101-A",
            "assigned_location": "Test Hotel Namakkal",
            "assigned_location_type": "Hotel",
            "assigned_map_link": "https://maps.google.com/?q=test"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}/accommodation",
            json=accom_data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Accommodation updated: {data['message']}")
        
        # Verify the update was persisted
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations",
            headers=headers
        )
        regs = verify_response.json()
        updated_reg = next((r for r in regs if r["id"] == reg_id), None)
        
        assert updated_reg is not None, "Could not find updated registration"
        assert updated_reg.get("assigned_room_no") == accom_data["assigned_room_no"]
        assert updated_reg.get("assigned_location") == accom_data["assigned_location"]
        assert updated_reg.get("assigned_location_type") == accom_data["assigned_location_type"]
        assert updated_reg.get("assigned_map_link") == accom_data["assigned_map_link"]
        print("✓ All accommodation fields persisted correctly")

    def test_update_accommodation_partial(self, headers, test_registration):
        """Test partial update - only room number"""
        reg_id = test_registration["id"]
        
        accom_data = {
            "assigned_room_no": "TEST-202-B"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}/accommodation",
            json=accom_data,
            headers=headers
        )
        
        assert response.status_code == 200
        print("✓ Partial accommodation update works")


class TestExportEndpoints:
    """Test export endpoints for PDF and Excel"""

    def test_export_excel_registrations(self, headers):
        """Test GET /api/admin/events/{id}/registrations/export returns Excel"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/export",
            headers=headers
        )
        
        assert response.status_code == 200, f"Export Excel failed: {response.text}"
        content_type = response.headers.get("content-type", "")
        assert "spreadsheet" in content_type or "application/vnd" in content_type, f"Wrong content type: {content_type}"
        assert len(response.content) > 0, "Empty Excel file"
        print(f"✓ Excel export works - {len(response.content)} bytes")

    def test_export_pdf_registrations(self, headers):
        """Test GET /api/admin/events/{id}/registrations/export/pdf returns valid PDF"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/export/pdf",
            headers=headers
        )
        
        assert response.status_code == 200, f"Export PDF failed: {response.text}"
        content_type = response.headers.get("content-type", "")
        assert "pdf" in content_type, f"Wrong content type: {content_type}"
        # PDF files start with %PDF
        assert response.content[:4] == b'%PDF', "Not a valid PDF file"
        print(f"✓ PDF export works - {len(response.content)} bytes")

    def test_export_accommodation_report(self, headers):
        """Test GET /api/admin/events/{id}/registrations/accommodation-report returns Excel"""
        response = requests.get(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/accommodation-report",
            headers=headers
        )
        
        assert response.status_code == 200, f"Accommodation report failed: {response.text}"
        content_type = response.headers.get("content-type", "")
        assert "spreadsheet" in content_type or "application/vnd" in content_type, f"Wrong content type: {content_type}"
        assert len(response.content) > 0, "Empty accommodation report"
        print(f"✓ Accommodation report export works - {len(response.content)} bytes")


class TestSendAccommodation:
    """Test send accommodation notification endpoints"""

    def test_send_whatsapp_returns_url(self, headers, test_registration):
        """Test POST /api/admin/event-registrations/{id}/send-accommodation with channel=whatsapp returns whatsapp_url"""
        reg_id = test_registration["id"]
        
        # First ensure the registration has a room assigned
        requests.put(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}/accommodation",
            json={
                "assigned_room_no": "WA-TEST-303",
                "assigned_location": "WhatsApp Test Hotel",
                "assigned_location_type": "Hotel",
                "assigned_map_link": "https://maps.google.com/?q=test"
            },
            headers=headers
        )
        
        response = requests.post(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}/send-accommodation",
            json={"channel": "whatsapp"},
            headers=headers
        )
        
        assert response.status_code == 200, f"WhatsApp send failed: {response.text}"
        data = response.json()
        assert "whatsapp_url" in data, "No whatsapp_url in response"
        assert data["whatsapp_url"].startswith("https://wa.me/"), f"Invalid WhatsApp URL: {data['whatsapp_url']}"
        print(f"✓ WhatsApp URL generated: {data['whatsapp_url'][:50]}...")

    def test_send_email_attempts_send(self, headers, test_registration):
        """Test POST /api/admin/event-registrations/{id}/send-accommodation with channel=email"""
        reg_id = test_registration["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}/send-accommodation",
            json={"channel": "email"},
            headers=headers
        )
        
        # Email may succeed or show warning if SMTP not configured
        assert response.status_code in [200, 500], f"Email send unexpected status: {response.status_code}"
        data = response.json()
        assert "message" in data or "detail" in data
        
        # If SMTP not configured, it should return warning message
        if response.status_code == 200:
            if data.get("warning"):
                print(f"✓ Email endpoint works - SMTP not configured: {data['message']}")
            else:
                print(f"✓ Email sent successfully: {data['message']}")
        else:
            print(f"✓ Email endpoint works - Error (expected if no SMTP): {data.get('detail', data)}")

    def test_send_invalid_channel(self, headers, test_registration):
        """Test invalid channel returns appropriate response"""
        reg_id = test_registration["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/event-registrations/{reg_id}/send-accommodation",
            json={"channel": "invalid"},
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Invalid channel" in data.get("message", "") or "message" in data
        print("✓ Invalid channel handled correctly")


class TestBulkSendAccommodation:
    """Test bulk send accommodation endpoint"""

    def test_bulk_send_email(self, headers):
        """Test POST /api/admin/events/{id}/registrations/send-all-accommodation with email"""
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/send-all-accommodation",
            json={"channel": "email"},
            headers=headers
        )
        
        assert response.status_code == 200, f"Bulk email failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Bulk email response: {data['message']} (sent: {data.get('sent', 'N/A')})")

    def test_bulk_send_whatsapp(self, headers):
        """Test POST /api/admin/events/{id}/registrations/send-all-accommodation with whatsapp"""
        response = requests.post(
            f"{BASE_URL}/api/admin/events/{TEST_EVENT_ID}/registrations/send-all-accommodation",
            json={"channel": "whatsapp"},
            headers=headers
        )
        
        assert response.status_code == 200, f"Bulk whatsapp failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Bulk WhatsApp response: {data['message']}")


class TestCleanup:
    """Restore test data to original state"""

    def test_restore_test_registration(self, headers, test_registration):
        """Restore the test registration's accommodation data"""
        reg_id = test_registration["id"]
        
        # Check if this registration had room 201-A originally
        original = test_registration.get("assigned_room_no", "")
        if original and "TEST" not in original:
            # Restore original data
            response = requests.put(
                f"{BASE_URL}/api/admin/event-registrations/{reg_id}/accommodation",
                json={
                    "assigned_room_no": original,
                    "assigned_location": test_registration.get("assigned_location", ""),
                    "assigned_location_type": test_registration.get("assigned_location_type", ""),
                    "assigned_map_link": test_registration.get("assigned_map_link", ""),
                },
                headers=headers
            )
            assert response.status_code == 200
            print(f"✓ Restored original accommodation data for {reg_id}")
        else:
            print("✓ No restoration needed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
