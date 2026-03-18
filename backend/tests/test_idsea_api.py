"""
IDSEA Backend API Tests
Tests for authentication, public endpoints, and admin CRUD operations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://idsea-events.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@idsea.org"
ADMIN_PASSWORD = "Admin@123"


class TestPublicEndpoints:
    """Public API endpoints (no auth required)"""
    
    def test_public_stats(self):
        """GET /api/public/stats - should return site statistics"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_members" in data
        assert "total_events" in data
        assert "total_publications" in data
        assert "upcoming_events" in data
        print(f"Public stats: {data}")
    
    def test_public_members(self):
        """GET /api/public/members - should return approved members"""
        response = requests.get(f"{BASE_URL}/api/public/members")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Public members count: {len(data)}")
    
    def test_public_events(self):
        """GET /api/public/events - should return events list"""
        response = requests.get(f"{BASE_URL}/api/public/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Public events count: {len(data)}")
    
    def test_public_news(self):
        """GET /api/public/news - should return published news"""
        response = requests.get(f"{BASE_URL}/api/public/news")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Public news count: {len(data)}")
    
    def test_public_publications(self):
        """GET /api/public/publications - should return publications"""
        response = requests.get(f"{BASE_URL}/api/public/publications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Publications count: {len(data)}")
    
    def test_public_gallery(self):
        """GET /api/public/gallery - should return gallery albums"""
        response = requests.get(f"{BASE_URL}/api/public/gallery")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Gallery albums count: {len(data)}")
    
    def test_public_executive(self):
        """GET /api/public/executive - should return executive committee members"""
        response = requests.get(f"{BASE_URL}/api/public/executive")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # seeded data has 5 members
        print(f"Executive committee members: {len(data)}")
    
    def test_public_cms(self):
        """GET /api/public/cms - should return CMS settings"""
        response = requests.get(f"{BASE_URL}/api/public/cms")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Check seeded CMS fields
        assert "website_name" in data or "hero_title" in data
        print(f"CMS settings keys: {list(data.keys())}")


class TestAuthEndpoints:
    """Authentication endpoints"""
    
    def test_login_success(self):
        """POST /api/auth/login - valid credentials should return token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        assert data["token_type"] == "bearer"
        print(f"Login successful, admin: {data['admin']['username']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Invalid login response: {data}")
    
    def test_auth_me(self):
        """GET /api/auth/me - authenticated request should return admin info"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Get current admin
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"Auth me: {data}")


