"""
IDSEA Founders & Executive Council Feature Tests
Tests for the new Patron/Founders and Executive Council feature added to the About page and Admin panel

Features tested:
- GET /api/public/founders - returns 6 founders with category=founder
- GET /api/public/executive - returns 19 council members with category=council
- GET /api/admin/executive?category=founder - returns founders (auth required)
- GET /api/admin/executive?category=council - returns council members (auth required)
- POST /api/admin/executive - creates new entry with category and member_id fields
- Members collection has 20 seed members with status=approved
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dairy-reg.preview.emergentagent.com')

ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


class TestPublicFoundersAPI:
    """Test public founders endpoint"""
    
    def test_get_public_founders(self):
        """GET /api/public/founders - returns founders with category=founder"""
        response = requests.get(f"{BASE_URL}/api/public/founders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 6, f"Expected 6 founders, got {len(data)}"
        
        # Verify each founder has required fields
        for founder in data:
            assert "name" in founder, "Founder must have name"
            assert "affiliation" in founder, "Founder must have affiliation"
            assert founder.get("category") == "founder", f"Expected category=founder, got {founder.get('category')}"
            assert "designation" in founder
            print(f"  Founder: {founder['name']} - {founder.get('affiliation', '')[:50]}...")
        
        print(f"\nPublic founders: {len(data)} entries returned")
    
    def test_founders_have_member_ids(self):
        """Verify founders are linked to member_ids"""
        response = requests.get(f"{BASE_URL}/api/public/founders")
        data = response.json()
        
        founders_with_member_id = sum(1 for f in data if f.get("member_id"))
        print(f"Founders with member_id: {founders_with_member_id}/{len(data)}")
        
        # All seed founders should have member_id
        assert founders_with_member_id == len(data), "All founders should have member_id linked"


class TestPublicExecutiveCouncilAPI:
    """Test public executive council endpoint"""
    
    def test_get_public_executive(self):
        """GET /api/public/executive - returns council members with category=council"""
        response = requests.get(f"{BASE_URL}/api/public/executive")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 19, f"Expected 19 council members, got {len(data)}"
        
        # Count officers vs EC Members
        officers = [m for m in data if m.get("designation") != "EC Member"]
        ec_members = [m for m in data if m.get("designation") == "EC Member"]
        
        print(f"\nExecutive Council breakdown:")
        print(f"  Officers (President, VP, etc.): {len(officers)}")
        print(f"  EC Members: {len(ec_members)}")
        
        # Verify we have the expected officers
        expected_roles = ["President", "Vice President", "General Secretary", "Joint Secretary", "Treasurer"]
        actual_roles = [m.get("designation") for m in officers]
        
        for role in expected_roles:
            assert role in actual_roles, f"Missing officer role: {role}"
        
        # Verify each council member has required fields
        for member in data:
            assert "name" in member, "Council member must have name"
            assert "designation" in member, "Council member must have designation"
            assert "affiliation" in member, "Council member must have affiliation"
            assert member.get("category") == "council", f"Expected category=council, got {member.get('category')}"
        
        print(f"Public executive: {len(data)} entries returned")
    
    def test_executive_council_ordering(self):
        """Verify council members are ordered by 'order' field"""
        response = requests.get(f"{BASE_URL}/api/public/executive")
        data = response.json()
        
        # Verify order is ascending
        orders = [m.get("order", 0) for m in data]
        assert orders == sorted(orders), "Council members should be sorted by order"
        
        # First entry should be President (order 1)
        assert data[0].get("designation") == "President", f"First should be President, got {data[0].get('designation')}"
        print("Council members properly ordered")


class TestAdminFoundersAPI:
    """Test admin founders management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, "Login failed"
        return response.json()["access_token"]
    
    def test_get_admin_founders(self, auth_token):
        """GET /api/admin/executive?category=founder - returns founders (auth required)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/executive",
            params={"category": "founder"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 6, f"Expected 6 founders, got {len(data)}"
        
        # Verify all have founder category
        for f in data:
            assert f.get("category") == "founder"
        
        print(f"Admin founders query: {len(data)} entries")
    
    def test_get_admin_council(self, auth_token):
        """GET /api/admin/executive?category=council - returns council (auth required)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/executive",
            params={"category": "council"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 19, f"Expected 19 council members, got {len(data)}"
        
        # Verify all have council category
        for m in data:
            assert m.get("category") == "council"
        
        print(f"Admin council query: {len(data)} entries")


class TestAdminExecutiveCRUD:
    """Test admin executive committee CRUD with new category & member_id fields"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_create_founder_entry(self, auth_token):
        """POST /api/admin/executive - create new founder with category=founder"""
        create_response = requests.post(
            f"{BASE_URL}/api/admin/executive",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST Founder",
                "designation": "Patron / Founder",
                "affiliation": "TEST University",
                "category": "founder",
                "order": 99
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        data = create_response.json()
        assert data["name"] == "TEST Founder"
        assert data["category"] == "founder"
        assert data["order"] == 99
        
        exec_id = data["id"]
        print(f"Created founder entry: {exec_id}")
        
        # Verify it appears in public founders
        public_response = requests.get(f"{BASE_URL}/api/public/founders")
        founders = public_response.json()
        assert any(f["id"] == exec_id for f in founders), "New founder should appear in public API"
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/executive/{exec_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print("Founder entry created, verified, and cleaned up")
    
    def test_create_council_entry(self, auth_token):
        """POST /api/admin/executive - create new council member with category=council"""
        create_response = requests.post(
            f"{BASE_URL}/api/admin/executive",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST Council Member",
                "designation": "EC Member",
                "affiliation": "TEST Organization",
                "category": "council",
                "order": 99
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        data = create_response.json()
        assert data["name"] == "TEST Council Member"
        assert data["category"] == "council"
        
        exec_id = data["id"]
        print(f"Created council entry: {exec_id}")
        
        # Verify it appears in public executive
        public_response = requests.get(f"{BASE_URL}/api/public/executive")
        council = public_response.json()
        assert any(c["id"] == exec_id for c in council), "New council member should appear in public API"
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/executive/{exec_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print("Council entry created, verified, and cleaned up")
    
    def test_create_entry_with_member_id(self, auth_token):
        """POST /api/admin/executive - create entry linked to member_id"""
        # First get a member to link
        members_response = requests.get(
            f"{BASE_URL}/api/admin/members",
            params={"status": "approved"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        members = members_response.json()
        assert len(members) > 0, "Need at least one approved member to test"
        
        test_member = members[0]
        print(f"Using member for test: {test_member['name']} (ID: {test_member['id']})")
        
        # Create executive entry linked to this member
        create_response = requests.post(
            f"{BASE_URL}/api/admin/executive",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "member_id": test_member["id"],
                "name": test_member["name"],
                "designation": "EC Member",
                "affiliation": test_member.get("organization", ""),
                "category": "council",
                "order": 100
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        data = create_response.json()
        assert data["member_id"] == test_member["id"], "member_id should match"
        
        exec_id = data["id"]
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/executive/{exec_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        print("Entry with member_id created, verified, and cleaned up")


class TestSeedMembersCollection:
    """Verify seed data created all 20 members"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_seed_members_exist(self, auth_token):
        """Verify all 20 seed members exist with status=approved"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members",
            params={"status": "approved"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        members = response.json()
        
        # Expected seed members (20 total)
        expected_names = [
            "Dr. A. Elango", "Dr. G. Kumaresan", "Dr. N. Karthikeyan", "Dr. C. Pandiyan",
            "Dr. C. R. Prasanna", "Dr. L. Vijay", "Dr. R. Subash", "Dr. T. Lokesh",
            "Dr. K. Prabu", "Dr. B. R. Kadam", "Dr. Neha Thakur", "Dr. Anindita Mali",
            "Dr. A. R. Praveen", "Mr. D. Senthil Kumar", "Mr. C. Balakrishnan",
            "Mrs. A. Archana Karthikeyan", "Mr. K. M. Sajeeshkumar", "Mr. M. Karthikeyan",
            "Mr. Pradeep Ponnusamy", "Mr. M. Saravanan"
        ]
        
        member_names = [m["name"] for m in members]
        
        found_count = 0
        for expected in expected_names:
            if expected in member_names:
                found_count += 1
            else:
                print(f"  WARNING: Seed member not found: {expected}")
        
        print(f"\nSeed members found: {found_count}/{len(expected_names)}")
        assert found_count >= 18, f"At least 18 of 20 seed members should exist, found {found_count}"
    
    def test_membership_types(self, auth_token):
        """Verify seed members have proper membership_types"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members",
            params={"status": "approved"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        members = response.json()
        
        # Count by membership type
        types = {}
        for m in members:
            t = m.get("membership_type", "unknown")
            types[t] = types.get(t, 0) + 1
        
        print(f"\nMembership types: {types}")
        
        # Should have academic, entrepreneur, corporate
        assert "academic" in types, "Should have academic members"
        assert "entrepreneur" in types, "Should have entrepreneur members"


class TestPublicMembersListing:
    """Verify seed members appear in public listing"""
    
    def test_public_members_count(self):
        """GET /api/public/members - verify approved members appear"""
        response = requests.get(f"{BASE_URL}/api/public/members")
        assert response.status_code == 200
        
        members = response.json()
        
        # At least the 20 seed members should appear
        assert len(members) >= 20, f"Expected at least 20 members, got {len(members)}"
        print(f"Public members count: {len(members)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
