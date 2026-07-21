# IDSEA Website - Product Requirements Document

## Original Problem Statement
Build a full-stack website for the "Indian Dairy Scientists and Entrepreneurs Association (IDSEA)" containing a public-facing site and a comprehensive admin panel. Core requirements include complex event registrations, membership management, visual Certificate Design Module, dynamic CMS, Email Automation/Batch scheduling, Admin Backup/Restore, and VPS deployment files.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, React Router, Axios
- **Backend**: FastAPI, Motor (async MongoDB), ReportLab (PDF generation)
- **Database**: MongoDB
- **Deployment**: Ubuntu VPS with Nginx + Supervisor

## Architecture
```
/app/
├── backend/
│   ├── server.py        # Monolithic FastAPI app (~5400 lines)
│   └── uploads/         # Stores images, certificates, DB backups
├── deploy/              # VPS installation files (nginx, supervisor, scripts)
└── frontend/src/
    ├── components/
    ├── pages/admin/
    └── pages/public/
```

## Completed Features
- Dynamic CMS with drag-and-drop public menu editor
- Event registration flows with Razorpay integration
- Visual drag-and-drop Certificate Designer
- Custom SMTP batch email sender (50 emails/5 mins)
- WhatsApp automation system (13 templates with attachment support via whatsapp-server-4)
- Full admin Backup/Restore
- Auto-PDF generation for member applications and certificates
- VPS deployment scripts (/app/deploy)
- Rich Text (HTML) Toolbar for CMS admin
- Member Registration Infographic counter on homepage
- Editorial Board standalone page
- Google Maps in footer
- Contact Us form API integration
- Loading states to prevent flash of default data across all pages
- Axios auth interceptors for Dashboard API calls
- Logo + org name both clickable to navigate home (July 2026)
- **Duplicate event registration prevention** — backend checks email+event_id before creating, frontend guards re-submission (July 2026)

## 3rd Party Integrations
- **Razorpay** (Payments) — Requires User API Key
- **SMTP** (Email) — Requires User Credentials
- **whatsapp-server-4 API** (Messaging) — Requires User API Key / Session ID

## Pending Tasks (Prioritized)
- **P1**: Refine Public Member Directory (search, filter, pagination UX)
- **P2**: Admin Role Management (Super Admin vs Event Manager privileges)
- **P3**: Refactor monolithic server.py into modular structure (routes/, models/, services/)
- **P3**: Lazy-load admin pages in React to reduce public bundle size

## Key DB Collections
- email_templates, email_queue, smtp_settings
- whatsapp_templates, whatsapp_settings
- cms_settings, members
- event_registrations, events, payments

## Admin Credentials
- Email: admin@idsea.org
- Password: Admin@123

## Critical Dev Notes
- Always use optional chaining (`?.`) when referencing dynamic CMS data
- Store image URLs as relative paths (`/api/uploads/...`), never absolute domains
- server.py is ~5400 lines — always view file context before search_replace
- Nginx regex for static files will intercept upload URLs unless `^~ /api/` is enforced
- Event registration has duplicate prevention (email+event_id check) — returns existing reg if duplicate
