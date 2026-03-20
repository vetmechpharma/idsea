"""
Payment Gateway Tests - Iteration 19
Tests for:
1. create-order API accepts currency field (INR/USD)
2. payment-settings API returns expected configuration
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://registration-manager.preview.emergentagent.com').rstrip('/')

class TestPaymentGateway:
    """Test payment gateway API endpoints for international/domestic payments"""
    
    def test_payment_settings_returns_config(self):
        """Test that payment settings returns expected fields"""
        response = requests.get(f"{BASE_URL}/api/public/payment-settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify structure - should have razorpay_enabled, upi_ids, bank_accounts
        assert "razorpay_enabled" in data, "Missing razorpay_enabled field"
        print(f"Payment settings: razorpay_enabled={data.get('razorpay_enabled')}")
        print(f"Payment settings: upi_ids count={len(data.get('upi_ids', []))}")
        print(f"Payment settings: bank_accounts count={len(data.get('bank_accounts', []))}")
    
    def test_create_order_with_inr_currency(self):
        """Test create-order with INR currency (domestic)"""
        payload = {
            "amount": 1000,
            "currency": "INR",
            "member_id": "",
            "member_name": "Test User",
            "member_email": "test@example.com",
            "membership_type": "academic",
            "event_registration_id": "",
            "purpose": "membership"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "payment_id" in data, "Missing payment_id in response"
        assert "currency" in data, "Missing currency in response"
        assert data["currency"] == "INR", f"Expected INR, got {data['currency']}"
        assert "amount" in data, "Missing amount in response"
        assert data["amount"] == 1000, f"Expected 1000, got {data['amount']}"
        print(f"INR order created: payment_id={data.get('payment_id')}, razorpay_order_id={data.get('razorpay_order_id')}")
    
    def test_create_order_with_usd_currency(self):
        """Test create-order with USD currency (international)"""
        payload = {
            "amount": 100,
            "currency": "USD",
            "member_id": "",
            "member_name": "International User",
            "member_email": "intl@example.com",
            "membership_type": "",
            "event_registration_id": "",
            "purpose": "event_registration"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "payment_id" in data, "Missing payment_id in response"
        assert "currency" in data, "Missing currency in response"
        assert data["currency"] == "USD", f"Expected USD, got {data['currency']}"
        assert "amount" in data, "Missing amount in response"
        assert data["amount"] == 100, f"Expected 100, got {data['amount']}"
        print(f"USD order created: payment_id={data.get('payment_id')}, razorpay_order_id={data.get('razorpay_order_id')}")
    
    def test_create_order_default_currency_is_inr(self):
        """Test that create-order defaults to INR if currency not specified"""
        payload = {
            "amount": 500,
            "member_id": "",
            "member_name": "Default Currency User",
            "member_email": "default@example.com",
            "membership_type": "academic",
            "event_registration_id": "",
            "purpose": "membership"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Default should be INR
        assert data.get("currency") == "INR", f"Expected default INR, got {data.get('currency')}"
        print(f"Default currency order: currency={data.get('currency')}")


class TestEventRegistrationInfo:
    """Test event registration info API for fee tier and USD support"""
    
    def test_event_registration_info_exists(self):
        """Test that event registration info returns fee structure"""
        event_id = "a6d69db6-d6f8-4fb6-a707-14dc903f8bfc"
        response = requests.get(f"{BASE_URL}/api/public/events/{event_id}/registration-info")
        
        if response.status_code == 404:
            pytest.skip("Test event not found")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "fee_tiers" in data, "Missing fee_tiers in response"
        assert "membership_plans" in data, "Missing membership_plans in response"
        
        # Check fee tiers have international fees
        for tier in data.get("fee_tiers", []):
            fees = tier.get("fees", {})
            print(f"Fee tier {tier.get('name', 'unknown')}: {fees}")
            if "international" in fees:
                print(f"  International fee (USD): {fees['international']}")
        
        # Check membership plans have USD fees
        for plan in data.get("membership_plans", []):
            print(f"Plan {plan.get('key')}: INR={plan.get('fee_inr')}, USD={plan.get('fee_usd')}")
        
        print(f"Event supports additional_person_fee_usd: {data.get('additional_person_fee_usd', 'not set')}")


class TestPaymentModel:
    """Test Payment model accepts currency field"""
    
    def test_payment_model_currency_field_inr(self):
        """Verify INR currency is stored correctly in payment"""
        payload = {
            "amount": 2000,
            "currency": "INR",
            "member_id": "test-member-123",
            "member_name": "Test Member INR",
            "member_email": "testinr@example.com",
            "membership_type": "academic",
            "event_registration_id": "",
            "purpose": "membership"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # The API should return the currency used
        assert data.get("currency") == "INR"
        print(f"Payment with INR currency created successfully")
    
    def test_payment_model_currency_field_usd(self):
        """Verify USD currency is stored correctly in payment"""
        payload = {
            "amount": 150,
            "currency": "USD",
            "member_id": "",
            "member_name": "Test Intl User",
            "member_email": "testusd@example.com",
            "membership_type": "",
            "event_registration_id": "test-reg-456",
            "purpose": "event_registration"
        }
        response = requests.post(f"{BASE_URL}/api/payments/create-order", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # The API should return the currency used
        assert data.get("currency") == "USD"
        print(f"Payment with USD currency created successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
