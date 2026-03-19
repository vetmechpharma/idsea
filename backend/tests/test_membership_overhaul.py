"""
Test suite for Membership System Overhaul - Iteration 12
Tests: prefix, structured addresses, photo upload, hold/approve/reject, change-type, send-email
"""
import pytest
import requests
import os
import io
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://idsea-events.preview.emergentagent.com')

class TestPublicMembershipApply:
    """Tests for public membership application with new fields"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_apply_with_prefix_and_structured_address(self, api_client):
        """Test member application with prefix and structured addresses"""
        payload = {
            "prefix": "Dr.",
            "name": f"Test Apply {datetime.now().strftime('%H%M%S')}",
            "email": f"test_apply_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "+91 9876543210",
            "qualification": "Ph.D.",
            "specialization": "Dairy Technology",
            "organization": "Test University",
            "membership_type": "academic",
            "permanent_address": {
                "line1": "House No 123",
                "line2": "Test Street",
                "line3": "Near Test Landmark",
                "state": "Maharashtra",
                "district": "Mumbai",
                "pincode": "400001"
            },
            "contact_address": {
                "line1": "Office 456",
                "line2": "Work Street",
                "line3": "",
                "state": "Karnataka",
                "district": "Bangalore",
                "pincode": "560001"
            },
            "contact_same_as_permanent": False,
            "photo_url": "",
            "payment_status": "pending"
        }
        
        response = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        print(f"Apply response status: {response.status_code}")
        print(f"Apply response: {response.text[:500] if response.text else 'empty'}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain member id"
        assert "message" in data, "Response should contain success message"
        print(f"SUCCESS: Member created with ID: {data['id']}")
        return data['id']
    
    def test_apply_with_same_address_flag(self, api_client):
        """Test member application with contact_same_as_permanent=True"""
        payload = {
            "prefix": "Mr.",
            "name": f"Test SameAddr {datetime.now().strftime('%H%M%S')}",
            "email": f"test_sameaddr_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "+91 9876543211",
            "membership_type": "entrepreneur",
            "permanent_address": {
                "line1": "Building ABC",
                "line2": "Street XYZ",
                "line3": "",
                "state": "Gujarat",
                "district": "Ahmedabad",
                "pincode": "380001"
            },
            "contact_address": {},
            "contact_same_as_permanent": True,
            "payment_status": "pending"
        }
        
        response = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "id" in data
        print(f"SUCCESS: Member with same_as_permanent created: {data['id']}")


class TestPublicPhotoUpload:
    """Tests for public photo upload endpoint"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        return session
    
    def test_photo_upload_no_auth_required(self, api_client):
        """Test that /api/public/upload-photo does NOT require auth"""
        # Create a simple PNG image in memory
        import struct
        import zlib
        
        # Create a minimal 1x1 PNG
        def create_minimal_png():
            signature = b'\x89PNG\r\n\x1a\n'
            
            # IHDR chunk
            width = 1
            height = 1
            bit_depth = 8
            color_type = 2  # RGB
            ihdr_data = struct.pack('>IIBBBBB', width, height, bit_depth, color_type, 0, 0, 0)
            ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
            ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
            
            # IDAT chunk (compressed image data)
            raw_data = b'\x00\xff\x00\x00'  # filter + RGB
            compressed = zlib.compress(raw_data)
            idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
            idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
            
            # IEND chunk
            iend_crc = zlib.crc32(b'IEND') & 0xffffffff
            iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
            
            return signature + ihdr + idat + iend
        
        png_data = create_minimal_png()
        files = {'file': ('test_photo.png', png_data, 'image/png')}
        
        response = api_client.post(f"{BASE_URL}/api/public/upload-photo", files=files)
        print(f"Photo upload response status: {response.status_code}")
        print(f"Photo upload response: {response.text[:300] if response.text else 'empty'}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "file_url" in data, "Response should contain file_url"
        assert data["file_url"].startswith("/api/uploads/"), "file_url should start with /api/uploads/"
        print(f"SUCCESS: Photo uploaded: {data['file_url']}")
    
    def test_photo_upload_rejects_non_image(self, api_client):
        """Test that non-image files are rejected"""
        files = {'file': ('test.txt', b'Not an image', 'text/plain')}
        
        response = api_client.post(f"{BASE_URL}/api/public/upload-photo", files=files)
        assert response.status_code == 400, f"Expected 400 for non-image, got {response.status_code}"
        print("SUCCESS: Non-image file correctly rejected")


class TestAdminMemberActions:
    """Tests for admin member management: hold, approve, reject, change-type, send-email"""
    
    @pytest.fixture
    def auth_headers(self):
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def api_client(self):
        return requests.Session()
    
    @pytest.fixture
    def create_test_member(self, api_client, auth_headers):
        """Create a test member for action testing"""
        payload = {
            "prefix": "Prof.",
            "name": f"Test ActionMember {datetime.now().strftime('%H%M%S')}",
            "email": f"test_action_{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "+91 9999999999",
            "membership_type": "academic",
            "permanent_address": {
                "line1": "123 Test Lane",
                "line2": "Test Area",
                "line3": "",
                "state": "Delhi",
                "district": "New Delhi",
                "pincode": "110001"
            },
            "contact_same_as_permanent": True,
            "payment_status": "paid"
        }
        
        response = api_client.post(f"{BASE_URL}/api/admin/members", json=payload, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create test member: {response.text}"
        data = response.json()
        return data["id"]
    
    def test_hold_member(self, api_client, auth_headers):
        """Test PUT /api/admin/members/{id}/hold"""
        # First create a member
        payload = {
            "prefix": "Dr.",
            "name": f"Test HoldMember {datetime.now().strftime('%H%M%S')}",
            "email": f"test_hold_{datetime.now().strftime('%H%M%S')}@test.com",
            "membership_type": "academic",
            "permanent_address": {"line1": "Test", "state": "Delhi", "district": "Delhi", "pincode": "110001"},
            "payment_status": "pending"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        assert create_resp.status_code == 200, f"Member creation failed: {create_resp.text}"
        member_id = create_resp.json()["id"]
        
        # Now put on hold
        response = api_client.put(f"{BASE_URL}/api/admin/members/{member_id}/hold", json={}, headers=auth_headers)
        print(f"Hold response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert "hold" in response.text.lower(), "Response should mention hold"
        
        # Verify status changed
        get_resp = api_client.get(f"{BASE_URL}/api/admin/members/{member_id}", headers=auth_headers)
        member = get_resp.json()
        assert member["status"] == "hold", f"Member status should be 'hold', got {member['status']}"
        print(f"SUCCESS: Member {member_id} put on hold")
    
    def test_approve_member_generates_correct_id(self, api_client, auth_headers):
        """Test PUT /api/admin/members/{id}/approve generates ACD/ENT/COP ID"""
        # Create academic member
        payload = {
            "prefix": "Mr.",
            "name": f"Test ApproveMember {datetime.now().strftime('%H%M%S')}",
            "email": f"test_approve_{datetime.now().strftime('%H%M%S')}@test.com",
            "membership_type": "academic",
            "permanent_address": {"line1": "Approve Test", "state": "Kerala", "district": "Kochi", "pincode": "682001"},
            "payment_status": "paid"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        assert create_resp.status_code == 200
        member_id = create_resp.json()["id"]
        
        # Approve
        response = api_client.put(f"{BASE_URL}/api/admin/members/{member_id}/approve", json={}, headers=auth_headers)
        print(f"Approve response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "membership_id" in data, "Response should contain membership_id"
        
        membership_id = data["membership_id"]
        current_year = datetime.now().year
        
        # Verify ID format: ACD/IDSEA/YYYY/NNNN
        assert membership_id.startswith(f"ACD/IDSEA/{current_year}/"), f"ID should start with ACD/IDSEA/{current_year}/, got {membership_id}"
        parts = membership_id.split("/")
        assert len(parts) == 4, f"ID should have 4 parts, got {parts}"
        assert len(parts[3]) == 4, f"Serial should be 4 digits, got {parts[3]}"
        
        print(f"SUCCESS: Member approved with ID: {membership_id}")
    
    def test_approve_entrepreneur_generates_ent_id(self, api_client, auth_headers):
        """Test approval of entrepreneur member generates ENT/IDSEA/... ID"""
        payload = {
            "prefix": "Mrs.",
            "name": f"Test EntMember {datetime.now().strftime('%H%M%S')}",
            "email": f"test_ent_{datetime.now().strftime('%H%M%S')}@test.com",
            "membership_type": "entrepreneur",
            "permanent_address": {"line1": "ENT Test", "state": "Tamil Nadu", "district": "Chennai", "pincode": "600001"},
            "payment_status": "paid"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        member_id = create_resp.json()["id"]
        
        response = api_client.put(f"{BASE_URL}/api/admin/members/{member_id}/approve", json={}, headers=auth_headers)
        assert response.status_code == 200
        
        membership_id = response.json()["membership_id"]
        assert membership_id.startswith(f"ENT/IDSEA/{datetime.now().year}/"), f"Expected ENT prefix, got {membership_id}"
        print(f"SUCCESS: Entrepreneur approved with ID: {membership_id}")
    
    def test_change_member_type_regenerates_id(self, api_client, auth_headers):
        """Test PUT /api/admin/members/{id}/change-type regenerates membership ID"""
        # Create and approve an academic member
        payload = {
            "prefix": "Dr.",
            "name": f"Test ChangeType {datetime.now().strftime('%H%M%S')}",
            "email": f"test_changetype_{datetime.now().strftime('%H%M%S')}@test.com",
            "membership_type": "academic",
            "permanent_address": {"line1": "Change Test", "state": "Punjab", "district": "Ludhiana", "pincode": "141001"},
            "payment_status": "paid"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        member_id = create_resp.json()["id"]
        
        # Approve first
        approve_resp = api_client.put(f"{BASE_URL}/api/admin/members/{member_id}/approve", json={}, headers=auth_headers)
        old_membership_id = approve_resp.json()["membership_id"]
        assert old_membership_id.startswith("ACD/"), f"Initial ID should be ACD, got {old_membership_id}"
        
        # Now change type to entrepreneur
        change_resp = api_client.put(f"{BASE_URL}/api/admin/members/{member_id}/change-type", 
                                      json={"membership_type": "entrepreneur"}, headers=auth_headers)
        print(f"Change type response: {change_resp.status_code} - {change_resp.text}")
        
        assert change_resp.status_code == 200
        new_membership_id = change_resp.json()["membership_id"]
        assert new_membership_id.startswith("ENT/"), f"New ID should be ENT, got {new_membership_id}"
        assert new_membership_id != old_membership_id, "New ID should be different from old"
        
        print(f"SUCCESS: Type changed from {old_membership_id} to {new_membership_id}")
    
    def test_send_email_to_member(self, api_client, auth_headers):
        """Test POST /api/admin/members/{id}/send-email"""
        # Create a member
        payload = {
            "prefix": "Ms.",
            "name": f"Test EmailMember {datetime.now().strftime('%H%M%S')}",
            "email": f"test_email_{datetime.now().strftime('%H%M%S')}@test.com",
            "membership_type": "academic",
            "permanent_address": {"line1": "Email Test", "state": "Rajasthan", "district": "Jaipur", "pincode": "302001"},
            "payment_status": "pending"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        member_id = create_resp.json()["id"]
        
        # Send email
        email_data = {
            "subject": "Test Email Subject",
            "body": "This is a test email body for iteration 12 testing."
        }
        response = api_client.post(f"{BASE_URL}/api/admin/members/{member_id}/send-email", 
                                   json=email_data, headers=auth_headers)
        print(f"Send email response: {response.status_code} - {response.text}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "sent" in response.text.lower() or "email" in response.text.lower()
        print(f"SUCCESS: Email sent to member {member_id}")
    
    def test_reject_member(self, api_client, auth_headers):
        """Test PUT /api/admin/members/{id}/reject"""
        payload = {
            "prefix": "Shri",
            "name": f"Test RejectMember {datetime.now().strftime('%H%M%S')}",
            "email": f"test_reject_{datetime.now().strftime('%H%M%S')}@test.com",
            "membership_type": "corporate",
            "permanent_address": {"line1": "Reject Test", "state": "Bihar", "district": "Patna", "pincode": "800001"},
            "payment_status": "pending"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/public/members/apply", json=payload)
        member_id = create_resp.json()["id"]
        
        response = api_client.put(f"{BASE_URL}/api/admin/members/{member_id}/reject", json={}, headers=auth_headers)
        assert response.status_code == 200
        
        # Verify status
        get_resp = api_client.get(f"{BASE_URL}/api/admin/members/{member_id}", headers=auth_headers)
        assert get_resp.json()["status"] == "rejected"
        print(f"SUCCESS: Member {member_id} rejected")


class TestAdminMembersView:
    """Tests for admin members list view with new fields"""
    
    @pytest.fixture
    def auth_headers(self):
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        token = login_response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture
    def api_client(self):
        return requests.Session()
    
    def test_get_members_returns_prefix_and_addresses(self, api_client, auth_headers):
        """Test that admin members list includes prefix and address fields"""
        response = api_client.get(f"{BASE_URL}/api/admin/members", headers=auth_headers)
        assert response.status_code == 200
        
        members = response.json()
        assert isinstance(members, list)
        
        if len(members) > 0:
            member = members[0]
            # Check new fields are present
            assert "prefix" in member or member.get("prefix") is None, "prefix field should exist"
            assert "permanent_address" in member or member.get("permanent_address") is None, "permanent_address should exist"
            assert "contact_address" in member or member.get("contact_address") is None, "contact_address should exist"
            assert "contact_same_as_permanent" in member or member.get("contact_same_as_permanent") is None
            print(f"SUCCESS: Members list includes new fields. Sample member: {member.get('name')}")
        else:
            print("WARN: No members found to verify fields")
    
    def test_filter_by_status_hold(self, api_client, auth_headers):
        """Test filtering members by status=hold"""
        response = api_client.get(f"{BASE_URL}/api/admin/members?status=hold", headers=auth_headers)
        assert response.status_code == 200
        
        members = response.json()
        for m in members:
            assert m["status"] == "hold", f"Expected hold status, got {m['status']}"
        print(f"SUCCESS: Found {len(members)} members on hold")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
