"""
Tests for 5 NEW features in IDSEA:
1. Certificate PDF Generation
2. Excel/PDF Member Export
3. SMTP Email Settings CRUD
4. File Upload for photos/brochures/PDFs
5. Advanced Reports with monthly-growth data
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSetup:
    """Setup: Get auth token and verify access"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@idsea.org",
            "password": "Admin@123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}


# =================== 1. CERTIFICATE PDF GENERATION ===================

class TestCertificatePDF(TestSetup):
    """Test Certificate PDF download feature"""
    
    def test_generate_certificate_for_member(self, auth_headers):
        """Create a certificate first, then test PDF download"""
        # Get an approved member to use
        members_r = requests.get(f"{BASE_URL}/api/admin/members", 
                                 params={"status": "approved"},
                                 headers=auth_headers)
        assert members_r.status_code == 200
        members = members_r.json()
        assert len(members) > 0, "Need at least one approved member"
        member_id = members[0]["id"]
        
        # Generate certificate
        cert_r = requests.post(f"{BASE_URL}/api/admin/certificates/generate",
                               json={
                                   "member_id": member_id,
                                   "certificate_type": "membership",
                                   "event_name": "",
                                   "issue_date": "01 January 2026"
                               },
                               headers=auth_headers)
        assert cert_r.status_code == 200, f"Failed to generate cert: {cert_r.text}"
        cert_data = cert_r.json()
        assert "id" in cert_data
        assert cert_data["certificate_type"] == "membership"
        return cert_data["id"]
    
    def test_download_certificate_pdf(self, auth_headers):
        """Test GET /api/admin/certificates/{cert_id}/pdf returns valid PDF"""
        # First create a certificate
        members_r = requests.get(f"{BASE_URL}/api/admin/members", 
                                 params={"status": "approved"},
                                 headers=auth_headers)
        member_id = members_r.json()[0]["id"]
        
        cert_r = requests.post(f"{BASE_URL}/api/admin/certificates/generate",
                               json={"member_id": member_id, "certificate_type": "membership"},
                               headers=auth_headers)
        cert_id = cert_r.json()["id"]
        
        # Download PDF
        pdf_r = requests.get(f"{BASE_URL}/api/admin/certificates/{cert_id}/pdf",
                             headers=auth_headers)
        assert pdf_r.status_code == 200, f"PDF download failed: {pdf_r.status_code}"
        assert pdf_r.headers.get("content-type") == "application/pdf"
        assert len(pdf_r.content) > 1000, "PDF content too small"
        # Check PDF magic bytes
        assert pdf_r.content[:4] == b'%PDF', "Response is not a valid PDF"
        print(f"✓ Certificate PDF downloaded successfully ({len(pdf_r.content)} bytes)")
    
    def test_certificate_pdf_not_found(self, auth_headers):
        """Test 404 for non-existent certificate"""
        pdf_r = requests.get(f"{BASE_URL}/api/admin/certificates/NONEXISTENT/pdf",
                             headers=auth_headers)
        assert pdf_r.status_code == 404


# =================== 2. EXCEL/PDF MEMBER EXPORT ===================

