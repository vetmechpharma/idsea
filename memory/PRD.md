# IDSEA (Indian Dairy Scientists and Entrepreneurs Association) - PRD

## Original Problem Statement
Build a full-stack website for IDSEA containing a public-facing site and comprehensive admin panel. Core requirements include complex event registrations, membership management with international delegate support, a custom visual Certificate Design Module for bulk PDF generation, a WhatsApp marketing campaign system utilizing the AK Nexus v2 API, and fully dynamic CMS capabilities.

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Shadcn/UI, react-helmet-async, axios
- **Backend**: FastAPI (Python 3.11), Motor (async MongoDB), Pydantic v2
- **Database**: MongoDB 7.0
- **PDF**: reportlab + qrcode[pil]
- **WhatsApp**: AK Nexus v2 API
- **Email**: SMTP (configurable via admin)
- **Deployment**: Nginx + Supervisor + Let's Encrypt SSL

## What's Been Implemented

### Core CMS & Public Pages (DONE)
- Dynamic CMS for all pages, full SEO module, custom scripts injection, mobile responsive

### Membership System (DONE)
- Multi-step form, approval/rejection workflow, Razorpay, international delegates

### Event Management (DONE)
- Event CRUD, registration forms, fee tiers, event detail page with gallery/maps/committee/awards/sponsors

### Email Template & Campaign System (DONE - July 15, 2026)
- 7 default templates, custom template CRUD, rich text toolbar, queue scheduler (50/5min), campaign sending

### Certificate System (DONE)
- Drag-and-drop designer, QR verification, public /verify portal

### Executive Committee (DONE)
- /ec-members page with sub-division categorization

### WhatsApp Campaigns (DONE - MOCKED)

## Site-Wide QA Status (July 15, 2026)
- **Backend**: 29/29 API tests passed (100%)
- **Frontend**: 10/10 public pages + 17/17 admin pages = 27/27 (100%)
- **JavaScript Errors**: 0 across all pages
- **API Failures**: 0 across all pages
- **Ready for VPS deployment**: YES

## Backlog
- **P1**: Public Member Directory with search & filter
- **P2**: Admin Role Management
- **P2**: Member subscription renewal reminders
- **P3**: Refactor server.py into modular structure