class TestAdminMembersCRUD:
    """Admin members management CRUD operations"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_members(self, auth_token):
        """GET /api/admin/members - should return all members"""
        response = requests.get(f"{BASE_URL}/api/admin/members", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin members count: {len(data)}")
    
    def test_create_member(self, auth_token):
        """POST /api/admin/members - should create new member"""
        unique_email = f"TEST_member_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/admin/members", 
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST Member",
                "email": unique_email,
                "membership_type": "academic",
                "qualification": "PhD",
                "organization": "Test University",
                "state": "Tamil Nadu"
            })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST Member"
        assert data["email"] == unique_email
        assert data["status"] == "approved"  # Admin-created members are auto-approved
        assert "membership_id" in data
        print(f"Created member: {data['name']} - {data['membership_id']}")
        return data["id"]
    
    def test_member_crud_flow(self, auth_token):
        """Full CRUD flow: Create -> Read -> Update -> Delete"""
        # CREATE
        unique_email = f"TEST_crud_{uuid.uuid4().hex[:8]}@test.com"
        create_response = requests.post(f"{BASE_URL}/api/admin/members",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST CRUD Member",
                "email": unique_email,
                "membership_type": "entrepreneur",
                "phone": "9876543210"
            })
        assert create_response.status_code == 200
        member_id = create_response.json()["id"]
        print(f"Created: {member_id}")
        
        # READ
        get_response = requests.get(f"{BASE_URL}/api/admin/members/{member_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "TEST CRUD Member"
        print("Read: verified")
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/admin/members/{member_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "TEST CRUD Member Updated"})
        assert update_response.status_code == 200
        print("Updated")
        
        # Verify update
        verify_response = requests.get(f"{BASE_URL}/api/admin/members/{member_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert verify_response.json()["name"] == "TEST CRUD Member Updated"
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/admin/members/{member_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_response.status_code == 200
        print("Deleted")
        
        # Verify deletion
        verify_delete = requests.get(f"{BASE_URL}/api/admin/members/{member_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert verify_delete.status_code == 404


class TestAdminDashboard:
    """Admin dashboard endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_dashboard(self, auth_token):
        """GET /api/admin/dashboard - should return dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_members" in data
        assert "pending_approvals" in data
        assert "new_this_month" in data
        assert "upcoming_events" in data
        assert "recent_members" in data
        assert "recent_payments" in data
        print(f"Dashboard: total_members={data['total_members']}, pending={data['pending_approvals']}")


class TestAdminEventsCRUD:
    """Admin events management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_events_crud(self, auth_token):
        """Full CRUD for events"""
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/admin/events",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST Event",
                "date": "2026-06-15",
                "venue": "Test Venue",
                "description": "Test Description",
                "status": "upcoming"
            })
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        print(f"Created event: {event_id}")
        
        # READ
        get_response = requests.get(f"{BASE_URL}/api/admin/events",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert get_response.status_code == 200
        events = get_response.json()
        assert any(e["id"] == event_id for e in events)
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/admin/events/{event_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST Event Updated",
                "date": "2026-06-16",
                "venue": "New Venue",
                "description": "Updated Description",
                "status": "upcoming"
            })
        assert update_response.status_code == 200
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/admin/events/{event_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_response.status_code == 200
        print("Event CRUD complete")


class TestAdminNewsCRUD:
    """Admin news management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_news_crud(self, auth_token):
        """Full CRUD for news"""
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/admin/news",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST News Article",
                "content": "Test news content",
                "category": "general",
                "published_date": "2026-01-15",
                "status": "published"
            })
        assert create_response.status_code == 200
        news_id = create_response.json()["id"]
        print(f"Created news: {news_id}")
        
        # READ
        get_response = requests.get(f"{BASE_URL}/api/admin/news",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert get_response.status_code == 200
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/admin/news/{news_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST News Updated",
                "content": "Updated content",
                "category": "general",
                "published_date": "2026-01-16",
                "status": "published"
            })
        assert update_response.status_code == 200
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/admin/news/{news_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_response.status_code == 200
        print("News CRUD complete")


class TestAdminGalleryCRUD:
    """Admin gallery management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_gallery_crud(self, auth_token):
        """Full CRUD for gallery albums and photos"""
        # CREATE ALBUM
        album_response = requests.post(f"{BASE_URL}/api/admin/gallery/albums",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST Album",
                "description": "Test album description",
                "category": "conference"
            })
        assert album_response.status_code == 200
        album_id = album_response.json()["id"]
        print(f"Created album: {album_id}")
        
        # ADD PHOTO
        photo_response = requests.post(f"{BASE_URL}/api/admin/gallery/photos",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "album_id": album_id,
                "title": "TEST Photo",
                "image_url": "https://example.com/test.jpg"
            })
        assert photo_response.status_code == 200
        photo_id = photo_response.json()["id"]
        print(f"Added photo: {photo_id}")
        
        # GET PHOTOS
        get_photos = requests.get(f"{BASE_URL}/api/admin/gallery/photos/{album_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert get_photos.status_code == 200
        
        # DELETE PHOTO
        delete_photo = requests.delete(f"{BASE_URL}/api/admin/gallery/photos/{photo_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_photo.status_code == 200
        
        # DELETE ALBUM
        delete_album = requests.delete(f"{BASE_URL}/api/admin/gallery/albums/{album_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_album.status_code == 200
        print("Gallery CRUD complete")


class TestAdminPublicationsCRUD:
    """Admin publications management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_publications_crud(self, auth_token):
        """Full CRUD for publications"""
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/admin/publications",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST Publication",
                "author": "Dr. Test Author",
                "abstract": "Test abstract",
                "category": "research",
                "published_date": "2026-01-01"
            })
        assert create_response.status_code == 200
        pub_id = create_response.json()["id"]
        print(f"Created publication: {pub_id}")
        
        # READ
        get_response = requests.get(f"{BASE_URL}/api/admin/publications",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert get_response.status_code == 200
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/admin/publications/{pub_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "TEST Publication Updated",
                "author": "Dr. Test Author Updated",
                "abstract": "Updated abstract",
                "category": "research",
                "published_date": "2026-01-02"
            })
        assert update_response.status_code == 200
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/admin/publications/{pub_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_response.status_code == 200
        print("Publications CRUD complete")


class TestAdminExecutiveCRUD:
    """Admin executive committee management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_executive_crud(self, auth_token):
        """Full CRUD for executive committee"""
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/admin/executive",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST Executive",
                "designation": "Test Designation",
                "profile": "Test profile",
                "order": 99
            })
        assert create_response.status_code == 200
        exec_id = create_response.json()["id"]
        print(f"Created executive: {exec_id}")
        
        # READ
        get_response = requests.get(f"{BASE_URL}/api/admin/executive",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert get_response.status_code == 200
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/admin/executive/{exec_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "TEST Executive Updated",
                "designation": "Updated Designation",
                "profile": "Updated profile",
                "order": 100
            })
        assert update_response.status_code == 200
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/admin/executive/{exec_id}",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert delete_response.status_code == 200
        print("Executive CRUD complete")


class TestAdminEmailSystem:
    """Admin email system"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_email_logs(self, auth_token):
        """GET /api/admin/email/logs - should return email logs"""
        response = requests.get(f"{BASE_URL}/api/admin/email/logs",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Email logs count: {len(data)}")
    
    def test_send_email(self, auth_token):
        """POST /api/admin/email/send - should queue email"""
        response = requests.post(f"{BASE_URL}/api/admin/email/send",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "subject": "TEST Email",
                "body": "<p>Test email body</p>",
                "recipient_group": "custom",
                "recipients": ["test@example.com"]
            })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "log_id" in data
        print(f"Email queued: {data}")


class TestAdminCMS:
    """Admin CMS settings"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_cms(self, auth_token):
        """GET /api/admin/cms - should return CMS settings"""
        response = requests.get(f"{BASE_URL}/api/admin/cms",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"CMS settings: {list(data.keys())}")
    
    def test_update_cms(self, auth_token):
        """PUT /api/admin/cms - should update CMS settings"""
        response = requests.put(f"{BASE_URL}/api/admin/cms",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "website_name": "IDSEA",
                "hero_title": "Indian Dairy Scientists and Entrepreneurs Association",
                "hero_subtitle": "Updated subtitle for testing",
                "about_content": "Test about content",
                "vision": "Test vision",
                "mission": "Test mission",
                "contact_email": "info@idsea.org",
                "contact_phone": "+91 98765 43210",
                "contact_address": "Test Address"
            })
        assert response.status_code == 200
        print("CMS updated successfully")


