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
- Email: admin@idsea.org
- Password: Admin@123

## What's Been Implemented

### Payment System (Complete)
- Multi-method: Razorpay (online), UPI (QR code), Bank Transfer
- Admin Payment Settings: Razorpay key config, enable/disable toggles, bank/UPI CRUD
- Admin Payments page: full management with approve/reject/edit/delete/refund
- Razorpay auto-capture: directly updates registration status to Paid
- UPI/Bank: UTR submission with manual verification workflow
- Refund tracking with status propagation to registrations/memberships
- Integrated into both event registration (Step 5) and membership application

### Membership System (Complete - Latest)
- **Custom Membership ID**: ACD/IDSEA/YYYY/NNNN (Academic), ENT/IDSEA/YYYY/NNNN (Entrepreneur), COP/IDSEA/YYYY/NNNN (Corporate)
- ID generated on **approval only**, serial auto-incremented per type per year
- **Name Prefix**: Dr., Mr., Mrs., Ms., Prof., Shri, Smt. (both public + admin)
- **Structured Address**: Line 1, Line 2, Line 3, State, District, Pincode
- **Two addresses**: Permanent + Contact with "same as permanent" checkbox
- **Photo Upload**: File upload (not URL paste), max 5MB, JPG/PNG/WebP
- **Admin Actions**: Approve/Deny/Hold buttons, Send Email from member page
- **Change Type**: Admin can change membership type with auto ID regeneration
- **Member Detail Modal**: Shows all info including addresses

### Event System (Complete)
- Complex fee tiers with early-bird deadlines
- Accommodation: default, premium hotel, self, waiver for certain categories
- Multi-step registration: Fee Overview → Participant → Details → Accommodation → Review → Payment → Success
- Admin: event CRUD, registration management, filters, Excel/PDF export, accommodation assignment

### Admin Panel (16 sections)
1. Dashboard 2. Members 3. Payments 4. Events 5. Event Registrations
6. News 7. Gallery 8. Publications 9. Email System 10. Email Templates
11. Executive Committee 12. Certificates 13. Reports 14. CMS Settings
15. Slider Management 16. Payment Settings

### Public Website
1. Home (dynamic slider) 2. About 3. Members Directory 4. Events
5. Event Registration 6. Membership Apply 7. Publications 8. Gallery 9. Contact

## Testing Status
- iteration_1-4: Core features (all pass)
- iteration_5-8: Slider, event registration, accommodation, reg management (all pass)
- iteration_9-10: Payment system integration (all pass)
- iteration_11: Payment system overhaul (92% backend, 100% frontend)
- iteration_12: Membership system overhaul (100% backend, 100% frontend)

## Backlog / Future Tasks
- **P1:** Full Member Directory with search/filter on public site
- **P1:** Build/improve News & Announcements, Contact pages
- **P2:** Admin Role Management (Super Admin vs other roles)
- **P2:** Member subscription renewal/expiry reminders
- **P3:** Mobile responsive design improvements
- **P3:** Backend refactoring (server.py 2700+ lines → modular)
