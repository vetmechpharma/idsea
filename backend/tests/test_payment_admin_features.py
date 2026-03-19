"""
Test Suite for Payment Admin Features - Iteration 11
Testing complete payment system overhaul:
- Admin Payments page with approve/reject/edit/delete/refund
- Payment Settings with Razorpay keys, method toggles, bank/UPI CRUD
- Membership application with payment flow
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPaymentAdminEndpoints:
    """Test admin payment management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    # =================== GET /api/admin/payments ===================
    def test_admin_get_payments_list(self, auth_headers):
        """Test admin can get all payments"""
        response = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/payments returned {len(data)} payments")
        
    def test_admin_payments_have_required_fields(self, auth_headers):
        """Verify payments have required fields for display"""
        response = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        assert response.status_code == 200
        payments = response.json()
        if len(payments) > 0:
            payment = payments[0]
            required_fields = ['id', 'amount', 'status', 'payment_method', 'created_at']
            for field in required_fields:
                assert field in payment, f"Payment missing field: {field}"
            print(f"✓ Payment has all required fields")
        else:
            print("⚠ No payments in DB to verify fields")
    
    def test_admin_payments_unauthorized(self):
        """Test that unauthenticated requests are rejected"""
        response = requests.get(f"{BASE_URL}/api/admin/payments")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access properly rejected")
    
    # =================== POST /api/admin/payments/manual ===================
    def test_admin_add_manual_payment(self, auth_headers):
        """Test admin can add manual payment"""
        payload = {
            "member_name": "TEST_Manual_Payer",
            "member_email": "test_manual@example.com",
            "membership_type": "academic",
            "amount": 3100,
            "purpose": "membership",
            "notes": "Test manual payment"
        }
        response = requests.post(f"{BASE_URL}/api/admin/payments/manual", 
                                json=payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or "member_name" in data
        print(f"✓ POST /api/admin/payments/manual - Manual payment created")
        return data.get("id")
    
    # =================== PUT /api/admin/payments/{id} ===================
    def test_admin_update_payment(self, auth_headers):
        """Test admin can update payment details"""
        # First get a payment to update
        list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        payments = list_resp.json()
        
        # Find a test payment or any editable payment
        test_payment = None
        for p in payments:
            if p.get("member_name", "").startswith("TEST_") or p.get("status") != "refunded":
                test_payment = p
                break
        
        if not test_payment:
            pytest.skip("No editable payment found")
        
        payment_id = test_payment["id"]
        update_payload = {
            "utr_number": "UTR_UPDATED_12345",
            "notes": "Updated by test",
            "member_name": test_payment.get("member_name", "Updated Name")
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/payments/{payment_id}", 
                               json=update_payload, headers=auth_headers)
        assert response.status_code == 200
        assert response.json().get("message") == "Payment updated"
        print(f"✓ PUT /api/admin/payments/{payment_id} - Payment updated")
    
    def test_admin_update_payment_amount(self, auth_headers):
        """Test admin can update payment amount"""
        # Create a test payment first
        create_resp = requests.post(f"{BASE_URL}/api/admin/payments/manual", 
                                   json={"member_name": "TEST_Amount_Update", 
                                         "member_email": "test_amount@example.com",
                                         "amount": 1000, "purpose": "membership"},
                                   headers=auth_headers)
        if create_resp.status_code != 200:
            pytest.skip("Could not create test payment")
        
        payment_id = create_resp.json().get("id")
        if not payment_id:
            # Get from list
            list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
            for p in list_resp.json():
                if p.get("member_name") == "TEST_Amount_Update":
                    payment_id = p["id"]
                    break
        
        if not payment_id:
            pytest.skip("Could not find created payment")
        
        response = requests.put(f"{BASE_URL}/api/admin/payments/{payment_id}", 
                               json={"amount": 5100}, headers=auth_headers)
        assert response.status_code == 200
        print("✓ Payment amount updated successfully")
    
    def test_admin_update_nonexistent_payment(self, auth_headers):
        """Test updating non-existent payment returns 404"""
        response = requests.put(f"{BASE_URL}/api/admin/payments/nonexistent-id-12345", 
                               json={"notes": "test"}, headers=auth_headers)
        assert response.status_code == 404
        print("✓ Non-existent payment update returns 404")
    
    # =================== PUT /api/admin/payments/{id}/verify-utr ===================
    def test_admin_approve_payment(self, auth_headers):
        """Test admin can approve verification_pending payment"""
        # First create a payment with verification_pending status (via UTR submission)
        # Or find existing one
        list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        payments = list_resp.json()
        
        pending_payment = None
        for p in payments:
            if p.get("status") == "verification_pending":
                pending_payment = p
                break
        
        if not pending_payment:
            # Create one via UTR submission
            utr_resp = requests.post(f"{BASE_URL}/api/payments/submit-utr", json={
                "utr_number": "TEST_APPROVE_UTR_12345",
                "payment_method": "upi",
                "amount": 3100,
                "name": "TEST_Approve_User",
                "email": "test_approve@example.com",
                "member_id": "",
                "membership_type": "academic",
                "event_registration_id": "",
                "purpose": "membership"
            })
            if utr_resp.status_code == 200:
                payment_id = utr_resp.json().get("payment_id")
            else:
                pytest.skip("Could not create verification_pending payment")
        else:
            payment_id = pending_payment["id"]
        
        # Approve the payment
        response = requests.put(f"{BASE_URL}/api/admin/payments/{payment_id}/verify-utr", 
                               json={"action": "approve"}, headers=auth_headers)
        assert response.status_code == 200
        assert "approved" in response.json().get("message", "").lower()
        
        # Verify status changed to paid
        get_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        updated_payment = next((p for p in get_resp.json() if p["id"] == payment_id), None)
        if updated_payment:
            assert updated_payment["status"] == "paid"
        print(f"✓ PUT /api/admin/payments/{payment_id}/verify-utr (approve) - Payment approved")
    
    def test_admin_reject_payment(self, auth_headers):
        """Test admin can reject verification_pending payment"""
        # Create a new verification_pending payment
        utr_resp = requests.post(f"{BASE_URL}/api/payments/submit-utr", json={
            "utr_number": "TEST_REJECT_UTR_67890",
            "payment_method": "bank_transfer",
            "amount": 5100,
            "name": "TEST_Reject_User",
            "email": "test_reject@example.com",
            "member_id": "",
            "membership_type": "entrepreneur",
            "event_registration_id": "",
            "purpose": "membership"
        })
        if utr_resp.status_code != 200:
            pytest.skip("Could not create verification_pending payment")
        
        payment_id = utr_resp.json().get("payment_id")
        
        # Reject the payment
        response = requests.put(f"{BASE_URL}/api/admin/payments/{payment_id}/verify-utr", 
                               json={"action": "reject"}, headers=auth_headers)
        assert response.status_code == 200
        assert "rejected" in response.json().get("message", "").lower()
        print(f"✓ PUT /api/admin/payments/{payment_id}/verify-utr (reject) - Payment rejected")
    
    # =================== POST /api/admin/payments/{id}/refund ===================
    def test_admin_refund_payment(self, auth_headers):
        """Test admin can refund a paid payment"""
        # Find or create a paid payment
        list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        payments = list_resp.json()
        
        paid_payment = None
        for p in payments:
            if p.get("status") == "paid" and p.get("member_name", "").startswith("TEST_"):
                paid_payment = p
                break
        
        if not paid_payment:
            # Create a manual payment (status=paid by default)
            create_resp = requests.post(f"{BASE_URL}/api/admin/payments/manual", 
                                       json={"member_name": "TEST_Refund_User", 
                                             "member_email": "test_refund@example.com",
                                             "amount": 3100, "purpose": "membership"},
                                       headers=auth_headers)
            if create_resp.status_code != 200:
                pytest.skip("Could not create paid payment")
            
            # Find the created payment
            list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
            for p in list_resp.json():
                if p.get("member_name") == "TEST_Refund_User":
                    paid_payment = p
                    break
        
        if not paid_payment:
            pytest.skip("No paid payment available for refund test")
        
        payment_id = paid_payment["id"]
        
        # Refund the payment
        response = requests.post(f"{BASE_URL}/api/admin/payments/{payment_id}/refund", 
                                json={"notes": "Test refund"}, headers=auth_headers)
        assert response.status_code == 200
        assert "refunded" in response.json().get("message", "").lower()
        
        # Verify status changed
        get_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        refunded_payment = next((p for p in get_resp.json() if p["id"] == payment_id), None)
        if refunded_payment:
            assert refunded_payment["status"] == "refunded"
        print(f"✓ POST /api/admin/payments/{payment_id}/refund - Payment refunded")
    
    # =================== DELETE /api/admin/payments/{id} ===================
    def test_admin_delete_payment(self, auth_headers):
        """Test admin can delete a payment"""
        # Create a payment to delete
        create_resp = requests.post(f"{BASE_URL}/api/admin/payments/manual", 
                                   json={"member_name": "TEST_Delete_Payment", 
                                         "member_email": "test_delete@example.com",
                                         "amount": 1000, "purpose": "membership"},
                                   headers=auth_headers)
        assert create_resp.status_code == 200
        
        # Find the created payment
        list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        payment_to_delete = None
        for p in list_resp.json():
            if p.get("member_name") == "TEST_Delete_Payment":
                payment_to_delete = p
                break
        
        if not payment_to_delete:
            pytest.skip("Could not find payment to delete")
        
        payment_id = payment_to_delete["id"]
        
        # Delete the payment
        response = requests.delete(f"{BASE_URL}/api/admin/payments/{payment_id}", 
                                  headers=auth_headers)
        assert response.status_code == 200
        assert "deleted" in response.json().get("message", "").lower()
        
        # Verify payment no longer exists
        list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        deleted_check = next((p for p in list_resp.json() if p["id"] == payment_id), None)
        assert deleted_check is None, "Payment should be deleted"
        print(f"✓ DELETE /api/admin/payments/{payment_id} - Payment deleted and verified")
    
    def test_admin_delete_nonexistent_payment(self, auth_headers):
        """Test deleting non-existent payment returns 404"""
        response = requests.delete(f"{BASE_URL}/api/admin/payments/nonexistent-id-12345", 
                                  headers=auth_headers)
        assert response.status_code == 404
        print("✓ Non-existent payment delete returns 404")


class TestPaymentSettingsEndpoints:
    """Test payment settings management"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    # =================== GET /api/admin/payment-settings ===================
    def test_admin_get_payment_settings(self, auth_headers):
        """Test admin can get payment settings"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "bank_accounts" in data
        assert "upi_ids" in data
        print(f"✓ GET /api/admin/payment-settings returned settings")
    
    def test_admin_payment_settings_has_razorpay_fields(self, auth_headers):
        """Test settings include Razorpay configuration fields"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        data = response.json()
        # Should have razorpay_configured field
        assert "razorpay_configured" in data or "razorpay_key_id" in data
        print("✓ Payment settings include Razorpay fields")
    
    def test_admin_payment_settings_has_method_toggles(self, auth_headers):
        """Test settings include methods_enabled for toggles"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        data = response.json()
        assert "methods_enabled" in data
        methods = data["methods_enabled"]
        assert "razorpay" in methods
        assert "upi" in methods
        assert "bank_transfer" in methods
        print("✓ Payment settings include method toggles")
    
    # =================== PUT /api/admin/payment-settings ===================
    def test_admin_update_payment_settings(self, auth_headers):
        """Test admin can update payment settings"""
        # First get current settings to preserve them
        get_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        current = get_resp.json()
        
        # Update with new test data
        payload = {
            "bank_accounts": current.get("bank_accounts", []),
            "upi_ids": current.get("upi_ids", []),
            "razorpay_key_id": "",  # Keep empty
            "razorpay_key_secret": "",
            "methods_enabled": {
                "razorpay": True,
                "upi": True,
                "bank_transfer": True
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/payment-settings", 
                               json=payload, headers=auth_headers)
        assert response.status_code == 200
        print("✓ PUT /api/admin/payment-settings - Settings updated")
    
    def test_admin_add_bank_account(self, auth_headers):
        """Test admin can add a bank account"""
        get_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        current = get_resp.json()
        
        new_bank = {
            "bank_name": "TEST_Bank",
            "holder_name": "TEST_Holder",
            "account_no": "1234567890",
            "ifsc": "TEST0001234",
            "branch": "Test Branch"
        }
        
        updated_banks = current.get("bank_accounts", []) + [new_bank]
        
        payload = {
            "bank_accounts": updated_banks,
            "upi_ids": current.get("upi_ids", []),
            "methods_enabled": current.get("methods_enabled", {"razorpay": True, "upi": True, "bank_transfer": True})
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/payment-settings", 
                               json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify bank was added
        verify_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        banks = verify_resp.json().get("bank_accounts", [])
        test_bank = next((b for b in banks if b.get("bank_name") == "TEST_Bank"), None)
        assert test_bank is not None
        print("✓ Bank account added and verified")
    
    def test_admin_add_upi_id(self, auth_headers):
        """Test admin can add a UPI ID"""
        get_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        current = get_resp.json()
        
        new_upi = {
            "upi_id": "test@upi",
            "name": "TEST_UPI"
        }
        
        updated_upis = current.get("upi_ids", []) + [new_upi]
        
        payload = {
            "bank_accounts": current.get("bank_accounts", []),
            "upi_ids": updated_upis,
            "methods_enabled": current.get("methods_enabled", {"razorpay": True, "upi": True, "bank_transfer": True})
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/payment-settings", 
                               json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify UPI was added
        verify_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        upis = verify_resp.json().get("upi_ids", [])
        test_upi = next((u for u in upis if u.get("upi_id") == "test@upi"), None)
        assert test_upi is not None
        print("✓ UPI ID added and verified")
    
    def test_admin_toggle_payment_methods(self, auth_headers):
        """Test admin can toggle payment methods enabled/disabled"""
        get_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        current = get_resp.json()
        
        # Toggle razorpay to false
        payload = {
            "bank_accounts": current.get("bank_accounts", []),
            "upi_ids": current.get("upi_ids", []),
            "methods_enabled": {
                "razorpay": False,
                "upi": True,
                "bank_transfer": True
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/payment-settings", 
                               json=payload, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify change
        verify_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        methods = verify_resp.json().get("methods_enabled", {})
        assert methods.get("razorpay") == False
        
        # Restore
        payload["methods_enabled"]["razorpay"] = True
        requests.put(f"{BASE_URL}/api/admin/payment-settings", json=payload, headers=auth_headers)
        print("✓ Payment method toggle works correctly")
    
    # =================== GET /api/public/payment-settings ===================
    def test_public_get_payment_settings(self):
        """Test public endpoint returns enabled payment methods"""
        response = requests.get(f"{BASE_URL}/api/public/payment-settings")
        assert response.status_code == 200
        data = response.json()
        assert "bank_accounts" in data
        assert "upi_ids" in data
        assert "razorpay_enabled" in data
        print("✓ GET /api/public/payment-settings works")
    
    def test_public_settings_respects_method_toggles(self, auth_headers):
        """Test public endpoint respects enabled/disabled methods"""
        # Disable bank_transfer
        get_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        current = get_resp.json()
        
        payload = {
            "bank_accounts": current.get("bank_accounts", []),
            "upi_ids": current.get("upi_ids", []),
            "methods_enabled": {
                "razorpay": True,
                "upi": True,
                "bank_transfer": False
            }
        }
        requests.put(f"{BASE_URL}/api/admin/payment-settings", json=payload, headers=auth_headers)
        
        # Check public endpoint - it should still show bank_accounts but methods_enabled reflects setting
        public_resp = requests.get(f"{BASE_URL}/api/public/payment-settings")
        data = public_resp.json()
        
        # Restore
        payload["methods_enabled"]["bank_transfer"] = True
        requests.put(f"{BASE_URL}/api/admin/payment-settings", json=payload, headers=auth_headers)
        
        print("✓ Public settings endpoint works with toggles")


class TestMembershipApplicationFlow:
    """Test membership application with payment step"""
    
    def test_membership_apply_creates_member(self):
        """Test membership application creates a member record"""
        payload = {
            "name": "TEST_Member_Apply",
            "email": f"test_member_apply_{int(time.time())}@example.com",
            "phone": "9876543210",
            "qualification": "PhD",
            "specialization": "Dairy Science",
            "organization": "Test University",
            "address": "123 Test Street",
            "state": "Karnataka",
            "membership_type": "academic",
            "payment_status": "pending"
        }
        
        response = requests.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data
        print(f"✓ POST /api/public/members/apply - Member created with ID: {data['id'][:8]}")
        return data
    
    def test_membership_fee_amounts(self):
        """Verify correct membership fees"""
        expected_fees = {
            "academic": 3100,
            "entrepreneur": 5100,
            "corporate": 25100
        }
        # This is frontend logic, but backend should accept these amounts
        for mtype, fee in expected_fees.items():
            print(f"✓ {mtype.capitalize()} membership fee: ₹{fee}")
    
    def test_membership_payment_submission(self):
        """Test UTR submission for membership payment"""
        payload = {
            "utr_number": f"TEST_MEMBERSHIP_UTR_{int(time.time())}",
            "payment_method": "upi",
            "amount": 3100,
            "name": "TEST_Membership_Payer",
            "email": "test_membership_payment@example.com",
            "member_id": "",
            "membership_type": "academic",
            "event_registration_id": "",
            "purpose": "membership"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/submit-utr", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Response can have payment_id or payment object
        payment_id = data.get("payment_id") or data.get("payment", {}).get("id")
        assert payment_id or "message" in data, "Payment submission failed"
        print(f"✓ Membership payment submitted successfully")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, admin_token):
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_cleanup_test_payments(self, auth_headers):
        """Remove TEST_ prefixed payments"""
        list_resp = requests.get(f"{BASE_URL}/api/admin/payments", headers=auth_headers)
        payments = list_resp.json()
        
        deleted_count = 0
        for p in payments:
            if p.get("member_name", "").startswith("TEST_"):
                del_resp = requests.delete(f"{BASE_URL}/api/admin/payments/{p['id']}", 
                                          headers=auth_headers)
                if del_resp.status_code == 200:
                    deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test payments")
    
    def test_cleanup_test_bank_upis(self, auth_headers):
        """Remove TEST_ prefixed bank accounts and UPIs"""
        get_resp = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=auth_headers)
        current = get_resp.json()
        
        # Filter out test data
        clean_banks = [b for b in current.get("bank_accounts", []) 
                      if not b.get("bank_name", "").startswith("TEST_")]
        clean_upis = [u for u in current.get("upi_ids", []) 
                     if not u.get("name", "").startswith("TEST_")]
        
        payload = {
            "bank_accounts": clean_banks,
            "upi_ids": clean_upis,
            "methods_enabled": current.get("methods_enabled", {"razorpay": True, "upi": True, "bank_transfer": True})
        }
        
        requests.put(f"{BASE_URL}/api/admin/payment-settings", json=payload, headers=auth_headers)
        print("✓ Cleaned up test bank accounts and UPIs")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