class TestAdminReports:
    """Admin reports endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_reports_stats(self, auth_token):
        """GET /api/admin/reports/stats - should return analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/reports/stats",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_members" in data
        assert "approved_members" in data
        assert "pending_members" in data
        assert "total_revenue" in data
        assert "membership_types" in data
        assert "events" in data
        print(f"Reports: total_members={data['total_members']}, revenue={data['total_revenue']}")


class TestAdminCertificates:
    """Admin certificates management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_certificates(self, auth_token):
        """GET /api/admin/certificates - should return certificates list"""
        response = requests.get(f"{BASE_URL}/api/admin/certificates",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Certificates count: {len(data)}")


class TestAdminUsers:
    """Admin user management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_admin_users(self, auth_token):
        """GET /api/admin/users - should return admin users list"""
        response = requests.get(f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least default admin
        assert any(u["email"] == ADMIN_EMAIL for u in data)
        print(f"Admin users: {len(data)}")


class TestAdminPayments:
    """Admin payments management"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_payments(self, auth_token):
        """GET /api/admin/payments - should return payments list"""
        response = requests.get(f"{BASE_URL}/api/admin/payments",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Payments count: {len(data)}")
    
    def test_add_manual_payment(self, auth_token):
        """POST /api/admin/payments/manual - should add manual payment"""
        response = requests.post(f"{BASE_URL}/api/admin/payments/manual",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "member_name": "TEST Manual Payment",
                "member_email": "test@manual.com",
                "amount": 1000,
                "membership_type": "academic"
            })
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 1000
        assert data["status"] == "paid"
        print(f"Manual payment created: {data['id']}")


class TestPublicMembershipApplication:
    """Public membership application"""
    
    def test_apply_membership(self):
        """POST /api/public/members/apply - should submit application"""
        unique_email = f"TEST_apply_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/public/members/apply", json={
            "name": "TEST Applicant",
            "email": unique_email,
            "membership_type": "academic",
            "qualification": "PhD",
            "organization": "Test University"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "id" in data
        print(f"Application submitted: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
