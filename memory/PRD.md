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

### WhatsApp Integration (AK Nexus) - WORKING
- **API Format**: v1 query-param based (`/api/send?number=...&type=text&message=...&instance_id=...&access_token=...`)
- Admin page at `/admin/whatsapp` with 3 tabs: Configuration, Send Messages, Message Logs
- Simple config: paste Access Token + Instance ID (instance created on AK Nexus server)
- Auto notifications for 6 events: membership submitted/approved/denied, event registration, room allotment, payment received
- Bulk messaging to all members (with type filter) or event registrants
- Message logs with status tracking (sent/failed)
- Webhook endpoint for AK Nexus callbacks

### Payment System - Multi-method (Razorpay/UPI/Bank), admin management
### Membership System - Custom IDs, structured forms, admin approve/deny/hold
### Event Registration - Multi-step public flow, admin management with exports
### Admin Panel (17+ sections)

## Testing: iterations 1-14 all pass

## Backlog
- P1: Member Directory (public), News & Contact pages
- P2: Admin Roles, Member renewal reminders
- P3: Mobile responsive, Backend modularization
