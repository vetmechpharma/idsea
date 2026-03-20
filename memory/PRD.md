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

### Event Registration System V2 - COMPLETE (March 2026)
- **4 Participant Categories:** Member (phone lookup), Non-Member, Student/JRF/SRF/RA/Retired, International Delegate
- **All non-member categories** require full address (Line 1, Line 2, District, State, Pincode/Postal Code) + Identity Proof PDF upload
- **Student** additionally requires College/University + Bonafide Certificate PDF
- **International** fees in USD, Razorpay only, full address with country + postal code
- **Fee Tiers:** Early Bird & Regular with per-category fees
- **Accommodation:** Default (per-category fees), Self (no fee), Premium Hotels (room types with INR + USD prices, tax %)
- **Free Accommodation:** Admin configurable per category
- **Additional Persons:** Name, age, mobile; INR + USD per-person fees
- **Optional Add-ons:** Admin-created with INR/USD fees and downloadable PDFs
- **Become a Member:** Available for Non-Members, Students & International Delegates
- **Venue Map Link:** Google Maps URL in events - shown in public pages, emails, WhatsApp

### Admin Event Management - COMPLETE (March 2026)
- **EventsAdmin:** 5-tab modal (Basic, Fees, Accommodation, Hotels, Add-ons)
- **Event Image Upload:** Upload images for events, thumbnail in admin list
- **Event Brochure Upload:** PDF upload with "Download Brochure" button on public page
- **Premium Hotels Admin:** Room types with both INR and USD prices + tax %
- **View Registrations Button:** Links to full registration management page
- **EventRegistrations Page:** View/Edit/Delete registrations, Manual registration, Excel/PDF export, Room allotment, WhatsApp/Email messaging

### Membership Plans - Dynamic Management
- Admin CRUD at /admin/membership-plans
- Plans: Academic, Entrepreneur, Corporate, International (with INR + USD fees)

### WhatsApp Integration (AK Nexus) - WORKING
### Payment System - Multi-method | Membership System | Admin Panel (18+ sections)

## Testing: iterations 1-18 all pass

## Backlog
- P1: Member Directory (public), News & Contact pages
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3300 lines)
