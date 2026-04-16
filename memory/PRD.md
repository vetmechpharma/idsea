# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with public-facing website and comprehensive admin panel.

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- Backend: FastAPI (Python), Motor (async MongoDB), httpx, Reportlab (PDF)
- Database: MongoDB | Auth: JWT | Payments: Razorpay, UPI QR, Bank Transfer
- WhatsApp: AK Nexus v2 API | SMTP for emails

## Default Admin: admin@idsea.org / Admin@123

## Implemented Features

### Dynamic CMS & Page Content Manager - COMPLETE (Apr 16, 2026)
- **Page Content System:** MongoDB `page_contents` collection with per-page content documents
- **Admin CMS Page:** Tabbed interface with 10 tabs:
  - Branding & Global (logo, hero, about, vision/mission, contact, social links)
  - Home Page (about section, membership section, events/news section titles, CTA)
  - About Page (hero, objectives list, council/founders titles, HQ)
  - Events/Gallery/Publications/Members Pages (hero title/subtitle)
  - Contact Page (hero, form labels, membership CTA box)
  - Navbar (org name, short name) & Footer (description, copyright)
- **All Public Pages Dynamic:** Every page fetches content from `/api/public/page-content/{page}`
- **Membership Plans Dynamic:** Home page and Footer display plans from `/api/public/membership-plans`
- **APIs:** GET/PUT `/api/admin/page-content/{page}`, GET `/api/public/page-content/{page}`

### Certificate Design Module V2 - COMPLETE (Apr 16, 2026)
- **Visual Template Designer:** Drag-drop canvas editor with 5 element types
  - Text (multi-line via textarea), Placeholder Fields (17 dynamic fields), Image/Logo, Signature Block, Lines
- **Drag Threshold:** 4px threshold prevents accidental drags during clicks
- **Inline Text Editing:** Double-click text elements to edit directly on canvas
- **4-Corner Resize Handles:** NW, NE, SW, SE resize with proper cursor styles
- **Keyboard Shortcuts:** Delete/Backspace to remove, Arrow keys to nudge (Shift=10px), Ctrl+D duplicate, Escape deselect
- **Mouse Wheel Zoom:** Ctrl+scroll zooms 0.2x-2.0x with proper coordinate transformation
- **Properties Panel:** Font family/size/color, bold/italic/underline, alignment, opacity (10-100%), layer order, position/size inputs
- **PDF Generation:** Improved text positioning with proper vertical alignment and newline handling
- **Membership Plan Linking:** Each template can be linked to a membership type
- **Template Management:** Create, Edit, Clone, Delete, Preview PDF
- **Generate Certificates:** Single member or bulk event (ZIP)

### Event Registration System V2 - COMPLETE
### Payment System (INR/USD) - COMPLETE
### Admin Event Management - COMPLETE
### Admin Event Registrations - COMPLETE
### Membership Registration (4 plans incl. International) - COMPLETE
### Membership Plans Dynamic Management - COMPLETE
### WhatsApp v2 + SMTP + Admin Panel (18+ sections) - COMPLETE

## Testing: iterations 1-24 all pass

## Backlog
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3900 lines)
