# IDSEA (Indian Dairy Scientists and Entrepreneurs Association) - PRD

## Original Problem Statement
Build a full-stack website for IDSEA containing a public-facing site and comprehensive admin panel. Core requirements include complex event registrations, membership management with international delegate support, a custom visual Certificate Design Module for bulk PDF generation, a WhatsApp marketing campaign system utilizing the AK Nexus v2 API, and fully dynamic CMS capabilities.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, react-helmet-async, axios
- **Backend**: FastAPI (Python), Motor (async MongoDB), Pydantic
- **Database**: MongoDB
- **PDF**: reportlab + qrcode[pil]
- **WhatsApp**: AK Nexus v2 API

## What's Been Implemented

### Core CMS & Public Pages (DONE)
- Dynamic CMS for all public pages (Home, About, Contact, EC Members, Gallery, Publications)
- Navbar, Footer, Hero slider fully editable via admin
- Full SEO module (meta tags, favicon, auto sitemap.xml & robots.txt)
- Custom HTML/Scripts injector (Head, Body Start, Body End)
- Mobile responsive layouts across all pages

### Membership System (DONE)
- Multi-step membership application form
- Approval/rejection workflow in admin
- Razorpay integration (requires user API key)
- International delegate support ($100 USD)

### Event Management (DONE)
- Event creation with registration fee tiers, brochure upload
- Event registration forms with payment integration
- Enable/disable event toggle
- Event listing page

### Event Detail Page - UPGRADED (DONE - July 15, 2026)
- **Hero banner** with gallery image slider (auto-rotation)
- **Countdown timer** with glassmorphism styling
- **Colorful Important Dates** with color-coded cards (red, green, purple, amber, blue, pink) and status badges (Open Now, Upcoming, Closed)
- **Committee members** with profile photos and fallback avatar (User icon)
- **Google Maps iframe** embed for venue
- **QR Code** for venue navigation (using qrserver.com API)
- **Nearby Sightseeing** cards with images and distances
- **Travel info** (How to Reach, Weather) with styled info cards
- **Registration fee table** with member/non-member/student/international columns
- **Awards, Sponsorship packages, Contact persons** sections
- **Register CTA** at bottom
- **Mobile responsive** with proper grid stacking
- **Admin EventDetailEditor** with member linking, photo upload, color picker for dates, map URL fields

### Certificate System (DONE)
- Visual drag-and-drop Certificate Designer (V2)
- Inline text editing, zoom, background image
- QR code on certificates with unique ID
- Public /verify portal for certificate verification
- certificate_records collection for validation

### Executive Committee (DONE)
- Dedicated /ec-members page with sub-division categorization
- Creative member cards with photos
- Patrons/Founders on About Us page

### WhatsApp Campaigns (DONE - MOCKED)
- Campaign dashboard with AK Nexus v2 API contracts
- WhatsApp messages simulated via API

## Key DB Collections
- `cms_settings`: page_contents (Home, About, SEO, Scripts, Navbar etc.)
- `executive_committee`: sub_division, frontend_section
- `event_details`: Extended rich content for event pages (flexible dict)
- `certificate_records`: cert_id, type, ref_id, created_at
- `events`: Core event data, fee_tiers, registration_enabled
- `members`: Membership applications
- `admins`: Admin accounts

## Key API Endpoints
- `/api/public/events/{id}/details` - GET event detail page data
- `/api/admin/events/{id}/details` - PUT update event details (upsert)
- `/api/public/certificates/verify/{id}` - QR code verification
- `/api/admin/certificates/generate` - PDF generation with QR
- `/api/public/sitemap.xml` / `/api/public/robots.txt` - SEO

## Backlog / Upcoming Tasks
- **P1**: Public Member Directory with search & filter
- **P2**: Admin Role Management (Super Admin vs Event Manager)
- **P2**: Member subscription renewal/expiry reminders
- **P3**: Refactor server.py (~4100+ lines) into modular routes/models/services

## 3rd Party Integrations
- Razorpay (Payments) — Requires User API Key
- SMTP (Email) — Requires User Credentials
- AK Nexus WhatsApp API v2 — Requires User API Key

## Known Technical Notes
- Header Registration Number fetches from `page-content/about` → `cert_reg_number`
- Event PDFs are temporary; records saved to certificate_records, PDF buffer returned and discarded
- Backend event_details endpoint uses flexible dict storage with upsert
- QR code for venue uses external API: `https://api.qrserver.com/v1/create-qr-code/`
