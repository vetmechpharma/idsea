# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with public-facing website and comprehensive admin panel.

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- Backend: FastAPI (Python), Motor (async MongoDB), httpx, Reportlab (PDF)
- Database: MongoDB | Auth: JWT | Payments: Razorpay, UPI QR, Bank Transfer
- WhatsApp: AK Nexus v1 API | SMTP for emails

## Default Admin: admin@idsea.org / Admin@123

## Implemented Features

### Certificate Design Module - COMPLETE
- **Visual Template Designer:** Drag-drop canvas editor with 5 element types
  - Text (multi-line via textarea), Placeholder Fields (17 dynamic fields), Image/Logo, Signature Block, Lines
- **Properties Panel:** Font family/size/color, bold/italic/underline, alignment, opacity (10-100%), layer order, position/size inputs
- **Advanced Features:**
  - Zoom controls (+/-/reset with percentage display)
  - Multi-line text wrapping in both canvas and PDF output
  - Paragraph-based PDF rendering (reportlab Paragraph with ParagraphStyle)
  - Background image upload or solid color
  - Template orientation (Landscape/Portrait A4)
- **Membership Plan Linking:** Each template can be linked to a membership type (Academic/Entrepreneur/Corporate/International)
  - Templates show "Linked: {plan} Plan" badge on cards
  - Only one template per plan (auto-unlinks previous when linking new)
  - API: PUT /link-plan, GET /by-plan/{type}
- **Template Management:** Create, Edit, Clone, Delete, Preview PDF
- **Generate Certificates:**
  - Single member: Select member -> Download PDF
  - Bulk event: Select event -> Download ZIP with all paid registrations

### Event Registration System V2 - COMPLETE
### Payment System (INR/USD) - COMPLETE
### Admin Event Management - COMPLETE
### Admin Event Registrations - COMPLETE
### Membership Registration (4 plans incl. International) - COMPLETE
### Membership Plans Dynamic Management - COMPLETE
### WhatsApp + SMTP + Admin Panel (18+ sections) - COMPLETE

## Testing: iterations 1-22 all pass

## Backlog
- P1: Member Directory (public), News & Contact pages
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3700 lines)
