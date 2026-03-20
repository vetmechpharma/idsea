# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with a public-facing website and comprehensive admin panel.

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- Backend: FastAPI (Python), Motor (async MongoDB), httpx
- Database: MongoDB | Auth: JWT | Payments: Razorpay, UPI QR, Bank Transfer
- WhatsApp: AK Nexus v1 API (https://app.aknexus.in/api) - query param auth

## Default Admin: admin@idsea.org / Admin@123

## Implemented Features

### Event Registration System V2 - COMPLETE (March 2026)
- **4 Participant Categories:** IDSEA Member (phone lookup), Non-Member (address + ID proof PDF), Student/JRF/SRF/RA/Retired (college + bonafide PDF), International Delegate (USD fees, Razorpay only)
- **Fee Tiers:** Early Bird & Regular with per-category fees
- **Accommodation:** Default (per-category fees), Self (no fee), Premium Hotels (with room types, tax %)
- **Free Accommodation:** Admin can enable free accommodation for specific categories
- **Additional Persons:** Guests with name, age, mobile; admin-set per-person fee
- **Optional Add-ons:** Admin-created (name, description, INR/USD fees, downloadable PDF)
- **Become a Member:** Non-Members, Students & International Delegates can apply for dynamic membership plans during registration
- **Admin Pages:** EventsAdmin (5-tab modal: Basic, Fees, Accommodation, Hotels, Add-ons), MembershipAdmin (CRUD for plans)

### Membership Plans - Dynamic Management (March 2026)
- Admin page at /admin/membership-plans with full CRUD
- Default plans: Academic (₹3,100/$50), Entrepreneur (₹5,100/$75), Corporate (₹25,100/$300), International ($100)
- Enable/disable toggle per plan
- Plans exposed via /api/public/membership-plans for registration flow

### WhatsApp Integration (AK Nexus) - WORKING
- **API Format**: v1 query-param based
- Admin page at `/admin/whatsapp` with 3 tabs: Configuration, Send Messages, Message Logs
- Auto notifications for 6 events
- Bulk messaging to members/registrants

### Payment System - Multi-method (Razorpay/UPI/Bank), admin management
### Membership System - Custom IDs, structured forms, admin approve/deny/hold
### Admin Panel (18+ sections)

## Testing: iterations 1-16 all pass

## Backlog
- P1: Member Directory (public), News & Contact pages
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3200 lines)
