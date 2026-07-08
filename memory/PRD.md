# IDSEA - Indian Dairy Scientists and Entrepreneurs Association

## Tech Stack
- Frontend: React 19, TailwindCSS, Shadcn/UI, react-helmet-async, react-slick
- Backend: FastAPI, Motor (MongoDB), Reportlab (PDF), httpx
- Database: MongoDB | Auth: JWT | Payments: Razorpay
- WhatsApp: AK Nexus v2 | SMTP for emails

## Admin: admin@idsea.org / Admin@123

## Completed Features

### Event Detail Page System - COMPLETE (Jul 5, 2026)
- **Rich Event Landing Page** (`/events/:eventId`) with sections: Hero with countdown timer, About/Welcome with objectives & highlights, Conference Themes (numbered), Important Dates (cards), Registration Fee Table (from fee_tiers), Awards, Sponsorship Packages (tiered with benefits), Conference Committee, Hotels/Accommodation, Venue & Travel (how to reach, weather, sightseeing), Contact Persons, Bottom Register CTA
- **Event Visibility Toggle** — `is_visible` field, Hide/Show button in admin, public listing filters hidden events
- **Admin Event Detail Editor** (`/admin/events/:eventId/details`) — Full page editor with sections: Countdown Timer, About/Welcome Content, Themes, Important Dates (add/remove), Awards, Sponsors (add/remove with color), Committee (add/remove), Venue & Travel Info, Contact Persons
- **Event Cards** link to detail page with "View Details" button
- **Backend**: `event_details` collection, GET/PUT APIs for public and admin

### Dynamic CMS & Page Content - COMPLETE
### SEO & Google Indexing - COMPLETE  
### Custom Scripts Injection - COMPLETE
### Certificate Design Module V2 - COMPLETE
### EC Members Page with Sub-Divisions - COMPLETE
### Membership Registration (4 plans + International) - COMPLETE
### WhatsApp v2 Marketing Campaigns - COMPLETE
### Mobile Responsive - ALL Pages - COMPLETE

## Backlog
- P2: Admin Role Management, Member renewal reminders
- P3: Backend modularization (server.py 4000+ lines)
