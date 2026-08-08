# IDSEA Website - Product Requirements Document

## Tech Stack
React + TailwindCSS + Shadcn/UI | FastAPI + Motor (MongoDB) + ReportLab | Ubuntu VPS + Nginx + Supervisor

## Completed Features (Latest)
- **Certificate & Messaging Overhaul (Aug 2026)**:
  - Fixed cert design mismatch: approval now passes `photo_url` to cert template for accurate generation
  - Fixed WhatsApp: sends text message first, then document separately (prevents message loss)
  - Bulk certificate regeneration: "Regen Certs & Email" button regenerates all approved member certs using latest template and emails them
  - Individual email modal upgraded: Rich Text editor (ReactQuill), file attachments, CC field, Email+WhatsApp channel toggles
  - PDF Flipbook module: Reusable `PDFFlipbook` component for viewing PDFs page-by-page with zoom/fullscreen/download
  - IDSEA Byelaws: Admin uploads PDF via CMS, displayed as flipbook on About page
- **Student ID Verification Fix (Aug 2026)**: Fixed bug where verifying one student ID marked all as verified. Verify ID Modal with photo preview + Verify/Cancel/Request Re-upload. Approval blocked for unverified students.
- **Admin Roles**: Super Admin / Admin / Event Manager with user CRUD, password reset, role-based sidebar
- **Student → Academic Upgrade**: Self-service at /upgrade + admin approval with new Academic ID
- **Certificate Validity**: validity_start/validity_end as template variables for student certs
- **Student Membership**: validity-based, auto-expiry, college ID verification, 6-digit ID (STUD/IDSEA/YEAR/000001)
- **CC Email**: Admin sets CC in CMS for all membership notifications
- **College ID Upload**: Image only, auto-compress to WebP (quality 70, max 1200px)
- Multi-plan cert template linking, QR auto-verify, clean membership labels
- Phone input with country flag, name prefix everywhere, membership directory redesign
- Dynamic CMS, event registration, Razorpay, SMTP batch email, WhatsApp automation
- Full backup/restore, VPS deployment scripts

## Admin Credentials
- Super Admin: admin@idsea.org / Admin@123

## Key Architecture Notes
- server.py ~6400 lines — `app.include_router(api_router)` is at BOTTOM of file. All new routes MUST be defined ABOVE it.
- Admin emails stored lowercase; login normalizes to lowercase
- Student membership checks use both "student" and "students_membership" keys
- Certificate validity: use `_membership_label()`, `_full_name()` helpers
- Reusable PDFFlipbook component at `/app/frontend/src/components/PDFFlipbook.jsx`
- Email modal uses `react-quill-new` for rich text editing
- CMS model includes `byelaws_pdf_url` and `document_pdfs` fields

## Key API Endpoints (New/Modified)
- `POST /api/admin/members/regenerate-certificates` — Bulk regen + email (background task)
- `POST /api/admin/members/{id}/send-email` — Upgraded: HTML body, attachments, CC, WhatsApp toggle
- `PUT /api/admin/members/{id}/verify-college-id` — Validates member exists, is student, has college ID
- `PUT /api/admin/members/{id}/request-reupload-college-id` — Clears ID + notifies student

## Pending Tasks
- P1: Upgrade Requests admin frontend page
- P2: Server refactor into modules (routes/, models/, services/)
- P2: Student self-renewal payment flow
- P3: Admin activity audit log
- P3: Lazy-load admin pages
