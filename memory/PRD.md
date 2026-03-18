# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with a public-facing website and comprehensive admin panel for managing members, events, publications, gallery, payments, certificates, and more.

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- **Backend:** FastAPI (Python), Motor (async MongoDB driver)
- **Database:** MongoDB
- **Auth:** JWT (python-jose, passlib/bcrypt)

## Architecture
- SPA frontend with React Router
- RESTful API backend with FastAPI
- MongoDB for all data persistence
- JWT-based admin authentication

## User Decisions
- **Payment:** Razorpay / UPI (keys not yet provided)
- **Email:** SMTP (credentials not yet provided)
- **Auth:** Simple username/password login
- **Membership Types:** Academic (₹3,100), Entrepreneur (₹5,100), Corporate (₹25,100)

## Default Admin Credentials
- Email: admin@idsea.org
- Password: Admin@123

## What's Been Implemented

### Backend (server.py)
- Admin authentication (login, JWT, role-based)
- Full CRUD for: Members, Events, News, Gallery (Albums + Photos), Publications, Executive Committee
- Executive Committee supports **two categories**: `founder` (Patron/Founders) and `council` (Executive Council)
- All founders & EC members are **linked to members** via `member_id`
- 20 seed members auto-created (academic, entrepreneur, corporate types)
- 6 Patron/Founders + 19 Executive Council members seeded with member links
- Payment management (manual + Razorpay order/verify stubs)
- Email system (SMTP + logs)
- Certificate generation
- CMS settings management
- Reports & analytics dashboard
- Admin user/role management
- Public endpoints for all content types

### Admin Panel (13 sections)
1. Dashboard - Stats, recent activity, quick actions
2. Members Management - CRUD, approve/reject, search/filter
3. Payments - View payments, record manual payments
4. Events Management - CRUD with full event details, fee tiers, accommodation config, registration management
5. Event Registrations - Full detail view, filters, search, accommodation assignment, room/location/map management
6. News & Announcements - CRUD with categories
6. Gallery Management - Albums + photos CRUD
7. Publications Management - CRUD with categories
8. Email System - Compose, group targeting, logs
9. Executive Committee - CRUD with ordering
10. Certificate Generator - Generate for members
11. Reports & Analytics - Stats, distribution, state analysis
12. CMS Settings - Hero, about, vision/mission, contact, social
13. Admin Roles - User management (super admin only)
14. Slider Management - Add/edit/delete/reorder homepage sliders with image upload

### Public Website Navigation
- Association-style header: Large emblem logo (90px) + uppercase org name on white background
- Dark navy (#0c3c60) menu bar below with white text links (Home, About Us, Membership, Events, Publications, Gallery, Contact Us, Join IDSEA, Admin)
- Active page highlighted with subtle white overlay
- Logo fetched dynamically from CMS settings (uploadable via admin)
- Responsive: hamburger menu on mobile
1. Home - Dynamic slider carousel (react-slick), stats, about, membership types, events, news, CTA
2. About - Vision/mission, objectives, executive committee, HQ
3. Members Directory - Search, filter by state/type
4. Events - Filter by status, full event details, Register Now button for open events
5. Event Registration - Multi-step form: Member/Non-member selection, phone lookup, details, accommodation, fee review
6. Publications - Category filters, paper details
6. Gallery - Albums, photo lightbox
7. Contact - Info + contact form
8. Membership Application - Type selection, full form, success flow

## Testing Status
- iteration_1: Backend 30/30, Frontend all pass (core features)
- iteration_2: Backend 12/12, Frontend all pass (founders/EC)
- iteration_3: Backend 24/24, Frontend all pass (cert PDF, exports, upload, SMTP, charts)
- iteration_4: Backend 15/15, Frontend all pass (email template system)
- iteration_5: Backend 15/15, Frontend all pass (homepage slider feature)
- iteration_6: Backend 20/20, Frontend all pass (event registration system)
- iteration_7: Backend 15/15, Frontend all pass (updated accommodation system with tier-based default fees, premium hotels, self-accommodation with suggestions, free category waiver)
- iteration_8: Backend 12/12, Frontend all pass (event registration management - filters, exports, accommodation assignment, email/WhatsApp)

## Backlog / Future Tasks
- **P1:** Razorpay/PayUMoney payment integration (user deferred)
- **P1:** WhatsApp API configuration for automated messages
- **P1:** Full Member Directory with search/filter on public site
- **P2:** Remaining public pages: News & Announcements, Contact
- **P2:** Member subscription renewal/expiry reminders
- **P3:** Admin Role Management (Super Admin vs. other roles)
- **P3:** Mobile responsive design improvements
