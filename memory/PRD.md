# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with public-facing website and comprehensive admin panel.

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- Backend: FastAPI (Python), Motor (async MongoDB), httpx
- Database: MongoDB | Auth: JWT | Payments: Razorpay, UPI QR, Bank Transfer
- WhatsApp: AK Nexus v1 API | SMTP for emails

## Default Admin: admin@idsea.org / Admin@123

## Implemented Features

### Event Registration System V2 - COMPLETE
- 4 Participant Categories: Member, Non-Member, Student/JRF/SRF/RA/Retired, International Delegate
- Fee Tiers (Early Bird & Regular), Accommodation (Default/Self/Premium Hotels INR+USD)
- Additional Persons, Optional Add-ons, Membership option for non-members
- File uploads: ID proof, bonafide certificate

### Payment System - COMPLETE
- International: Razorpay only in USD | Domestic: UPI QR default, Razorpay + Bank Transfer
- Currency-aware backend

### Admin Event Management - COMPLETE
- Event CRUD with image/brochure uploads, premium hotels, venue map link

### Admin Event Registrations - COMPLETE (Feb 2026)
- Stats dashboard, multi-filter system, detail/edit modals, manual registration
- Excel (40 columns), PDF export, accommodation reports

### Membership Registration - COMPLETE (Mar 2026)
- 4 dynamic plans from API: Academic, Entrepreneur, Corporate, International Delegates
- International Delegates: USD $100, Razorpay only, Country/Postal Code address, Identity Proof + Photo required
- Membership ID: INT/IDSEA/2026/XXXX format with year continuation

### Certificate Design Module - COMPLETE (Apr 2026)
- **Visual Template Designer:** Drag-drop canvas editor for certificate layout design
- **5 Element Types:** Text, Placeholder Fields (17 dynamic fields), Image/Logo, Signature Block, Lines
- **Properties Panel:** Font family/size/color, bold/italic/underline, alignment, layer order
- **Background:** Upload custom background image or set solid color
- **Template Types:** Membership, Event/Conference, Custom
- **Orientation:** Landscape or Portrait (A4)
- **Template Management:** Create, Edit, Clone, Delete, Preview (PDF)
- **Generate Certificates:**
  - Single member: Select member -> Download PDF
  - Bulk event: Select event -> Download ZIP with all paid registrations
- **PDF Generation Engine:** Reportlab-based with font mapping, coordinate conversion, image support
- **17 Placeholder Fields:** name, membership_id, date, year, email, phone, qualification, specialization, organization, membership_type, state, country, event_title, event_date, event_venue, registration_id, paper_title

### Other Completed Features
- Membership Plans dynamic management
- WhatsApp Integration (AK Nexus)
- Admin Panel (18+ sections)
- SMTP email system with templates

## Testing: iterations 1-21 all pass

## Backlog
- P1: Member Directory (public), News & Contact pages
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3600 lines)
