# IDSEA (Indian Dairy Scientists and Entrepreneurs Association) - PRD

## Original Problem Statement
Build a full-stack website for IDSEA containing a public-facing site and comprehensive admin panel. Core requirements include complex event registrations, membership management with international delegate support, a custom visual Certificate Design Module for bulk PDF generation, a WhatsApp marketing campaign system utilizing the AK Nexus v2 API, and fully dynamic CMS capabilities.

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, react-helmet-async, axios
- **Backend**: FastAPI (Python), Motor (async MongoDB), Pydantic
- **Database**: MongoDB
- **PDF**: reportlab + qrcode[pil]
- **WhatsApp**: AK Nexus v2 API
- **Email**: SMTP (configurable via admin)

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
- Hero banner with gallery image slider, countdown timer
- Colorful Important Dates with status badges
- Committee members with profile photos and fallback avatar
- Google Maps iframe embed, QR Code for navigation
- Nearby Sightseeing cards, Travel info sections
- Awards as medal badges with ribbons
- Sponsorship packages with colored header cards
- Mobile responsive with proper grid stacking

### Email Template & Campaign System (DONE - July 15, 2026)
- **7 Default Templates**: Registration Submitted, Membership Approved, Membership Rejected, Event Notification, Event Participation Certificate, Event Registration Confirmed, Certificate Issued
- **Custom Template CRUD**: Create/edit/delete user-defined templates
- **Rich Text Toolbar**: Bold, Italic, Heading, Link, Image, List, Color text, Info Box, Table, HR insertion
- **Template Editor**: HTML editing with variable placeholders (click to copy)
- **Template Preview**: Renders with sample data, shows in modal
- **Email Queue System**: Batch processing — 50 emails per batch, 1 batch every 5 minutes
- **Queue Dashboard**: Stats (Pending/Sent/Failed/Processing), retry failed, clear sent
- **Campaign Sending**: Select template + recipient group (All/Academic/Entrepreneur/Corporate), queue for batch delivery
- **Email Logs Tab**: View sent/queued/failed email history
- **Background Scheduler**: Auto-starts on app startup, processes pending queue continuously
- **SMTP Configuration**: Editable via admin settings (host, port, user, pass, from_email)
- **Auto Triggers**: Event creation → notify all members, Registration → confirmation email, Membership approval/rejection → notification, Certificate → notification

### Certificate System (DONE)
- Visual drag-and-drop Certificate Designer (V2)
- QR code on certificates with unique ID
- Public /verify portal for certificate verification

### Executive Committee (DONE)
- Dedicated /ec-members page with sub-division categorization

### WhatsApp Campaigns (DONE - MOCKED)
- Campaign dashboard with AK Nexus v2 API contracts

## Key DB Collections
- `cms_settings`, `page_contents`: CMS data
- `executive_committee`: EC members
- `event_details`: Extended event page content
- `certificate_records`: QR verification records
- `events`, `members`, `admins`: Core data
- `email_templates`: Email template storage (merged with defaults)
- `email_queue`: Batch email queue (pending/sent/failed)
- `email_logs`: Email send history
- `smtp_settings`: SMTP configuration

## Backlog / Upcoming Tasks
- **P1**: Public Member Directory with search & filter
- **P2**: Admin Role Management (Super Admin vs Event Manager)
- **P2**: Member subscription renewal/expiry reminders
- **P3**: Refactor server.py (~4500+ lines) into modular routes/models/services

## 3rd Party Integrations
- Razorpay (Payments) — Requires User API Key
- SMTP (Email) — Configurable via Admin settings
- AK Nexus WhatsApp API v2 — Requires User API Key
