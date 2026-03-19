# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with a public-facing website and comprehensive admin panel.

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- Backend: FastAPI (Python), Motor (async MongoDB)
- Database: MongoDB | Auth: JWT | Payments: Razorpay, UPI QR, Bank Transfer

## Default Admin: admin@idsea.org / Admin@123

## Implemented Features

### Payment System - Multi-method (Razorpay/UPI/Bank), admin approve/reject/edit/delete/refund, enable/disable toggles
### Membership System - Custom IDs (ACD/ENT/COP/IDSEA/YYYY/NNNN), prefix, structured addresses, photo upload, approve/deny/hold
### Event Registration - Multi-step public flow (Fee Overview→Participant→Details→Accommodation→Review→Payment→Success)
### Event Registration Admin - Edit/Delete registrations, Manual registration with **member selection** (search existing members, auto-fill details), stats, filters, exports, accommodation assignment

### Admin Panel (16 sections)
Dashboard, Members, Payments, Events, Event Registrations, News, Gallery, Publications, Email System, Email Templates, Executive Committee, Certificates, Reports, CMS Settings, Slider Management, Payment Settings

### Public Website
Home, About, Members Directory, Events, Event Registration, Membership Apply, Publications, Gallery, Contact

## Testing (iterations 1-13 all pass)
- Latest: iteration 13 — Backend 12/12, Frontend 100%

## Backlog
- P1: Full Member Directory (public search/filter), News/Contact pages
- P2: Admin Role Management, Member renewal reminders
- P3: Mobile responsive, Backend modularization
