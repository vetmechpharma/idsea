# IDSEA Website - Product Requirements Document

## Original Problem Statement
Build a full-stack website for IDSEA with public site + admin panel. Features: event registration, membership, certificates, CMS, email/WhatsApp automation, backup/restore, VPS deployment.

## Tech Stack
React + TailwindCSS + Shadcn/UI | FastAPI + Motor (MongoDB) + ReportLab | Ubuntu VPS + Nginx + Supervisor

## Completed Features
- Dynamic CMS with drag-and-drop menu editor
- Event registration with Razorpay + duplicate prevention
- Visual Certificate Designer with QR auto-verify (membership ID format)
- Multi-plan certificate template linking
- SMTP batch email (50/5min) + WhatsApp automation (13 templates)
- **Student Membership System**: validity-based, auto-expiry, college ID verification, upgrade path
- Student ID format: STUD/IDSEA/YEAR/000001 (6 digits, continuous serial)
- Validity management: admin-set months, auto-expire background job, 3-month email/WA reminders
- Phone input with country flag dropdown (react-phone-number-input)
- Member name prefix everywhere (certificates, emails, WhatsApp, directory, exports)
- Membership ID editable by admin + gap prevention
- PDF size optimization (JPEG compression for backgrounds)
- QR code fix (in-memory buffer, error logging)
- Full admin Backup/Restore, VPS deployment scripts
- Membership Directory redesign (grid/list views, type pills, pagination)
- Google/Bing site verification meta tags

## 3rd Party Integrations
- Razorpay (Payments), SMTP (Email), whatsapp-server-4 API (Messaging)

## Pending Tasks
- **P1**: Admin Role Management (Super Admin vs Event Manager)
- **P2**: Certificate validity field for student certificates
- **P2**: Self-service renewal page for expiring students
- **P3**: Refactor server.py into modular structure
- **P3**: Lazy-load admin pages

## Admin Credentials
- Email: admin@idsea.org | Password: Admin@123

## Key Notes
- Student plans use `validity_months` (0 = lifetime). Background job checks daily for expiry
- Use `_full_name(member)` for prefix+name everywhere
- Use `_membership_label()` for clean type display
- Certificate QR auto-constructs from `site_url` in CMS
- server.py ~5800 lines — view context before search_replace
