# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Problem Statement
Build a full-stack website for IDSEA with a public-facing website and comprehensive admin panel.

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, Axios, React Router v7, Lucide Icons
- Backend: FastAPI (Python), Motor (async MongoDB), httpx (for AK Nexus API)
- Database: MongoDB | Auth: JWT | Payments: Razorpay, UPI QR, Bank Transfer
- WhatsApp: AK Nexus API (https://app.aknexus.in/api/v2)

## Default Admin: admin@idsea.org / Admin@123

## Implemented Features

### Payment System - Multi-method (Razorpay/UPI/Bank), admin approve/reject/edit/delete/refund, enable/disable toggles
### Membership System - Custom IDs (ACD/ENT/COP/IDSEA/YYYY/NNNN), prefix, structured addresses, photo upload, approve/deny/hold
### Event Registration - Multi-step public flow (Fee Overview > Participant > Details > Accommodation > Review > Payment > Success)
### Event Registration Admin - Edit/Delete registrations, Manual registration with member selection, stats, filters, exports, accommodation assignment
### WhatsApp Integration (AK Nexus) - NEW (Feb 2026)
- Full admin page at `/admin/whatsapp` with 3 tabs: Configuration, Send Messages, Message Logs
- API Configuration: Access token, instance ID, enable/disable, auto-connect
- Instance Management: Connect, disconnect, status check, QR code scanning
- Automatic Notifications: membership submitted/approved/denied, event registration, room allotment, payment received
- Bulk Messaging: Send to all members (with type filter) or event registrants with personalization ({name})
- Message Logs: View all sent messages with status tracking
- Webhook endpoint for receiving AK Nexus callbacks

### Admin Panel (17 sections)
Dashboard, Members, Payments, Events, Event Registrations, News, Gallery, Publications, Email System, Email Templates, Executive Committee, Certificates, Reports, CMS Settings, Slider Management, Payment Settings, WhatsApp

### Public Website
Home, About, Members Directory, Events, Event Registration, Membership Apply, Publications, Gallery, Contact

## Testing (iterations 1-14 all pass)
- Latest: iteration 14 — Backend 26/26 (100%), Frontend 100%

## Backlog
- P1: Full Member Directory (public search/filter), News/Contact pages
- P2: Admin Role Management, Member renewal reminders
- P3: Mobile responsive, Backend modularization (server.py > 3000 lines)
