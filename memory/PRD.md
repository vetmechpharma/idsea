# IDSEA Website - Product Requirements Document

## Tech Stack
React + TailwindCSS + Shadcn/UI | FastAPI + Motor (MongoDB) + ReportLab | Ubuntu VPS + Nginx + Supervisor

## Completed Features (Latest)
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
- server.py ~6100 lines — `app.include_router(api_router)` is at BOTTOM of file. All new routes MUST be defined ABOVE it.
- Admin emails stored lowercase; login normalizes to lowercase
- Student membership checks use both "student" and "students_membership" keys
- Certificate validity: use `_membership_label()`, `_full_name()` helpers

## Pending Tasks
- P1: Upgrade Requests admin frontend page
- P2: Server refactor into modules
- P2: Student self-renewal payment flow
- P3: Admin activity audit log
- P3: Lazy-load admin pages
