# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with a public-facing website and comprehensive admin panel for managing members, events, publications, gallery, payments, certificates, and more.

## Tech Stack
- **Frontend:** React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- **Backend:** FastAPI (Python), Motor (async MongoDB driver)
- **Database:** MongoDB
- **Auth:** JWT (python-jose, passlib/bcrypt)
- **Payments:** Razorpay (configurable via admin), UPI QR (qrcode lib), Bank Transfer

## Default Admin Credentials
- Email: admin@idsea.org | Password: Admin@123

## What's Been Implemented

### Payment System (Complete)
- Multi-method: Razorpay, UPI (QR code), Bank Transfer
- Admin: approve/reject/edit/delete/refund, Razorpay key config, enable/disable toggles
- Integrated into event registration (Step 5) and membership application

### Membership System (Complete)
- Custom ID: ACD/IDSEA/YYYY/NNNN, ENT/IDSEA/YYYY/NNNN, COP/IDSEA/YYYY/NNNN (on approval)
- Name prefix (Dr./Mr./Mrs./Ms./Prof./Shri/Smt.), structured addresses, photo upload
- Admin: Approve/Deny/Hold, Send Email, Change Type with auto ID regeneration

### Event Registration Admin (Complete - Latest)
- **Edit Registration**: Admin can modify all fields (name, email, fees, payment status, accommodation)
- **Delete Registration**: With confirmation dialog, refreshes list
- **Manual Admin Registration**: Register participants directly, set fees & payment status
- Stats cards, filters, Excel/PDF/Accommodation exports, accommodation assignment

### Admin Panel (16 sections)
Dashboard, Members, Payments, Events, Event Registrations, News, Gallery, Publications, Email System, Email Templates, Executive Committee, Certificates, Reports, CMS Settings, Slider Management, Payment Settings

### Public Website
Home, About, Members Directory, Events, Event Registration, Membership Apply, Publications, Gallery, Contact

## Testing Status (All Pass)
- iterations 1-8: Core features, slider, event registration, accommodation, reg management
- iterations 9-10: Payment integration
- iteration 11: Payment system overhaul (approve/reject/edit/delete/refund)
- iteration 12: Membership system overhaul (prefix, addresses, photo, ID format)
- iteration 13: Event registration admin (edit/delete/manual) — 100% backend, 100% frontend

## Backlog
- **P1:** Full Member Directory (public search/filter)
- **P1:** News & Announcements, Contact page improvements
- **P2:** Admin Role Management, Member renewal reminders
- **P3:** Mobile responsive, Backend modularization