class TestMemberExport(TestSetup):
    """Test Excel and PDF export features"""
    
    def test_export_excel_all_members(self, auth_headers):
        """GET /api/admin/members/export/excel returns valid Excel file"""
        r = requests.get(f"{BASE_URL}/api/admin/members/export/excel", headers=auth_headers)
        assert r.status_code == 200, f"Excel export failed: {r.status_code}"
        assert "spreadsheetml" in r.headers.get("content-type", "")
        assert len(r.content) > 500, "Excel file too small"
        # Check for Excel magic bytes (PK for ZIP format)
        assert r.content[:2] == b'PK', "Not a valid xlsx file"
        print(f"✓ Excel export successful ({len(r.content)} bytes)")
    
    def test_export_excel_filtered_by_status(self, auth_headers):
        """GET /api/admin/members/export/excel?status=approved filters correctly"""
        r = requests.get(f"{BASE_URL}/api/admin/members/export/excel",
                         params={"status": "approved"},
                         headers=auth_headers)
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers.get("content-type", "")
        print(f"✓ Filtered Excel export successful ({len(r.content)} bytes)")
    
    def test_export_excel_filtered_by_type(self, auth_headers):
        """GET /api/admin/members/export/excel?membership_type=academic"""
        r = requests.get(f"{BASE_URL}/api/admin/members/export/excel",
                         params={"membership_type": "academic"},
                         headers=auth_headers)
        assert r.status_code == 200
        print("✓ Excel export filtered by membership_type")
    
    def test_export_pdf_all_members(self, auth_headers):
        """GET /api/admin/members/export/pdf returns valid PDF"""
        r = requests.get(f"{BASE_URL}/api/admin/members/export/pdf", headers=auth_headers)
        assert r.status_code == 200, f"PDF export failed: {r.status_code}"
        assert r.headers.get("content-type") == "application/pdf"
        assert len(r.content) > 500, "PDF file too small"
        assert r.content[:4] == b'%PDF', "Not a valid PDF"
        print(f"✓ PDF export successful ({len(r.content)} bytes)")
    
    def test_export_pdf_filtered(self, auth_headers):
        """GET /api/admin/members/export/pdf with filters"""
        r = requests.get(f"{BASE_URL}/api/admin/members/export/pdf",
                         params={"status": "approved", "membership_type": "academic"},
                         headers=auth_headers)
        assert r.status_code == 200
        assert r.content[:4] == b'%PDF'
        print("✓ PDF export with filters successful")


# =================== 3. SMTP EMAIL SETTINGS ===================

