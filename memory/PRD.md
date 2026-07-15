# IDSEA — PRD

## Original Problem Statement
Build a full-stack website for IDSEA (Indian Dairy Scientists and Entrepreneurs Association) with public site, admin panel, membership, events, certificates, email campaigns, WhatsApp, and CMS.

## Tech Stack
React 18 + FastAPI + MongoDB + Nginx + Supervisor

## What's Implemented

### Core: CMS, SEO, Mobile Responsive (DONE)
### Membership System with Razorpay (DONE)
### Event Management + Rich Detail Page (DONE)
### Email Templates + Campaign Queue System (DONE)
### Certificate Designer + QR Verification (DONE)
### Executive Committee Pages (DONE)
### WhatsApp Campaigns (MOCKED)

### Deployment Cleanup (DONE - July 15, 2026)
- Removed `emergentintegrations` from requirements.txt
- Removed "Made with Emergent" watermark + posthog analytics from index.html
- Removed demo seed data (no executive/member data seeded on startup — only admin + CMS defaults)

### Backup & Restore System (DONE - July 15, 2026)
- **Database Backup**: Download all MongoDB collections as ZIP (JSON per collection)
- **Uploads Backup**: Download all photos/images/brochures as ZIP
- **Database Restore**: Upload backup ZIP to replace all collections
- **Uploads Restore**: Upload ZIP to restore files (with zip-slip protection)
- **Restore Paths**: Shows SSH restore path (`/var/www/idsea/backend/uploads/`)
- **System Info**: Stats cards (total docs, collections, file count, size MB)
- **Factory Reset**: Delete ALL data with `DELETE_ALL_DATA` confirmation, options to keep admin + clear uploads
- Temp file cleanup via BackgroundTask after ZIP downloads

## VPS Deployment
- Domain: idsea.in, Backend port: 8003
- Full install guide at `/app/deploy/INSTALL_GUIDE.sh` + PDF at `/app/deploy/IDSEA_VPS_Installation_Guide.pdf`

## Backlog
- **P1**: Public Member Directory with search & filter
- **P2**: Admin Role Management
- **P2**: Member subscription renewal reminders
- **P3**: Refactor server.py (~4600 lines) into modular structure
