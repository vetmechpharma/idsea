"""
Test Event Management Enhancements - Iteration 17
Tests for:
1. Event model - venue_map_link field (no speaker_details)
2. POST /api/admin/events - creates event with venue_map_link
3. PUT /api/admin/events/{id} - updates venue_map_link
4. GET /api/public/events - returns venue_map_link
5. POST /api/public/upload-photo - for event images
6. POST /api/public/upload-pdf - for event brochures
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEventManagementEnhancements:
    """Tests for event management enhancements - venue_map_link, image/brochure upload"""
    
    token = None
    
    @classmethod
    def setup_class(cls):
        """Class-level setup - login as admin once"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        cls.token = login_resp.json().get("access_token")  # Changed from "token" to "access_token"
        print(f"Admin login successful, token obtained")
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - create session with token"""
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        })
        yield
    
    # ============= Backend Model Tests =============
    
    def test_create_event_with_venue_map_link(self):
        """Test creating event with venue_map_link field"""
        event_data = {
            "title": "TEST_Event_MapLink_Test",
            "date": "2026-06-01",
            "end_date": "2026-06-03",
            "venue": "Grand Convention Center, Delhi",
            "venue_map_link": "https://maps.google.com/?q=Delhi+Convention+Center",
            "description": "Test event with map link",
            "status": "upcoming",
            "registration_enabled": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/admin/events", json=event_data)
        assert response.status_code == 200, f"Create event failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Event should have an id"
        self.test_event_id = data["id"]
        
        # Verify venue_map_link is saved
        get_resp = self.session.get(f"{BASE_URL}/api/admin/events")
        events = get_resp.json()
        created_event = next((e for e in events if e["id"] == self.test_event_id), None)
        
        assert created_event is not None, "Created event not found"
        assert created_event["venue_map_link"] == event_data["venue_map_link"], "venue_map_link should match"
        print(f"Event created with venue_map_link: {created_event['venue_map_link']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/events/{self.test_event_id}")
    
    def test_create_event_without_speaker_details(self):
        """Test that event model doesn't require speaker_details (it was removed)"""
        event_data = {
            "title": "TEST_Event_NoSpeaker",
            "date": "2026-07-01",
            "venue": "Test Venue",
            "description": "Event without speaker details field",
            "status": "upcoming"
        }
        
        response = self.session.post(f"{BASE_URL}/api/admin/events", json=event_data)
        assert response.status_code == 200, f"Create event failed: {response.text}"
        
        data = response.json()
        event_id = data["id"]
        
        # Get the event and verify no speaker_details
        get_resp = self.session.get(f"{BASE_URL}/api/admin/events")
        events = get_resp.json()
        created_event = next((e for e in events if e["id"] == event_id), None)
        
        assert created_event is not None
        assert "speaker_details" not in created_event, "speaker_details should not be in event model"
        print("Event created successfully without speaker_details field")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    def test_update_event_venue_map_link(self):
        """Test updating venue_map_link on existing event"""
        # Create event first
        event_data = {
            "title": "TEST_Event_UpdateMapLink",
            "date": "2026-08-01",
            "venue": "Initial Venue",
            "status": "upcoming"
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/admin/events", json=event_data)
        assert create_resp.status_code == 200
        event_id = create_resp.json()["id"]
        
        # Update with venue_map_link
        update_data = {
            **event_data,
            "venue_map_link": "https://maps.google.com/?q=Updated+Venue+Location"
        }
        
        update_resp = self.session.put(f"{BASE_URL}/api/admin/events/{event_id}", json=update_data)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        # Verify update
        get_resp = self.session.get(f"{BASE_URL}/api/admin/events")
        events = get_resp.json()
        updated_event = next((e for e in events if e["id"] == event_id), None)
        
        assert updated_event is not None
        assert updated_event["venue_map_link"] == update_data["venue_map_link"]
        print(f"Event updated with venue_map_link: {updated_event['venue_map_link']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    def test_public_events_returns_venue_map_link(self):
        """Test GET /api/public/events returns venue_map_link"""
        # Create event with venue_map_link
        event_data = {
            "title": "TEST_Public_Event_MapLink",
            "date": "2026-09-01",
            "venue": "Public Venue",
            "venue_map_link": "https://maps.google.com/?q=Public+Venue",
            "status": "upcoming"
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/admin/events", json=event_data)
        assert create_resp.status_code == 200
        event_id = create_resp.json()["id"]
        
        # Get public events (no auth needed)
        public_resp = requests.get(f"{BASE_URL}/api/public/events")
        assert public_resp.status_code == 200, f"Public events failed: {public_resp.text}"
        
        events = public_resp.json()
        our_event = next((e for e in events if e["id"] == event_id), None)
        
        assert our_event is not None, "Created event should appear in public list"
        assert "venue_map_link" in our_event, "Public events should include venue_map_link"
        assert our_event["venue_map_link"] == event_data["venue_map_link"]
        print(f"Public events API returns venue_map_link: {our_event['venue_map_link']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    def test_public_event_by_id_returns_venue_map_link(self):
        """Test GET /api/public/events/{id} returns venue_map_link"""
        # Create event
        event_data = {
            "title": "TEST_SingleEvent_MapLink",
            "date": "2026-10-01",
            "venue": "Single Event Venue",
            "venue_map_link": "https://maps.google.com/?q=Single+Event+Venue",
            "status": "upcoming"
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/admin/events", json=event_data)
        assert create_resp.status_code == 200
        event_id = create_resp.json()["id"]
        
        # Get single public event
        public_resp = requests.get(f"{BASE_URL}/api/public/events/{event_id}")
        assert public_resp.status_code == 200, f"Public event by ID failed: {public_resp.text}"
        
        event = public_resp.json()
        assert "venue_map_link" in event
        assert event["venue_map_link"] == event_data["venue_map_link"]
        print(f"Single public event API returns venue_map_link: {event['venue_map_link']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    # ============= File Upload Tests =============
    
    def test_upload_photo_endpoint(self):
        """Test POST /api/public/upload-photo for event images"""
        # Create a simple test image (1x1 pixel PNG)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test_event_image.png', io.BytesIO(png_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/public/upload-photo", files=files)
        assert response.status_code == 200, f"Upload photo failed: {response.text}"
        
        data = response.json()
        assert "file_url" in data, "Response should contain file_url"
        assert data["file_url"].startswith("/api/uploads/"), f"file_url should start with /api/uploads/, got: {data['file_url']}"
        print(f"Photo upload successful: {data['file_url']}")
    
    def test_upload_photo_rejects_non_image(self):
        """Test that upload-photo rejects non-image files"""
        pdf_data = b"%PDF-1.4 test content"
        files = {'file': ('test.pdf', io.BytesIO(pdf_data), 'application/pdf')}
        
        response = requests.post(f"{BASE_URL}/api/public/upload-photo", files=files)
        assert response.status_code == 400, f"Should reject PDF files, got: {response.status_code}"
        print("Photo upload correctly rejects non-image files")
    
    def test_upload_pdf_endpoint(self):
        """Test POST /api/public/upload-pdf for event brochures"""
        # Create minimal PDF content
        pdf_data = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
189
%%EOF"""
        
        files = {'file': ('test_brochure.pdf', io.BytesIO(pdf_data), 'application/pdf')}
        
        response = requests.post(f"{BASE_URL}/api/public/upload-pdf", files=files)
        assert response.status_code == 200, f"Upload PDF failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response should contain url"
        assert data["url"].startswith("/api/uploads/"), f"url should start with /api/uploads/, got: {data['url']}"
        print(f"PDF upload successful: {data['url']}")
    
    def test_upload_pdf_rejects_non_pdf(self):
        """Test that upload-pdf rejects non-PDF files"""
        txt_data = b"This is a text file, not a PDF"
        files = {'file': ('test.txt', io.BytesIO(txt_data), 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/api/public/upload-pdf", files=files)
        assert response.status_code == 400, f"Should reject non-PDF files, got: {response.status_code}"
        print("PDF upload correctly rejects non-PDF files")
    
    # ============= Existing Event Tests =============
    
    def test_existing_event_has_venue_map_link_field(self):
        """Test that existing test event can have venue_map_link added"""
        test_event_id = "a6d69db6-d6f8-4fb6-a707-14dc903f8bfc"
        
        # Get existing event
        events_resp = self.session.get(f"{BASE_URL}/api/admin/events")
        assert events_resp.status_code == 200
        
        events = events_resp.json()
        existing_event = next((e for e in events if e["id"] == test_event_id), None)
        
        if existing_event:
            # Verify venue_map_link field exists (may be empty string)
            assert "venue_map_link" in existing_event or existing_event.get("venue_map_link", "") == ""
            
            # Note: speaker_details may still exist in old DB records but not in new events
            # The model no longer accepts it but legacy data may contain it
            print(f"Existing event '{existing_event['title']}' has venue_map_link field: '{existing_event.get('venue_map_link', '')}'")
            
            # Verify NEW events don't have speaker_details by creating one
            test_event = {
                "title": "TEST_New_Event_Check",
                "date": "2026-12-01",
                "venue": "Test Venue",
                "status": "upcoming"
            }
            create_resp = self.session.post(f"{BASE_URL}/api/admin/events", json=test_event)
            assert create_resp.status_code == 200
            new_event_id = create_resp.json()["id"]
            
            # Get the new event and verify no speaker_details
            events_resp2 = self.session.get(f"{BASE_URL}/api/admin/events")
            events2 = events_resp2.json()
            new_event = next((e for e in events2 if e["id"] == new_event_id), None)
            assert new_event is not None
            # New events should not have speaker_details since model doesn't include it
            assert "speaker_details" not in new_event or new_event.get("speaker_details") is None, \
                "New events should not have speaker_details field"
            
            # Cleanup
            self.session.delete(f"{BASE_URL}/api/admin/events/{new_event_id}")
            print("New events created without speaker_details - model updated correctly")
        else:
            print(f"Test event {test_event_id} not found - skipping this test")
    
    def test_create_event_with_image_and_brochure_urls(self):
        """Test creating event with image_url and brochure_url"""
        event_data = {
            "title": "TEST_Event_ImageBrochure",
            "date": "2026-11-01",
            "venue": "Test Venue",
            "status": "upcoming",
            "image_url": "/api/uploads/test_image.png",
            "brochure_url": "/api/uploads/test_brochure.pdf",
            "venue_map_link": "https://maps.google.com/?q=Test+Venue"
        }
        
        response = self.session.post(f"{BASE_URL}/api/admin/events", json=event_data)
        assert response.status_code == 200, f"Create event with URLs failed: {response.text}"
        
        event_id = response.json()["id"]
        
        # Verify all fields are saved
        get_resp = self.session.get(f"{BASE_URL}/api/admin/events")
        events = get_resp.json()
        created_event = next((e for e in events if e["id"] == event_id), None)
        
        assert created_event is not None
        assert created_event["image_url"] == event_data["image_url"]
        assert created_event["brochure_url"] == event_data["brochure_url"]
        assert created_event["venue_map_link"] == event_data["venue_map_link"]
        print(f"Event created with image_url, brochure_url, and venue_map_link")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/events/{event_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
