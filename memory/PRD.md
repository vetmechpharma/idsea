# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with a public-facing website and comprehensive admin panel for managing members, events, publications, gallery, payments, certificates, and more.

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- **Backend:** FastAPI (Python), Motor (async MongoDB driver)
- **Database:** MongoDB
- **Auth:** JWT (python-jose, passlib/bcrypt)
- **Payments:** Razorpay (when configured), UPI QR (qrcode lib), Bank Transfer

## Architecture
- SPA frontend with React Router
- RESTful API backend with FastAPI
- MongoDB for all data persistence
- JWT-based admin authentication

## User Decisions
- **Payment:** Razorpay / UPI / Bank Transfer (Razorpay keys not yet provided, UPI+Bank Transfer fully functional)
- **Email:** SMTP (credentials not yet provided)
- **Auth:** Simple username/password login
- **Membership Types:** Academic (Rs 3,100), Entrepreneur (Rs 5,100), Corporate (Rs 25,100)

## Default Admin Credentials
- Email: admin@idsea.org
- Password: Admin@123

## What's Been Implemented

### Backend (server.py)
- Admin authentication (login, JWT, role-based)
- Full CRUD for: Members, Events, News, Gallery (Albums + Photos), Publications, Executive Committee
- Executive Committee supports two categories: `founder` (Patron/Founders) and `council` (Executive Council)
- All founders & EC members are linked to members via `member_id`
- 20 seed members auto-created (academic, entrepreneur, corporate types)
- 6 Patron/Founders + 19 Executive Council members seeded with member links
- Payment management (Razorpay order/verify, UPI QR generation, Bank Transfer, UTR submission/verification)
- Payment Settings CRUD (admin manages bank accounts + UPI IDs)
- Email system (SMTP + logs)
- Certificate generation
- CMS settings management
- Reports & analytics dashboard
- Admin user/role management
- Public endpoints for all content types

### Payment System (NEW - Completed)
- Multi-method payment support: Razorpay (online), UPI (QR code), Bank Transfer
- Admin Payment Settings page to manage bank accounts and UPI IDs
- UPI QR code auto-generated with correct payment amount
- UTR submission for manual payment verification
- Admin can approve/reject UTR payments
- Payment step integrated as Step 5 in event registration flow
- Conditional payment step: only shown when total > 0, skipped for free registrations

### Admin Panel (15 sections)
1. Dashboard - Stats, recent activity, quick actions
2. Members Management - CRUD, approve/reject, search/filter
3. Payments - View payments, record manual payments
4. Events Management - CRUD with full event details, fee tiers, accommodation config, registration management
5. Event Registrations - Full detail view, filters, search, accommodation assignment, room/location/map management
6. News & Announcements - CRUD with categories
7. Gallery Management - Albums + photos CRUD
8. Publications Management - CRUD with categories
9. Email System - Compose, group targeting, logs
10. Executive Committee - CRUD with ordering
11. Certificate Generator - Generate for members
12. Reports & Analytics - Stats, distribution, state analysis
13. CMS Settings - Hero, about, vision/mission, contact, social
14. Slider Management - Add/edit/delete/reorder homepage sliders with image upload
15. Payment Settings - Manage Razorpay status, bank accounts, UPI IDs

### Public Website
1. Home - Dynamic slider carousel, stats, about, membership types, events, news, CTA
2. About - Vision/mission, objectives, executive committee, HQ
3. Members Directory - Search, filter by state/type
4. Events - Filter by status, full event details, Register Now button
5. Event Registration - Multi-step: Fee Overview -> Participant -> Details -> Accommodation -> Review -> Payment -> Success
6. Publications - Category filters, paper details
7. Gallery - Albums, photo lightbox
8. Contact - Info + contact form
9. Membership Application - Type selection, full form, success flow

## Testing Status
- iteration_1: Backend 30/30, Frontend all pass (core features)
- iteration_2: Backend 12/12, Frontend all pass (founders/EC)
- iteration_3: Backend 24/24, Frontend all pass (cert PDF, exports, upload, SMTP, charts)
- iteration_4: Backend 15/15, Frontend all pass (email template system)
- iteration_5: Backend 15/15, Frontend all pass (homepage slider feature)
- iteration_6: Backend 20/20, Frontend all pass (event registration system)
- iteration_7: Backend 15/15, Frontend all pass (accommodation system)
- iteration_8: Backend 12/12, Frontend all pass (event registration management)
- iteration_9: Backend 14/14, Frontend 80% (payment system - Step 5 bug found)
- iteration_10: Backend 12/12, Frontend 100% (payment system - ALL PASS, Step 5 bug FIXED)

## Backlog / Future Tasks
- **P1:** Full Member Directory with search/filter on public site
- **P1:** Build remaining public pages: News & Announcements improvements, Contact improvements
- **P1:** WhatsApp API configuration for automated messages
- **P2:** Admin Role Management (Super Admin vs. other roles)
- **P2:** Member subscription renewal/expiry reminders
- **P3:** Mobile responsive design improvements
- **P3:** Backend refactoring (server.py 2600+ lines -> modular structure)
