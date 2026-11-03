# CampusFind — Project presentation notes

## Problem statement
Students routinely misplace books, ID cards, calculators, earphones, and other belongings on campus. Information about these items is often scattered across informal messages or word of mouth. CampusFind provides one searchable place for students to report lost/found items and coordinate their return.

## Objective
Develop a responsive full-stack web application that centralizes campus lost-and-found reports, supports photo-based listings and search, and provides a controlled claim workflow with administrator moderation.

## Main modules
1. Authentication and role management.
2. Lost/found listing management.
3. Search and filtering.
4. Image upload and item detail view.
5. Claim submission and decision workflow.
6. Student activity dashboard.
7. Administrator dashboard and moderation.

## Architecture
- React single-page frontend.
- Express REST API.
- JWT-based authentication; passwords hashed with bcryptjs.
- SQLite relational database (users, items, claims).
- Local upload storage for listing photos.

## Database entities and relationships
- **Users**: one user can create many item reports and submit many claims.
- **Items**: each item belongs to one reporting user; an item can receive multiple claims.
- **Claims**: each claim belongs to one item and one claimant.

Relationship summary: `Users 1 — many Items`; `Users 1 — many Claims`; `Items 1 — many Claims`.

## Example viva questions

**Why did you choose this problem?**
Lost belongings are a common campus problem. Reports are often spread between class groups and word of mouth, so a central searchable board makes the process easier to follow.

**Why is this a full-stack project?**
The React interface communicates with an Express backend through REST APIs. The backend validates requests, authenticates users, stores records in SQLite, and manages uploaded photos.

**Where is authentication implemented?**
The backend verifies email/password credentials, stores only a bcrypt password hash, issues a signed JWT, and checks the token on protected routes.

**How does the claim workflow work?**
A signed-in student can send a claim on an active found listing. The reporter can approve or reject the claim. Approval resolves the item and rejects other pending claims for that item.

**What is CRUD in this project?**
Create reports, read/search reports, update report details/status, and delete (soft-remove) reports.

**Why SQLite?**
It is a relational database suitable for a small college application. It supports foreign keys and relationships without requiring a separate database server for the demo.

**How are uploads handled?**
Multer validates the image MIME type and size, saves the file in the server's uploads folder, and the database stores its generated filename.

**What would you improve next?**
Institutional email verification, email notifications, cloud image storage, audit logs, stronger moderation, deployment with HTTPS, and database backups.
