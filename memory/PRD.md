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
- **4 Participant Categories:** Member, Non-Member, Student/JRF/SRF/RA/Retired, International Delegate
- **All non-member categories** require full address + Identity Proof PDF
- **Student** additionally requires College/University + Bonafide Certificate PDF
- **International** fees in USD, full address with country + postal code
- **Fee Tiers:** Early Bird & Regular with per-category fees
- **Accommodation:** Default, Self, Premium Hotels (INR + USD room prices, tax %)
- **Additional Persons:** INR + USD per-person fees
- **Optional Add-ons:** INR/USD fees, downloadable PDFs
- **Become a Member:** Available for Non-Members, Students & International Delegates

### Payment System - COMPLETE
- **International Delegates:** Razorpay ONLY, amount in USD ($), "Payment in USD via Razorpay" badge
- **Domestic (Member/Non-Member/Student):** UPI QR as PRIMARY default, Razorpay + Bank Transfer as secondary
- **Tab bar hidden** when only 1 payment option available
- **Currency-aware:** Backend passes correct currency to Razorpay orders

### Admin Event Management - COMPLETE
- Event Image Upload + Brochure PDF Upload/Download
- Premium Hotels with INR + USD room prices + tax %
- Additional Person Fee in INR + USD
- Venue Google Maps Link in events, emails, WhatsApp
- View Registrations button → full management page (view/edit/delete, manual registration, export, room allotment, WhatsApp)

### Membership Plans - Dynamic Management
### WhatsApp Integration (AK Nexus) - WORKING
### Admin Panel (18+ sections)

## Testing: iterations 1-19 all pass

## Backlog
- P1: Member Directory (public), News & Contact pages
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3300 lines)
