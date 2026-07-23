# IDSEA Website - Product Requirements Document

## Original Problem Statement
Build a full-stack website for the "Indian Dairy Scientists and Entrepreneurs Association (IDSEA)" containing a public-facing site and a comprehensive admin panel.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, React Router, Axios
- **Backend**: FastAPI, Motor (async MongoDB), ReportLab (PDF generation)
- **Database**: MongoDB
- **Deployment**: Ubuntu VPS with Nginx + Supervisor

## Architecture
```
/app/
├── backend/
│   ├── server.py        # Monolithic FastAPI app (~5500 lines)
│   └── uploads/
├── deploy/              # VPS deployment scripts
└── frontend/src/
    ├── components/
    ├── pages/admin/
    └── pages/public/
```

## Completed Features
- Dynamic CMS with drag-and-drop public menu editor
- Event registration flows with Razorpay integration + duplicate prevention
- Visual drag-and-drop Certificate Designer
- **Membership ID as certificate number** (cert_id = ACD/IDSEA/0001 format)
- **QR code encodes membership ID** → redirects to /verify?id=ACD/IDSEA/0001
- Multi-plan certificate template linking (one template → multiple plans)
- Certificate template linking on Membership Plans page
- Clean membership labels ("Academic"/"Corporate" not "Academic Member")
- Site URL CMS field for QR code generation
- Custom SMTP batch email sender (50 emails/5 mins)
- WhatsApp automation (13 templates with attachment support)
- Full admin Backup/Restore
- Auto-PDF generation for member applications and certificates
- VPS deployment scripts (updated for idsea.in domain, port 8003)
- Rich Text (HTML) Toolbar for CMS admin
- Member Registration Infographic counter
- Loading states (no flash of default data)
- Axios auth interceptors, logo+org name clickable to home

## 3rd Party Integrations
- **Razorpay** (Payments) — Requires User API Key
- **SMTP** (Email) — Requires User Credentials
- **whatsapp-server-4 API** (Messaging) — Requires User API Key

## Pending Tasks
- **P1**: Refine Public Member Directory (search, filter, pagination)
- **P2**: Admin Role Management (Super Admin vs Event Manager)
- **P3**: Refactor server.py into modular structure
- **P3**: Lazy-load admin pages for smaller bundle

## Admin Credentials
- Email: admin@idsea.org
- Password: Admin@123

## Critical Dev Notes
- Membership certificates use membership_id as cert_id (e.g., ACD/IDSEA/0001)
- Event certificates use random IDSEA-EVT-XXXXX format
- Verify/download endpoints use `{cert_id:path}` to handle `/` in membership IDs
- Frontend URL-encodes cert IDs in API calls
- Certificate templates use `linked_membership_types` (array) for multi-plan linking
- Use `_membership_label()` for clean membership type display
- server.py ~5500 lines — view context before search_replace
