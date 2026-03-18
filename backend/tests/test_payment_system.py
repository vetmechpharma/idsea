"""
Test suite for IDSEA Payment System
Tests: Payment settings, UPI QR generation, UTR submission, admin verification
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


class TestPublicPaymentAPIs:
    """Tests for public payment endpoints (no auth required)"""
    
    def test_public_payment_settings(self):
        """GET /api/public/payment-settings - returns bank accounts, UPI IDs, razorpay status"""
        response = requests.get(f"{BASE_URL}/api/public/payment-settings")
        assert response.status_code == 200
        
        data = response.json()
        assert "bank_accounts" in data
        assert "upi_ids" in data
        assert "razorpay_enabled" in data
        
        # Verify bank account data is present
        assert isinstance(data["bank_accounts"], list)
        assert len(data["bank_accounts"]) > 0, "Bank accounts should be configured"
        bank = data["bank_accounts"][0]
        assert "bank_name" in bank
        assert "account_no" in bank
        assert "ifsc" in bank
        
        # Verify UPI ID data is present
        assert isinstance(data["upi_ids"], list)
        assert len(data["upi_ids"]) > 0, "UPI IDs should be configured"
        upi = data["upi_ids"][0]
        assert "upi_id" in upi
        assert upi["upi_id"] == "idsea@sbi"
        
        # Razorpay should NOT be enabled (empty keys)
        assert data["razorpay_enabled"] == False
        print("PASSED: Public payment settings returns correct data")

    def test_upi_qr_generation(self):
        """GET /api/payments/upi-qr - generates UPI QR code"""
        response = requests.get(f"{BASE_URL}/api/payments/upi-qr?amount=5000&name=IDSEA")
        assert response.status_code == 200
        
        data = response.json()
        assert "qr_image" in data
        assert "upi_url" in data
        assert "upi_id" in data
        assert "amount" in data
        
        # Verify QR image is base64 PNG
        assert data["qr_image"].startswith("data:image/png;base64,")
        
        # Verify UPI URL format
        assert data["upi_url"].startswith("upi://pay?pa=")
        assert "idsea@sbi" in data["upi_url"]
        assert "5000" in data["upi_url"]
        
        # Verify correct UPI ID and amount returned
        assert data["upi_id"] == "idsea@sbi"
        assert data["amount"] == 5000.0
        print("PASSED: UPI QR code generation works correctly")

    def test_upi_qr_different_amounts(self):
        """Test UPI QR code with different amounts"""
        amounts = [1000, 2500, 15000]
        for amount in amounts:
            response = requests.get(f"{BASE_URL}/api/payments/upi-qr?amount={amount}&name=Test")
            assert response.status_code == 200
            data = response.json()
            assert data["amount"] == float(amount)
            assert str(amount) in data["upi_url"]
        print("PASSED: UPI QR works with different amounts")


class TestUTRSubmission:
    """Tests for UTR submission endpoint"""
    
    def test_submit_utr_success(self):
        """POST /api/payments/submit-utr - submit UTR payment reference"""
        utr_number = f"TEST_UTR_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "utr_number": utr_number,
            "payment_method": "upi",
            "amount": 5000,
            "purpose": "event_registration",
            "name": "Test User",
            "email": "testpayment@example.com",
            "event_registration_id": ""
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert data["message"] == "Payment submitted for verification"
        assert "payment" in data
        
        payment = data["payment"]
        assert payment["utr_number"] == utr_number
        assert payment["status"] == "verification_pending"
        assert payment["amount"] == 5000
        assert payment["payment_method"] == "upi"
        print(f"PASSED: UTR submission created payment with ID {payment['id']}")
        return payment["id"]

    def test_submit_utr_bank_transfer(self):
        """Test UTR submission for bank transfer"""
        utr_number = f"TEST_BANK_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "utr_number": utr_number,
            "payment_method": "bank_transfer",
            "amount": 3500,
            "purpose": "membership",
            "name": "Bank Test User",
            "email": "banktest@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        payment = data["payment"]
        assert payment["payment_method"] == "bank_transfer"
        assert payment["status"] == "verification_pending"
        print("PASSED: Bank transfer UTR submission works")

    def test_submit_utr_missing_utr_number(self):
        """Test UTR submission without UTR number fails"""
        payload = {
            "utr_number": "",
            "payment_method": "upi",
            "amount": 5000
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "detail" in data
        assert "UTR" in data["detail"]
        print("PASSED: Empty UTR number correctly rejected")


class TestAdminPaymentSettings:
    """Tests for admin payment settings endpoints (auth required)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_get_payment_settings(self):
        """GET /api/admin/payment-settings - returns full settings with razorpay status"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "bank_accounts" in data
        assert "upi_ids" in data
        assert "razorpay_configured" in data
        
        # Admin endpoint should show more details
        assert isinstance(data["bank_accounts"], list)
        assert isinstance(data["upi_ids"], list)
        
        # Razorpay not configured (empty env vars)
        assert data["razorpay_configured"] == False
        print("PASSED: Admin payment settings retrieval works")

    def test_admin_update_payment_settings(self):
        """PUT /api/admin/payment-settings - update bank accounts and UPI IDs"""
        # Get current settings first
        get_response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=self.headers)
        current = get_response.json()
        
        # Add a test bank account
        new_bank = {
            "bank_name": "TEST_Bank",
            "holder_name": "TEST_Holder",
            "account_no": "999999999",
            "ifsc": "TEST0001234",
            "branch": "Test Branch"
        }
        
        updated_banks = current.get("bank_accounts", []) + [new_bank]
        
        payload = {
            "bank_accounts": updated_banks,
            "upi_ids": current.get("upi_ids", [])
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/payment-settings", json=payload, headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Payment settings updated"
        
        # Verify by getting settings again
        verify_response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=self.headers)
        verify_data = verify_response.json()
        
        bank_names = [b["bank_name"] for b in verify_data["bank_accounts"]]
        assert "TEST_Bank" in bank_names
        
        # Cleanup - remove test bank
        clean_banks = [b for b in verify_data["bank_accounts"] if b["bank_name"] != "TEST_Bank"]
        requests.put(f"{BASE_URL}/api/admin/payment-settings", json={
            "bank_accounts": clean_banks,
            "upi_ids": verify_data["upi_ids"]
        }, headers=self.headers)
        
        print("PASSED: Admin can update payment settings")

    def test_admin_get_all_payments(self):
        """GET /api/admin/payments - lists all payment records"""
        response = requests.get(f"{BASE_URL}/api/admin/payments", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"PASSED: Admin payments list returns {len(data)} payments")


class TestAdminUTRVerification:
    """Tests for admin UTR verification endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and create a test payment"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_verify_utr_approve(self):
        """PUT /api/admin/payments/{payment_id}/verify-utr - approve UTR payment"""
        # First create a test payment
        utr_number = f"TEST_VERIFY_{uuid.uuid4().hex[:8].upper()}"
        submit_response = requests.post(f"{BASE_URL}/api/payments/submit-utr", json={
            "utr_number": utr_number,
            "payment_method": "upi",
            "amount": 1000,
            "name": "Verify Test",
            "email": "verifytest@example.com"
        })
        assert submit_response.status_code == 200
        payment_id = submit_response.json()["payment"]["id"]
        
        # Approve the payment
        response = requests.put(
            f"{BASE_URL}/api/admin/payments/{payment_id}/verify-utr",
            json={"action": "approve"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Payment approved"
        print(f"PASSED: UTR payment {payment_id} approved successfully")

    def test_verify_utr_reject(self):
        """PUT /api/admin/payments/{payment_id}/verify-utr - reject UTR payment"""
        # First create a test payment
        utr_number = f"TEST_REJECT_{uuid.uuid4().hex[:8].upper()}"
        submit_response = requests.post(f"{BASE_URL}/api/payments/submit-utr", json={
            "utr_number": utr_number,
            "payment_method": "bank_transfer",
            "amount": 2000,
            "name": "Reject Test",
            "email": "rejecttest@example.com"
        })
        assert submit_response.status_code == 200
        payment_id = submit_response.json()["payment"]["id"]
        
        # Reject the payment
        response = requests.put(
            f"{BASE_URL}/api/admin/payments/{payment_id}/verify-utr",
            json={"action": "reject"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Payment rejected"
        print(f"PASSED: UTR payment {payment_id} rejected successfully")

    def test_verify_utr_not_found(self):
        """Test verify-utr with non-existent payment ID"""
        fake_id = f"fake-payment-{uuid.uuid4()}"
        response = requests.put(
            f"{BASE_URL}/api/admin/payments/{fake_id}/verify-utr",
            json={"action": "approve"},
            headers=self.headers
        )
        assert response.status_code == 404
        print("PASSED: Non-existent payment returns 404")


class TestCreatePaymentOrder:
    """Tests for Razorpay create-order endpoint"""
    
    def test_create_order_without_razorpay(self):
        """POST /api/payments/create-order - should work but without razorpay_order_id"""
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
        
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "payment_id" in data
        assert "razorpay_order_id" in data
        assert "amount" in data
        
        # Razorpay not configured, so order_id should be empty
        assert data["razorpay_order_id"] == ""
        assert data["amount"] == 5000
        print("PASSED: Create order works (Razorpay not configured - empty order_id)")


class TestEventWithPaymentSettings:
    """Test that events are available for registration with payment"""
    
    def test_get_events_with_registration(self):
        """Verify events are available for payment flow testing"""
        response = requests.get(f"{BASE_URL}/api/public/events")
        assert response.status_code == 200
        
        events = response.json()
        assert isinstance(events, list)
        assert len(events) > 0
        
        # Find event with registration enabled
        reg_events = [e for e in events if e.get("registration_enabled")]
        assert len(reg_events) > 0, "At least one event should have registration enabled"
        
        event = reg_events[0]
        print(f"PASSED: Found event for registration: {event['title']} (ID: {event['id']})")
        return event["id"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