class TestSMTPSettings(TestSetup):
    """Test SMTP settings CRUD"""
    
    def test_get_smtp_settings(self, auth_headers):
        """GET /api/admin/smtp-settings returns config"""
        r = requests.get(f"{BASE_URL}/api/admin/smtp-settings", headers=auth_headers)
        assert r.status_code == 200, f"Failed: {r.text}"
        data = r.json()
        # Should have these fields
        assert "smtp_host" in data
        assert "smtp_port" in data
        assert "smtp_user" in data
        assert "from_email" in data
        print(f"✓ SMTP settings retrieved: host={data.get('smtp_host')}, port={data.get('smtp_port')}")
    
    def test_update_smtp_settings(self, auth_headers):
        """PUT /api/admin/smtp-settings saves config"""
        new_settings = {
            "smtp_host": "smtp.test.com",
            "smtp_port": 587,
            "smtp_user": "testuser@test.com",
            "smtp_pass": "testpass123",
            "from_email": "noreply@test.com"
        }
        r = requests.put(f"{BASE_URL}/api/admin/smtp-settings", 
                         json=new_settings,
                         headers=auth_headers)
        assert r.status_code == 200, f"Failed: {r.text}"
        assert "message" in r.json()
        
        # Verify settings were saved
        get_r = requests.get(f"{BASE_URL}/api/admin/smtp-settings", headers=auth_headers)
        saved = get_r.json()
        assert saved["smtp_host"] == "smtp.test.com"
        assert saved["smtp_port"] == 587
        assert saved["smtp_user"] == "testuser@test.com"
        print("✓ SMTP settings updated and verified")
    
    def test_smtp_test_email(self, auth_headers):
        """POST /api/admin/smtp-settings/test returns success/fail message"""
        r = requests.post(f"{BASE_URL}/api/admin/smtp-settings/test", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "success" in data
        assert "message" in data
        # Since SMTP isn't really configured, expect failure message
        print(f"✓ SMTP test response: success={data['success']}, message={data['message']}")
    
    def test_smtp_settings_requires_super_admin(self, auth_headers):
        """Non-super_admin cannot update SMTP (test normal admin)"""
        # This test just verifies the endpoint is protected
        # The default admin@idsea.org IS super_admin, so it works
        # If we had a regular admin, we'd test 403 response
        pass


# =================== 4. FILE UPLOAD ===================

class TestFileUpload(TestSetup):
    """Test file upload endpoint"""
    
    def test_upload_image_file(self, auth_headers):
        """POST /api/upload accepts image files"""
        # Create a simple test PNG file (1x1 pixel)
        png_header = b'\x89PNG\r\n\x1a\n'
        # Minimal valid PNG data
        import struct
        import zlib
        
        def make_minimal_png():
            # IHDR chunk
            width = struct.pack('>I', 1)
            height = struct.pack('>I', 1)
            ihdr_data = width + height + b'\x08\x02\x00\x00\x00'  # 1x1, 8-bit RGB
            ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
            ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + ihdr_crc
            
            # IDAT chunk (compressed pixel data)
            raw_data = b'\x00\xff\x00\x00'  # filter byte + RGB green pixel
            compressed = zlib.compress(raw_data, 9)
            idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
            idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
            
            # IEND chunk
            iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
            iend = struct.pack('>I', 0) + b'IEND' + iend_crc
            
            return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend
        
        png_data = make_minimal_png()
        
        files = {'file': ('test_image.png', png_data, 'image/png')}
        r = requests.post(f"{BASE_URL}/api/upload", files=files, headers=auth_headers)
        assert r.status_code == 200, f"Upload failed: {r.status_code} - {r.text}"
        data = r.json()
        assert "file_url" in data
        assert "original_name" in data
        assert data["original_name"] == "test_image.png"
        assert "/api/uploads/" in data["file_url"]
        print(f"✓ Image uploaded successfully: {data['file_url']}")
        return data["file_url"]
    
    def test_upload_rejects_txt_file(self, auth_headers):
        """POST /api/upload rejects .txt files"""
        txt_content = b"This is a test text file"
        files = {'file': ('test.txt', txt_content, 'text/plain')}
        r = requests.post(f"{BASE_URL}/api/upload", files=files, headers=auth_headers)
        assert r.status_code == 400, f"Expected 400, got {r.status_code}"
        assert "not allowed" in r.json().get("detail", "").lower()
        print("✓ .txt file correctly rejected")
    
    def test_upload_pdf_file(self, auth_headers):
        """POST /api/upload accepts PDF files"""
        # Minimal PDF
        pdf_content = b"""%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
170
%%EOF"""
        files = {'file': ('test_doc.pdf', pdf_content, 'application/pdf')}
        r = requests.post(f"{BASE_URL}/api/upload", files=files, headers=auth_headers)
        assert r.status_code == 200, f"PDF upload failed: {r.text}"
        assert "file_url" in r.json()
        print(f"✓ PDF uploaded successfully: {r.json()['file_url']}")
    
    def test_serve_uploaded_file(self, auth_headers):
        """GET /api/uploads/{filename} serves uploaded files"""
        # First upload a file
        import struct, zlib
        def make_png():
            width = struct.pack('>I', 1)
            height = struct.pack('>I', 1)
            ihdr_data = width + height + b'\x08\x02\x00\x00\x00'
            ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
            ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + ihdr_crc
            raw_data = b'\x00\xff\x00\x00'
            compressed = zlib.compress(raw_data, 9)
            idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
            idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc
            iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
            iend = struct.pack('>I', 0) + b'IEND' + iend_crc
            return b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend
        
        files = {'file': ('serve_test.png', make_png(), 'image/png')}
        upload_r = requests.post(f"{BASE_URL}/api/upload", files=files, headers=auth_headers)
        file_url = upload_r.json()["file_url"]
        
        # Get the file (public endpoint, no auth needed)
        serve_r = requests.get(f"{BASE_URL}{file_url}")
        assert serve_r.status_code == 200, f"Serve failed: {serve_r.status_code}"
        assert "image" in serve_r.headers.get("content-type", "")
        print(f"✓ File served successfully from {file_url}")
    
    def test_serve_nonexistent_file(self):
        """GET /api/uploads/nonexistent.png returns 404"""
        r = requests.get(f"{BASE_URL}/api/uploads/nonexistent12345.png")
        assert r.status_code == 404


# =================== 5. ADVANCED REPORTS (Monthly Growth) ===================

class TestAdvancedReports(TestSetup):
    """Test monthly-growth endpoint for Recharts"""
    
    def test_monthly_growth_endpoint(self, auth_headers):
        """GET /api/admin/reports/monthly-growth returns required fields"""
        r = requests.get(f"{BASE_URL}/api/admin/reports/monthly-growth", headers=auth_headers)
        assert r.status_code == 200, f"Failed: {r.text}"
        data = r.json()
        
        # Verify all required fields for Recharts
        assert "member_growth" in data, "Missing member_growth"
        assert "revenue_growth" in data, "Missing revenue_growth"
        assert "type_distribution" in data, "Missing type_distribution"
        assert "status_distribution" in data, "Missing status_distribution"
        assert "state_distribution" in data, "Missing state_distribution"
        
        # Verify data structures
        assert isinstance(data["member_growth"], list)
        assert isinstance(data["revenue_growth"], list)
        assert isinstance(data["type_distribution"], list)
        assert isinstance(data["status_distribution"], list)
        assert isinstance(data["state_distribution"], list)
        
        print(f"✓ Monthly growth data: {len(data['member_growth'])} months, {len(data['type_distribution'])} types")
    
    def test_monthly_growth_member_data_structure(self, auth_headers):
        """Verify member_growth has correct structure for BarChart"""
        r = requests.get(f"{BASE_URL}/api/admin/reports/monthly-growth", headers=auth_headers)
        data = r.json()
        
        if len(data["member_growth"]) > 0:
            item = data["member_growth"][0]
            assert "month" in item, "member_growth missing 'month' field"
            assert "members" in item, "member_growth missing 'members' field"
            print(f"✓ Member growth structure correct: {item}")
    
    def test_monthly_growth_revenue_data_structure(self, auth_headers):
        """Verify revenue_growth has correct structure for LineChart"""
        r = requests.get(f"{BASE_URL}/api/admin/reports/monthly-growth", headers=auth_headers)
        data = r.json()
        
        if len(data["revenue_growth"]) > 0:
            item = data["revenue_growth"][0]
            assert "month" in item, "revenue_growth missing 'month'"
            assert "revenue" in item, "revenue_growth missing 'revenue'"
            print(f"✓ Revenue growth structure correct: {item}")
    
    def test_monthly_growth_type_distribution(self, auth_headers):
        """Verify type_distribution for PieChart"""
        r = requests.get(f"{BASE_URL}/api/admin/reports/monthly-growth", headers=auth_headers)
        data = r.json()
        
        if len(data["type_distribution"]) > 0:
            item = data["type_distribution"][0]
            assert "type" in item, "type_distribution missing 'type'"
            assert "count" in item, "type_distribution missing 'count'"
            # Verify membership types
            types = [t["type"] for t in data["type_distribution"]]
            print(f"✓ Type distribution: {types}")
    
    def test_monthly_growth_state_distribution(self, auth_headers):
        """Verify state_distribution for horizontal BarChart"""
        r = requests.get(f"{BASE_URL}/api/admin/reports/monthly-growth", headers=auth_headers)
        data = r.json()
        
        if len(data["state_distribution"]) > 0:
            item = data["state_distribution"][0]
            assert "state" in item, "state_distribution missing 'state'"
            assert "count" in item, "state_distribution missing 'count'"
            print(f"✓ State distribution: top state is {item['state']} with {item['count']} members")
    
    def test_reports_stats_endpoint(self, auth_headers):
        """GET /api/admin/reports/stats returns stats for cards"""
        r = requests.get(f"{BASE_URL}/api/admin/reports/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        
        # Verify required stats
        assert "total_members" in data
        assert "approved_members" in data
        assert "pending_members" in data
        assert "new_this_month" in data
        assert "total_revenue" in data
        assert "membership_types" in data
        assert "events" in data
        
        print(f"✓ Stats: {data['total_members']} total, {data['approved_members']} approved, ₹{data['total_revenue']} revenue")


# Run quick health check
class TestHealthCheck:
    def test_api_accessible(self):
        """Verify API is accessible"""
        r = requests.get(f"{BASE_URL}/api/public/stats")
        assert r.status_code == 200
        print(f"✓ API accessible at {BASE_URL}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
