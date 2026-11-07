# CampusFind — Campus Lost & Found Portal

🌐 **Live Website:** https://campusfind-uewl.onrender.com

A full-stack campus lost-and-found application built with React, Node.js, Express, and SQLite. Students can report lost or found belongings, search campus listings, upload photos, submit claims for found items, and manage their reports. Administrators get an overview dashboard, listing moderation, and a registered-user view.

## Features

### Student experience
- Student registration, login, and logout.
- Browse active lost and found listings.
- Search by keyword and filter by listing type, category, and location.
- View full listing details, including photo, date, location, and description.
- Create, edit, and remove your own reports.
- Upload an optional item photo (JPG, PNG, WEBP, or GIF; maximum 5 MB).
- Mark your own report as resolved.
- Submit a claim on an active found-item listing.
- View claims you have sent and claims received on your own found-item listings.
- Approve or reject a claim. Approval marks the item as resolved and rejects other pending claims for that item.

### Administrator experience
- Pre-seeded administrator account.
- Dashboard statistics for listings, lost items, found items, resolved items, students, and pending claims.
- View recent reports and all active/resolved listings.
- Remove inappropriate or outdated listings from the public board.
- View registered student accounts and their listing counts.

### Backend
- REST API with JWT authentication and password hashing (bcryptjs).
- SQLite database powered by sql.js (no separate database server or native build tools required).
- Local image storage through Multer.
- Protected student and administrator routes.
- Basic authentication rate limiting and security headers.

## Requirements

- Node.js 20 or newer (Node.js 22 LTS is suitable).
- npm (installed with Node.js).
- Windows, macOS, or Linux.

## Run locally on Windows

Open PowerShell in the extracted `campusfind` folder.

1. Install the root development tool:

   ```powershell
   npm install
   ```

2. Install backend dependencies:

   ```powershell
   npm --prefix backend install
   ```

3. Install frontend dependencies:

   ```powershell
   npm --prefix frontend install
   ```

4. (Recommended) Create your local backend environment file:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

   The default values work for a local college demo. Change `JWT_SECRET` before using the application beyond a local demonstration. The demo admin credentials are controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD` in this file.

5. Start the application:

   ```powershell
   npm run dev
   ```

6. Open **http://localhost:5173** in your browser. The Express API runs at **http://localhost:5000**.

The first server start automatically creates the SQLite database, adds the demo accounts, and inserts sample lost/found listings. You do not need to set up MongoDB, MySQL, or another database service.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@campusfind.edu` | `Admin123!` |
| Student | `aarav.demo@campusfind.edu` | `Student123!` |
| Student | `diya.demo@campusfind.edu` | `Student123!` |
| Student | `rohan.demo@campusfind.edu` | `Student123!` |

For a presentation, log in as the administrator to show the admin dashboard. Use a student account to create a listing and demonstrate the claim workflow. You can also register a fresh student account.

## Production build (optional)

From the project root:

```powershell
npm run build
npm start
```

Then open **http://localhost:5000**. The Express server serves the built React application and API from the same port.

## Data and reset

- SQLite database: `backend/data/campusfind.sqlite`
- Uploaded images: `backend/uploads/`

To reset the demo data, stop the backend and delete `backend/data/campusfind.sqlite`. On the next start, the database and sample listings are recreated. Uploaded photos are kept; delete files inside `backend/uploads/` separately if you also want to clear them.

## Main API routes

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create student account | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/auth/me` | Get current account | Yes |
| GET | `/api/items` | Browse/search/filter listings | No |
| GET | `/api/items/:id` | View listing details | No |
| POST | `/api/items` | Create a report | Yes |
| GET | `/api/items/mine` | View your reports | Yes |
| PATCH | `/api/items/:id` | Edit/resolve your report | Owner/admin |
| DELETE | `/api/items/:id` | Remove your report | Owner/admin |
| POST | `/api/items/:id/claims` | Submit a claim on a found item | Yes |
| GET | `/api/claims/mine` | View sent/received claims | Yes |
| PATCH | `/api/claims/:id/approve` | Approve a claim | Owner/admin |
| PATCH | `/api/claims/:id/reject` | Reject a claim | Owner/admin |
| GET | `/api/admin/overview` | Dashboard statistics | Admin |
| GET | `/api/admin/items` | List reports for moderation | Admin |
| GET | `/api/admin/users` | List registered users | Admin |
| PATCH | `/api/admin/items/:id/remove` | Remove a listing | Admin |

All protected routes expect `Authorization: Bearer <token>`.

## Suggested demonstration sequence

1. Open the home page and show the sample listings.
2. Log in as a student and submit a new **found** item with a photo.
3. Log out and log in as a different student account.
4. Open the new found-item listing and submit a claim with a verification detail.
5. Log back in as the reporting student and open **My activity → Claims on my items**.
6. Approve the claim and show the listing changing to **Resolved**.
7. Log in as the administrator and show the statistics, listing moderation, and user list.

## Notes / scope

- Claims are intentionally enabled for **found** listings. A claimant should include a non-public identifying detail in their message. Do not ask students to post ID numbers, passwords, OTPs, or other sensitive information.
- Contact details are optional and are displayed only when the reporter chooses to enter them.
- Email sending, live chat, maps, and push notifications are not included; they are not required for the core demonstration.
- This is a college demonstration project. Before public deployment, configure a strong private JWT secret, HTTPS, stricter file-content validation, backups, and an institutional account policy.
