# IDSEA Website - Product Requirements Document

## Tech Stack
React + TailwindCSS + Shadcn/UI | FastAPI + Motor (MongoDB) + ReportLab | Ubuntu VPS + Nginx + Supervisor

## Completed Features (Latest)
- **Application Flow Overhaul (Aug 2026)**:
  - Transaction number (UTR) now mandatory before application is submitted for UPI/Bank payments
  - Application only saved to DB and emails sent AFTER payment is confirmed
  - Terms & Conditions: CMS-managed content, mandatory checkbox + modal viewer on apply page
  - "Cancel/Pay Later" removed from membership payment step
- **Certificate & Messaging Overhaul (Aug 2026)**:
  - Certificate verify/download now enriches data with member's latest photo_url
  - Custom email uses branded IDSEA template with header, Regards/IDSEA Team sign-off, ANIMitra footer
  - WhatsApp: HTML entities (&nbsp;) properly stripped; images sent as images not documents
  - WhatsApp approval: sends text message first, then certificate document separately
  - Bulk certificate regeneration: "Regen Certs & Email" button for all approved members
  - Individual email modal: Rich Text editor, file attachments, CC field, Email+WhatsApp toggles
  - PDF Flipbook module: Reusable PDFFlipbook component with zoom/fullscreen/download
  - IDSEA Byelaws: Admin uploads PDF via CMS, displayed as flipbook on About page
- **Student ID Verification Fix (Aug 2026)**: Verify ID Modal, approval blocked for unverified
- **Admin Roles**: Super Admin / Admin / Event Manager
- **Student Membership**: validity-based, auto-expiry, college ID verification
- **Core Features**: Dynamic CMS, event registration, Razorpay, SMTP batch email, WhatsApp automation, backup/restore, VPS deployment scripts

## Admin Credentials
- Super Admin: admin@idsea.org / Admin@123

## Key Architecture Notes
- server.py ~6400 lines — `app.include_router(api_router)` is at BOTTOM. All new routes MUST be defined ABOVE it.
- Student membership checks use both "student" and "students_membership" keys
- Reusable PDFFlipbook component at `/app/frontend/src/components/PDFFlipbook.jsx`
- Email modal uses `react-quill-new` for rich text editing
- MembershipApplyPage delays API call until payment is confirmed (form data held in state)

## Key API Endpoints
- `POST /api/admin/members/regenerate-certificates` — Bulk regen + email
- `POST /api/admin/members/{id}/send-email` — HTML body, attachments, CC, WhatsApp toggle
- `GET /api/public/certificates/download/{cert_id}` — Enriches with member photo_url
- `PUT/GET /api/admin/cms` — Includes terms_conditions, byelaws_pdf_url

## Pending Tasks
- P1: Upgrade Requests admin frontend page
- P2: Server refactor into modules (routes/, models/, services/)
- P2: Student self-renewal payment flow
- P3: Admin activity audit log
- P3: Lazy-load admin pages
