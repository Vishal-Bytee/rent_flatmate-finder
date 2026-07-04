# Rent & Flatmate Finder

A full-stack platform that matches tenants to room listings using an AI-scored
compatibility engine, with real-time chat, owner/tenant/admin roles, and
email notifications.

---

## Table of contents

- [Project overview](#project-overview)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Folder structure](#folder-structure)
- [Installation](#installation)
- [Database setup](#database-setup)
- [Prisma migrations](#prisma-migrations)
- [Environment variables](#environment-variables)
- [Running the backend](#running-the-backend)
- [Running the frontend](#running-the-frontend)
- [Deployment](#deployment)
- [API documentation](#api-documentation)
- [Database schema](#database-schema)
- [LLM prompt](#llm-prompt)
- [Screenshots](#screenshots)
- [Future improvements](#future-improvements)

---

## Project overview

Tenants set a budget, preferred location, and move-in date. Owners list
rooms. Every time a tenant profile changes or a new listing appears, the
platform scores compatibility between the two (0–100) using Google's Gemini
API, with a deterministic rule-based fallback if the LLM is slow,
rate-limited, or returns malformed output. Search results are sorted by that
score. When a tenant expresses interest and the owner accepts, a private
real-time chat room opens between them, backed by Socket.io with full
message persistence.
Email:    admin@rentflatmate.app
Password: ChangeMe123!



### Admin access for evaluators

Running `npm run seed` (see [Prisma migrations](#prisma-migrations) below)
creates an admin account automatically:


## Architecture

```
┌────────────────┐        REST + JWT         ┌─────────────────┐
│   React (Vite)  │ ────────────────────────▶ │  Express API     │
│   Tailwind CSS  │ ◀──────────────────────── │  (TypeScript)    │
└────────┬────────┘        Socket.io          └────────┬─────────┘
         │                (real-time chat)              │
         │                                     ┌─────────┴─────────┐
         │                                     │  Service layer     │
         │                                     │  (business logic)  │
         │                                     └─────────┬─────────┘
         │                                     ┌─────────┴─────────┐
         │                                     │ Repository layer   │
         │                                     │ (Prisma ORM)       │
         │                                     └─────────┬─────────┘
         │                                     ┌─────────┴─────────┐
         │                                     │  PostgreSQL (Neon) │
         │                                     └────────────────────┘
         │
         ├──▶ Cloudinary (listing photos)
         ├──▶ Gemini API (compatibility scoring, with rule-based fallback)
         └──▶ Brevo / Gmail SMTP (transactional email)
```

The backend follows a layered MVC-style architecture:

- **Routes** — wire HTTP verbs + middleware (auth, role, validation, rate
  limiting) to controllers.
- **Controllers** — thin, translate HTTP requests into service calls and
  format the response.
- **Services** — all business logic (compatibility scoring, interest flow,
  email triggers, admin stats) lives here.
- **Repositories** — the only layer that talks to Prisma directly, so data
  access is isolated and swappable.

## Tech stack

**Frontend:** React 18 + Vite, TypeScript, Tailwind CSS, React Router,
Socket.io Client, native `fetch` (no HTTP library), and a small
dependency-free toast module

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL,
Socket.io, JWT auth, bcryptjs

**AI:** Google Gemini (`gemini-1.5-flash` by default, free tier) with a
rule-based fallback scorer

**Email:** Nodemailer over Brevo or Gmail SMTP

**Images:** Cloudinary

**Deployment targets:** Vercel (frontend), Render/Railway (backend), Neon
(PostgreSQL)

## Features

- JWT auth with Tenant / Owner / Admin roles, bcrypt password hashing,
  role-based route guards on both API and frontend
- Owner: create/edit/delete listings, multi-photo upload via Cloudinary,
  mark filled, accept/decline interest requests, view active chats
- Tenant: budget/location/move-in profile, browse & filter listings, see a
  compatibility score + plain-English explanation per listing, send
  interest requests, chat once accepted
- AI compatibility engine: Gemini-scored, cached in Postgres (never
  recomputed on every request), invalidated automatically when a tenant
  profile or listing changes, with an automatic rule-based fallback
- Star ratings: any logged-in tenant can rate a room 1–5 stars with an
  optional comment (one rating per tenant per listing, editable); the
  average is shown on listing cards and search results without extra
  round-trips (batch-aggregated server-side)
- Real-time chat: Socket.io, JWT-authenticated sockets, private room per
  accepted request, persisted messages, typing indicators, auto-scroll
- Email notifications: owner is emailed when a >80% match sends interest;
  tenant is emailed on accept/decline
- Admin dashboard: platform-wide stats, user deactivation, listing removal
- Security: Helmet, CORS allowlist, rate limiting (global + stricter on
  auth), Zod validation on every mutating endpoint, Prisma parameterized
  queries (no raw SQL)
- UI: dark mode, loading skeletons, toast notifications instead of native
  alerts, confirmation modals instead of `confirm()`, empty states,
  responsive layout

## Folder structure

```
rent-flatmate-finder/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts                 # seeds the admin user
│   └── src/
│       ├── config/                 # env, Prisma client, Cloudinary
│       ├── controllers/            # HTTP layer
│       ├── services/                # business logic (incl. AI engine)
│       ├── repositories/            # Prisma data access
│       ├── routes/
│       ├── middleware/             # auth, roles, validation, rate limit
│       ├── validators/             # Zod schemas
│       ├── socket/                 # Socket.io setup + chat events
│       ├── utils/
│       ├── app.ts
│       └── index.ts
└── frontend/
    └── src/
        ├── api/                    # native fetch client + typed endpoint calls
        ├── components/
        ├── context/                # AuthContext
        ├── hooks/                  # useAuth, useSocket, useDarkMode
        ├── pages/
        ├── types/
        ├── App.tsx
        └── main.tsx
```

## Installation

Requires Node.js 20.6+ (the backend uses Node's native `--env-file` and
`--watch` flags instead of `dotenv`/`nodemon`, so no extra tooling
dependency is needed) and a PostgreSQL database (Neon recommended for a
free hosted instance).

```bash
git clone <your-repo-url>
cd rent-flatmate-finder

cd backend && npm install
cd ../frontend && npm install
```

## Database setup

1. Create a free Postgres database at [neon.tech](https://neon.tech) (or
   use a local Postgres instance).
2. Copy the connection string into `backend/.env` as `DATABASE_URL`.

## Prisma migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed          # creates the admin user (see .env for credentials)
```

`npx prisma studio` opens a GUI browser for the database if you want to
inspect data directly.

## Environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill
in the values.

**backend/.env**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | long random string for signing tokens |
| `GEMINI_API_KEY` | free key from [aistudio.google.com](https://aistudio.google.com/app/apikey) — leave blank to always use the rule-based fallback |
| `GEMINI_MODEL` | defaults to `gemini-1.5-flash` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Brevo or Gmail SMTP credentials |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from your Cloudinary dashboard |
| `CLIENT_URL` | frontend origin, for CORS |

**frontend/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | e.g. `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | e.g. `http://localhost:5000` |

## Running the backend

```bash
cd backend
npm run dev        # http://localhost:5000
```

## Running the frontend

```bash
cd frontend
npm run dev         # http://localhost:5173
```

## Deployment

**Frontend → Vercel:** import the `frontend/` folder as the project root,
build command `npm run build`, output directory `dist`. Set
`VITE_API_URL` and `VITE_SOCKET_URL` to your deployed backend URL.

**Backend → Render / Railway:** import the `backend/` folder, build
command `npm install && npx prisma generate && npm run build`, start
command `npm start`. Set all backend env vars from the table above, plus
`CLIENT_URL` pointing at your Vercel deployment.

**Database → Neon:** create a project, copy the pooled connection string
into `DATABASE_URL` on the backend host, then run
`npx prisma migrate deploy` once against production.

## API documentation

All routes are prefixed with `/api`. Authenticated routes require
`Authorization: Bearer <token>`.

**Auth**
```
POST   /api/auth/register        { name, email, password, role, phone? }
POST   /api/auth/login           { email, password }
GET    /api/auth/me              (auth required)
```

**Listings**
```
GET    /api/listings             ?location=&minRent=&maxRent=&page=
GET    /api/listings/:id
POST   /api/listings             (owner)
PUT    /api/listings/:id         (owner)
DELETE /api/listings/:id         (owner)
PATCH  /api/listings/:id/fill    { isFilled }  (owner)
POST   /api/listings/:id/images  multipart "images" field, up to 8 (owner)
POST   /api/listings/tenant/profile   (tenant)
GET    /api/listings/tenant/profile   (tenant)
GET    /api/listings/:id/ratings           list of ratings + average summary
POST   /api/listings/:id/ratings      { stars, comment? }  (tenant, upserts)
GET    /api/listings/:id/ratings/mine (tenant)
```

**Compatibility**
```
POST   /api/compatibility/generate   { listingId }  (tenant)
```

**Interest requests**
```
POST   /api/interests              { listingId }  (tenant)
GET    /api/interests              (tenant sees theirs, owner sees theirs)
PATCH  /api/interests/:id/accept   (owner)
PATCH  /api/interests/:id/decline  (owner)
```

**Chat**
```
GET    /api/chat/:roomId/messages
```
Socket.io events: `join-room`, `send-message`, `receive-message`,
`typing`, `stop-typing`.

**Admin**
```
GET    /api/admin/dashboard
GET    /api/admin/users
DELETE /api/admin/users/:id        (deactivates)
GET    /api/admin/listings
DELETE /api/admin/listings/:id
```

Every response follows `{ success, message, data }`.

## Database schema

Defined in `backend/prisma/schema.prisma`: `User`, `TenantProfile`,
`OwnerProfile`, `Listing`, `ListingImage`, `CompatibilityScore`,
`InterestRequest`, `ChatRoom`, `Message`, `Notification` — normalized with
foreign keys and cascading deletes so removing a listing or user cleans up
its images, scores, requests, and chat history.

## LLM prompt

Sent to Gemini whenever a listing or tenant profile changes and no cached
score exists:

```
Given the following room listing
Location: <listing.location>
Rent: <listing.rent>
Room Type: <listing.roomType>
Furnishing: <listing.furnishingStatus>
Available Date: <listing.availableFrom>

and the following tenant profile
Preferred Location: <tenant.preferredLocation>
Budget Range: <tenant.minimumBudget> - <tenant.maximumBudget>
Move-in Date: <tenant.moveInDate>

Return ONLY valid JSON in this exact format, with no markdown fences and no
extra text:
{"score": 85, "explanation": "Budget matches well and preferred location is
exactly matched."}

Rules:
- score must be an integer between 0 and 100.
- explanation must be under 40 words.
```

**Example input:** a listing in "Koramangala" at ₹18,000/mo, available
2026-08-01, vs. a tenant preferring "Koramangala" with budget
₹15,000–₹20,000 and move-in 2026-08-10.

**Example output:**
```json
{ "score": 92, "explanation": "Exact location match and rent comfortably within budget; move-in dates are just over a week apart." }
```

If the API call fails, times out (10s), hits a rate limit, or returns
invalid JSON, the service silently falls back to the rule-based scorer
(exact location match +60, budget fit +30, move-in within 30 days +10,
capped at 100) and stores that result with `source: RULE_BASED` instead of
`LLM` — the tenant never sees an error, just a score.

## Screenshots

_Add screenshots here once you've run the app locally — e.g. Browse page,
listing details with compatibility score, owner dashboard, chat._

## Future improvements

- Saved searches + email digests for new matching listings
- In-app read receipts and unread message badges
- Map view for browsing listings geographically
- Owner analytics (views, interest conversion rate per listing)
- Automated tests (Jest/Vitest + Supertest) and CI pipeline
- Refresh tokens / token rotation instead of a single long-lived JWT
