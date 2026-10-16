# Nazik Dhol — Full-Stack Website

A complete, production-style full-stack website for a professional dhol performance team, built with **HTML5/CSS3/vanilla JS** on the frontend and **Node.js + Express + MongoDB** on the backend.

Theme: Black & Gold, festival-premium, glassmorphism cards, smooth animations.

---

## ⚡ Quick Start (already configured)

A working `.env` is already included (pointed at local MongoDB: `mongodb://localhost:27017/nazikdhol`).
Just make sure **MongoDB is installed and running** on your machine, then:

```bash
npm install
npm run seed
npm run dev
```

Open **http://localhost:5000** — Admin login: `admin@nazikdhol.com` / `Admin@12345`
(Change these in `.env` any time.)

---

## Tech Stack

- **Frontend:** HTML5, CSS3 (custom design system, no framework), vanilla JavaScript (fetch-based SPA-lite pages)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (httpOnly cookie + Bearer token support), bcrypt password hashing, role-based access control
- **Uploads:** Multer (local disk storage under `backend/uploads`)
- **Email:** Nodemailer (optional — booking/contact flows work fine without SMTP configured)

## Folder Structure

```
nazik-dhol/
├── frontend/                 # Static frontend
│   ├── public/
│   │   ├── css/style.css
│   │   ├── js/              # main.js, content.js, auth.js, booking.js, dashboard.js, admin.js, misc.js
│   │   └── images/
│   ├── index.html, about.html, services.html, packages.html, team.html,
│   │   gallery.html, videos.html, booking.html, available-dates.html,
│   │   reviews.html, faq.html, contact.html, login.html, register.html,
│   │   forgot-password.html, dashboard.html, admin-dashboard.html
├── backend/
│   ├── config/         db.js, seed.js
│   ├── controllers/    authController, bookingController, crudFactory, reviewController, dateController, userController + generated service/package/team/gallery/video controllers
│   ├── models/         User, Booking, Service, Package, Team, Gallery, Video, Review, AvailableDate
│   ├── routes/         one file per resource
│   ├── middleware/     auth.js (protect/authorize/optionalAuth), upload.js, errorHandler.js
│   ├── utils/           generateToken.js, sendEmail.js
│   ├── uploads/         gallery/ team/ videos/ misc/
│   └── server.js        app entry point
├── package.json
└── .env.example
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`:
   - `MONGO_URI` — your MongoDB connection string (local or Atlas)
   - `JWT_SECRET` — any long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the seeded admin account
   - SMTP settings are optional; booking/contact flows degrade gracefully without them

3. **Seed starter data** (admin account, services, packages, team, reviews)
   ```bash
   npm run seed
   ```

4. **Run the server**
   ```bash
   npm run dev     # with nodemon
   # or
   npm start
   ```

5. Visit **http://localhost:5000**

   Admin login: the email/password you set in `.env` (defaults to `admin@nazikdhol.com` / `Admin@12345`).

## Key Features Implemented

- 16 pages: Home, About, Services, Packages, Team, Gallery, Videos, Booking, Available Dates, Reviews, FAQ, Contact, Login, Register, User Dashboard, Admin Dashboard
- JWT auth with role-based access (`user` / `admin`), password hashing via bcrypt
- Bookings stored in MongoDB with auto-generated booking codes, status workflow (pending → accepted/rejected → completed), and calendar sync to `AvailableDate`
- Admin dashboard: KPI overview, booking management (accept/reject/complete, search, filter, pagination), full CRUD for services/packages/team/gallery/videos (with image upload), review moderation, user management, manual calendar control
- User dashboard: profile editing, upcoming events, booking history, cancel booking, downloadable text receipt
- Public REST API under `/api/*` (services, packages, team, gallery, videos, reviews, bookings, dates, users, auth, contact)
- Image uploads via Multer, served from `/uploads`
- Interactive availability calendar (available / booked / holiday)
- Gallery lightbox with category filters
- FAQ accordion with category tabs
- Toast notifications, confirm modals, animated stat counters, scroll reveal animations
- WhatsApp floating button (reads number from `/api/config/public`), back-to-top button
- Fully responsive (mobile, tablet, desktop) with a mobile slide-in nav menu
- Centralized error handling, input validation, and a basic rate limiter on `/api`

## Notes

- The frontend is a **multi-page site**, not a bundler-based SPA — every `.html` file is a real page served statically by Express, with shared navbar/footer injected by `main.js` for consistency.
- All demo images use royalty-free Unsplash URLs as placeholders; replace with your own via the Admin → Manage Gallery/Team/Services panels (image upload is fully wired to Multer).
- `npm run seed` is destructive for the seeded collections (services/packages/team/reviews) — it clears and re-inserts them. Bookings and users are never touched by the seed script.
