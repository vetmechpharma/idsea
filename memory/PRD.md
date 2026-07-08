# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, react-helmet-async, react-slick
- Backend: FastAPI, Motor (MongoDB), Reportlab (PDF), qrcode, httpx
- Database: MongoDB | Auth: JWT | Payments: Razorpay
- WhatsApp: AK Nexus v2 | SMTP for emails

## Admin: admin@idsea.org / Admin@123

## Completed Features

### Certificate QR Code & Verification System - COMPLETE (Jul 8, 2026)
- QR Code element in Certificate Designer (position, size, verify URL base)
- Unique certificate IDs: IDSEA-MEM-XXXXXXXX (membership) / IDSEA-EVT-XXXXXXXX (event)
- Certificate records stored in `certificate_records` collection (metadata only, no PDF stored)
- Public verification page at `/verify` with search by cert ID
- On-the-fly PDF generation for download (no storage)
- QR codes on certificates link to verification URL
- Both membership and event certificates supported

### Event Detail Page System - COMPLETE
### Dynamic CMS & Page Content - COMPLETE
### SEO & Google Indexing - COMPLETE
### Custom Scripts Injection - COMPLETE
### Certificate Design Module V2 - COMPLETE
### EC Members Page with Sub-Divisions - COMPLETE
### Membership Registration (4 plans + International) - COMPLETE
### WhatsApp v2 Marketing Campaigns - COMPLETE
### Mobile Responsive - ALL Pages - COMPLETE

## Key APIs
- GET/POST `/api/admin/certificate-templates` - Template CRUD
- POST `/api/admin/certificate-templates/{id}/generate-member/{member_id}` - Generate member cert
- POST `/api/admin/certificate-templates/{id}/generate-event/{event_id}` - Bulk event certs (ZIP)
- GET `/api/public/certificates/verify/{cert_id}` - Verify certificate
- GET `/api/public/certificates/download/{cert_id}` - Download cert PDF on-the-fly

## Backlog
- P2: Admin Role Management, Member renewal reminders
- P3: Backend modularization (server.py 4100+ lines)
