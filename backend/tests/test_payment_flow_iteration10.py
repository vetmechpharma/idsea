"""
IDSEA Payment System E2E Tests - Iteration 10
Tests the complete payment flow including:
- Public payment settings API
- UPI QR code generation
- UTR submission (UPI and Bank Transfer)
- Admin payment settings management
- Admin payments listing
"""

import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com').rstrip('/')
EVENT_ID = "435435f4-774f-4a0f-95e1-1e423493c196"


@pytest.fixture(scope="module")
def admin_token():
    """Login as admin and return token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@idsea.org",
        "password": "Admin@123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin login failed")


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def generate_test_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


# =================== PUBLIC PAYMENT SETTINGS ===================

class TestPublicPaymentSettings:
    """Tests for public payment settings API"""
    
    def test_get_public_payment_settings(self, api_client):
        """GET /api/public/payment-settings returns bank accounts and UPI IDs"""
        response = api_client.get(f"{BASE_URL}/api/public/payment-settings")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "bank_accounts" in data
        assert "upi_ids" in data
        assert "razorpay_enabled" in data
        
        # Verify Razorpay is disabled (no keys configured)
        assert data["razorpay_enabled"] == False
        
        # Verify bank accounts exist
        assert len(data["bank_accounts"]) > 0
        bank = data["bank_accounts"][0]
        assert "bank_name" in bank
        assert "holder_name" in bank
        assert "account_no" in bank
        assert "ifsc" in bank
        
        # Verify UPI IDs exist
        assert len(data["upi_ids"]) > 0
        upi = data["upi_ids"][0]
        assert "upi_id" in upi


# =================== UPI QR GENERATION ===================

class TestUPIQRGeneration:
    """Tests for UPI QR code generation"""
    
    def test_generate_upi_qr(self, api_client):
        """GET /api/payments/upi-qr generates QR code with correct amount"""
        response = api_client.get(f"{BASE_URL}/api/payments/upi-qr?amount=4000&name=IDSEA")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "qr_image" in data
        assert "upi_url" in data
        assert "upi_id" in data
        assert "amount" in data
        
        # Verify QR image is base64 encoded
        assert data["qr_image"].startswith("data:image/png;base64,")
        
        # Verify UPI URL format
        assert "upi://pay" in data["upi_url"]
        assert "am=4000" in data["upi_url"]
        
        # Verify amount
        assert data["amount"] == 4000.0


# =================== UTR SUBMISSION ===================

class TestUTRSubmission:
    """Tests for UTR/reference number submission"""
    
    def test_submit_utr_upi(self, api_client):
        """POST /api/payments/submit-utr creates payment with verification_pending status"""
        test_id = generate_test_id()
        payload = {
            "utr_number": f"TEST_UPI_{test_id}",
            "payment_method": "upi",
            "amount": 4000,
            "name": f"UTR Test UPI {test_id}",
            "email": f"upitest{test_id}@test.com",
            "member_id": "",
            "membership_type": "",
            "event_registration_id": "",
            "purpose": "event_registration"
        }
        response = api_client.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "message" in data
        assert "payment" in data
        assert data["message"] == "Payment submitted for verification"
        
        # Verify payment details
        payment = data["payment"]
        assert payment["status"] == "verification_pending"
        assert payment["payment_method"] == "upi"
        assert payment["utr_number"] == f"TEST_UPI_{test_id}"
        assert payment["amount"] == 4000.0
    
    def test_submit_utr_bank_transfer(self, api_client):
        """POST /api/payments/submit-utr with bank_transfer method"""
        test_id = generate_test_id()
        payload = {
            "utr_number": f"TEST_BANK_{test_id}",
            "payment_method": "bank_transfer",
            "amount": 4000,
            "name": f"UTR Test Bank {test_id}",
            "email": f"banktest{test_id}@test.com",
            "member_id": "",
            "membership_type": "",
            "event_registration_id": "",
            "purpose": "event_registration"
        }
        response = api_client.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        payment = data["payment"]
        assert payment["status"] == "verification_pending"
        assert payment["payment_method"] == "bank_transfer"
    
    def test_submit_utr_empty_utr_rejected(self, api_client):
        """POST /api/payments/submit-utr with empty UTR is rejected"""
        payload = {
            "utr_number": "",
            "payment_method": "upi",
            "amount": 4000,
            "name": "Empty UTR Test",
            "email": "empty@test.com"
        }
        response = api_client.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 400
        assert "UTR number is required" in response.json().get("detail", "")


# =================== ADMIN PAYMENT SETTINGS ===================

class TestAdminPaymentSettings:
    """Tests for admin payment settings management"""
    
    def test_get_admin_payment_settings(self, api_client, admin_token):
        """GET /api/admin/payment-settings returns full settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(f"{BASE_URL}/api/admin/payment-settings", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "bank_accounts" in data
        assert "upi_ids" in data
        assert "razorpay_configured" in data
        
        # Verify Razorpay not configured
        assert data["razorpay_configured"] == False
    
    def test_get_admin_payment_settings_unauthorized(self, api_client):
        """GET /api/admin/payment-settings without auth returns 401/403"""
        response = api_client.get(f"{BASE_URL}/api/admin/payment-settings")
        assert response.status_code in [401, 403]


# =================== ADMIN PAYMENTS LIST ===================

class TestAdminPaymentsList:
    """Tests for admin payments listing"""
    
    def test_get_admin_payments(self, api_client, admin_token):
        """GET /api/admin/payments returns list of payments"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = api_client.get(f"{BASE_URL}/api/admin/payments", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a list
        assert isinstance(data, list)
        
        # Verify payment structure if any exist
        if len(data) > 0:
            payment = data[0]
            assert "id" in payment
            assert "amount" in payment
            assert "status" in payment
            assert "payment_method" in payment
    
    def test_get_admin_payments_unauthorized(self, api_client):
        """GET /api/admin/payments without auth returns 401/403"""
        response = api_client.get(f"{BASE_URL}/api/admin/payments")
        assert response.status_code in [401, 403]


# =================== EVENT REGISTRATION WITH PAYMENT ===================

class TestEventRegistrationPayment:
    """Tests for event registration that leads to payment"""
    
    def test_event_registration_info(self, api_client):
        """GET /api/public/events/{id}/registration-info returns fee info"""
        response = api_client.get(f"{BASE_URL}/api/public/events/{EVENT_ID}/registration-info")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "id" in data
        assert "title" in data
        assert "fee_tiers" in data
        assert "accommodation" in data
        assert "membership_fees" in data
        
        # Verify fee tiers exist
        assert len(data["fee_tiers"]) > 0
    
    def test_event_registration_creates_pending_payment(self, api_client):
        """POST /api/public/events/{id}/register creates registration with pending payment"""
        test_id = generate_test_id()
        payload = {
            "is_member": False,
            "member_id": "",
            "member_category": "",
            "name": f"Reg Test {test_id}",
            "email": f"regtest{test_id}@test.com",
            "phone": f"9876{test_id[:5]}",
            "qualification": "PhD",
            "organization": "Test Org",
            "state": "Tamil Nadu",
            "accommodation_choice": "default",
            "hotel_name": "",
            "wants_membership": False,
            "membership_type": "",
            "registration_fee": 3000,
            "accommodation_fee": 1000,
            "membership_fee": 0,
            "total_amount": 4000,
            "payment_mode": "offline"
        }
        response = api_client.post(f"{BASE_URL}/api/public/events/{EVENT_ID}/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "message" in data
        assert "registration" in data
        
        reg = data["registration"]
        assert reg["payment_status"] == "pending"
        assert reg["total_amount"] == 4000
        assert reg["name"] == f"Reg Test {test_id}"


# =================== PAYMENT ORDER CREATION ===================

class TestPaymentOrderCreation:
    """Tests for Razorpay order creation (even when not configured)"""
    
    def test_create_payment_order_without_razorpay(self, api_client):
        """POST /api/payments/create-order returns empty razorpay_order_id when not configured"""
        payload = {
            "amount": 5000,
            "currency": "INR",
            "member_id": "",
            "member_name": "Test User",
            "member_email": "test@example.com",
            "membership_type": "",
            "event_registration_id": "",
            "purpose": "event_registration"
        }
        response = api_client.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "payment_id" in data
        assert "razorpay_order_id" in data
        assert "amount" in data
        
        # Razorpay not configured, so order_id should be empty
        assert data["razorpay_order_id"] == ""


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
