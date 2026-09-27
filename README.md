<p align="center">
  <img src="Premium%20Trial%20Class%20Booking/public/favicon.svg" alt="Codeyoung logo" width="88" />
</p>

<h1 align="center">Codeyoung Trial Class Booking</h1>

<p align="center">
  <strong>A thoughtful first step into coding—made simple for families.</strong><br />
  Book a free, mentor-led coding trial with clear scheduling, local times, and a guided experience from start to confirmation.
</p>

<p align="center">
  <a href="https://codeyoungassessment.vercel.app/"><strong>✨ Try the live application →</strong></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4-111111?logo=express&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
</p>

---

## Project snapshot

| | |
|---|---|
| **Live application** | [codeyoungassessment.vercel.app](https://codeyoungassessment.vercel.app/) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 |
| **Backend** | Node.js, Express 4, Zod |
| **Data** | Prisma ORM; SQLite for local development, PostgreSQL schema available |
| **Tests** | Node.js built-in test runner and Supertest |
| **AI session file** | [`TRANSCRIPT.md`](TRANSCRIPT.md) |

## The experience

Families can book a free, 45-minute coding trial for a learner. The interface walks them through learner and parent details, local date/time selection, an available mentor, and a final booking review. The experience is responsive and includes light and dark themes.

### Designed around a parent’s journey

| Step | What the family does | What the system handles |
|---|---|---|
| **01 · Learner** | Share the learner’s age, grade, interests, and guardian contact details. | Validate required fields and keep student email optional. |
| **02 · Schedule** | Choose a weekday, timezone, and available 45-minute slot. | Convert local time correctly across IANA zones and DST changes. |
| **03 · Mentor** | Review mentors available for the selected time. | Check work hours, daily limits, and overlapping bookings. |
| **04 · Confirm** | Review the details and confirm the free trial. | Save the booking and prepare parent/mentor notifications. |

### Product and engineering highlights

- **Booking assistant + general chat** — two focused modes; general answers are rule-based and do not call an external AI service.
- **Fair mentor assignment** — weekday working hours are 10:00–21:00 in Asia/Kolkata; each mentor is limited to two trials per local day.
- **Capacity feedback** — show slot availability and remaining daily capacity before confirmation.
- **Resilient notifications** — optional Resend or SMTP delivery; email errors are non-fatal to booking completion.
- **Secure API defaults** — Zod validation, Helmet headers, rate limiting, and centralized safe error responses.
- **Local-first setup** — SQLite and seeded demo mentors work without a separately managed database server.

> **Prototype note:** class links are generated as demo URLs. This project does not integrate a live video-classroom provider.

## Visual preview and screenshots

<p align="center">
  <img src="Premium%20Trial%20Class%20Booking/public/mentor.jpg" alt="Codeyoung coding mentor shown in the live application" width="280" />
</p>

These are the screenshots you uploaded for the project. Select any image to open it at full size.

<table>
  <tr>
    <td width="50%"><strong>Home · Light theme</strong><br /><a href="docs/screenshots/landing-light.jpg"><img src="docs/screenshots/landing-light.jpg" alt="Codeyoung home page in light theme" width="100%" /></a></td>
    <td width="50%"><strong>Home · Dark theme</strong><br /><a href="docs/screenshots/landing-dark.jpg"><img src="docs/screenshots/landing-dark.jpg" alt="Codeyoung home page in dark theme" width="100%" /></a></td>
  </tr>
  <tr>
    <td width="50%"><strong>Booking assistant</strong><br /><a href="docs/screenshots/booking-assistant.jpg"><img src="docs/screenshots/booking-assistant.jpg" alt="Booking assistant open on the Codeyoung home page" width="100%" /></a></td>
    <td width="50%"><strong>General chat</strong><br /><a href="docs/screenshots/general-chat.jpg"><img src="docs/screenshots/general-chat.jpg" alt="General chat mode open on the Codeyoung home page" width="100%" /></a></td>
  </tr>
  <tr>
    <td width="50%"><strong>Learner details</strong><br /><a href="docs/screenshots/student-details.jpg"><img src="docs/screenshots/student-details.jpg" alt="Learner details in the trial booking flow" width="100%" /></a></td>
    <td width="50%"><strong>Parent details</strong><br /><a href="docs/screenshots/parent-details.jpg"><img src="docs/screenshots/parent-details.jpg" alt="Parent details in the trial booking flow" width="100%" /></a></td>
  </tr>
  <tr>
    <td width="50%"><strong>Date, timezone & available times</strong><br /><a href="docs/screenshots/booking-availability.jpg"><img src="docs/screenshots/booking-availability.jpg" alt="Date, timezone, and available trial times" width="100%" /></a></td>
    <td width="50%"><strong>Booking review</strong><br /><a href="docs/screenshots/booking-review.jpg"><img src="docs/screenshots/booking-review.jpg" alt="Trial booking review before confirmation" width="100%" /></a></td>
  </tr>
  <tr>
    <td width="50%"><strong>Booking confirmation</strong><br /><a href="docs/screenshots/booking-confirmation.jpg"><img src="docs/screenshots/booking-confirmation.jpg" alt="Confirmed Codeyoung trial booking" width="100%" /></a></td>
    <td width="50%"><strong>Parent confirmation email</strong><br /><a href="docs/screenshots/parent-confirmation-email.jpg"><img src="docs/screenshots/parent-confirmation-email.jpg" alt="Parent trial confirmation email" width="100%" /></a></td>
  </tr>
  <tr>
    <td width="50%"><strong>Mentor notification email</strong><br /><a href="docs/screenshots/mentor-notification-email.jpg"><img src="docs/screenshots/mentor-notification-email.jpg" alt="Mentor booking notification email" width="100%" /></a></td>
    <td width="50%"></td>
  </tr>
</table>

The files are stored in `docs/screenshots/`, so the gallery works in GitHub and in cloned copies of the repository. Before making the repository public, check that the email and booking screenshots contain only safe demo data and no private addresses or real booking details.

## Architecture

```mermaid
flowchart LR
  Parent[Parent / guardian] --> UI[React + Vite web app]
  UI -->|JSON over HTTP| API[Express REST API]
  API --> Validate[Zod validation and rate limits]
  Validate --> Services[Booking, availability, timezone, mentor services]
  Services --> Prisma[Prisma ORM]
  Prisma --> DB[(SQLite locally / PostgreSQL schema)]
  Services -. optional notifications .-> Email[Resend or SMTP]
```

### Repository layout

```text
.
├── package.json                         # Root scripts for running/testing the app
├── scripts/start-dev.js                 # Starts frontend and backend together
├── docs/screenshots/                    # Add README screenshots here
├── TRANSCRIPT.md                        # AI-assisted implementation notes
├── Premium Trial Class Booking/         # React + Vite frontend
│   ├── public/                          # Public images and favicon
│   └── src/
│       ├── App.tsx                      # Pages, booking flow, and assistant
│       ├── index.css                    # Design system and responsive styles
│       └── services/api.ts              # Frontend API client
└── server/                              # Express + Prisma backend
    ├── prisma/                          # SQLite and PostgreSQL schemas, seed data
    ├── src/
    │   ├── controllers/                 # HTTP request handlers
    │   ├── middleware/                  # Validation, rate limiting, errors
    │   ├── routes/                      # REST API routes
    │   └── services/                    # Booking, scheduling, email, timezone
    └── tests/                           # Service, validation, and timezone tests
```

## Run locally

### Prerequisites

- Node.js supported by Vite 8 (Node 20.19+ or 22.12+ recommended)
- npm

### 1. Install dependencies

From the repository root:

```powershell
cd server
npm install
Copy-Item .env.example .env

cd "..\Premium Trial Class Booking"
npm install
cd ..
```

On macOS/Linux, replace `Copy-Item .env.example .env` with `cp .env.example .env`.

### 2. Prepare the local database

Run from the `server` directory:

```powershell
cd server
npx prisma generate
npm run prisma:push
npm run prisma:seed
cd ..
```

This uses the SQLite URL from `server/.env.example`; a separate database server is not required for local development. The seed command can be rerun safely to upsert the demo mentors.

### 3. Start the app

From the repository root, start both services:

```powershell
npm run dev
```

By default, the frontend is at **http://localhost:8443** and the API is at **http://localhost:5000**. Check the backend with [http://localhost:5000/api/health](http://localhost:5000/api/health).

You can also run services separately from the root in two terminals:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

### Email configuration

Email is optional for local development. With no email provider credentials, the app logs a dry-run message instead of sending mail. To test real delivery, configure a provider in `server/.env` using the variable names in [`server/.env.example`](server/.env.example). Use verified sender addresses for production.

Never commit `.env` files, API keys, database passwords, or real user data. Configure production values in your hosting provider’s private environment-variable settings.

## Build and test

From the repository root:

```powershell
npm run build:client
npm run test:server
```

Equivalent package-level commands:

```powershell
cd "Premium Trial Class Booking"
npm run build

cd ..\server
npm test
```

The server tests cover timezone conversion and daylight-saving behavior, booking validation, mentor assignment and capacity rules, class-link generation, and email failure handling.

## API reference

The API is mounted under `/api` (default local base URL: `http://localhost:5000/api`).

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/availability?date=YYYY-MM-DD&timezone=America%2FNew_York` | List slots and daily capacity for a date/timezone |
| `POST` | `/bookings` | Create a trial booking |
| `GET` | `/bookings/:id` | Retrieve booking details |
| `GET` | `/bookings/:id/class-link` | Retrieve the generated demo class link |

Example availability request:

```bash
curl "http://localhost:5000/api/availability?date=2026-09-30&timezone=America%2FNew_York"
```

A booking request contains `parent`, `student`, `date`, `time`, and an IANA `timezone`. `mentorId` is optional for API clients; when omitted, the backend assigns an available mentor. The frontend booking flow lets the family choose from mentors available for the selected slot.

## Database options

- **Local development:** `server/prisma/schema.prisma` uses SQLite and is configured by `DATABASE_URL` in `server/.env`.
- **PostgreSQL:** `server/prisma/schema.postgresql.prisma` is provided for hosted deployments. Configure a PostgreSQL `DATABASE_URL`, then from `server/` run `npm run prisma:generate:postgres` and, for a new database, `npm run prisma:push:postgres`.

Do not run schema-push or seed commands against a database containing important data without reviewing the schema and taking a backup.

## Deployment

The submitted frontend is available at [https://codeyoungassessment.vercel.app/](https://codeyoungassessment.vercel.app/). The frontend API base can be overridden with `VITE_API_BASE_URL`; production deployments should point it to the deployed backend’s `/api` URL and then rebuild/redeploy the frontend.

For a backend deployment, configure `DATABASE_URL`, `CLIENT_URL`, `NODE_ENV`, and `PORT` in the hosting provider. Generate Prisma using the schema that matches the selected database. Configure a verified email sender and private credentials only when email delivery is required.
