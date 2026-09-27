# Codeyoung Trial Class Booking System

A production-ready Trial Class Booking System designed for Codeyoung. This system allows parents (primarily in US/UK timezones) to seamlessly book 45-minute live trial coding classes for their children, while automatically matching and assigning mentors located in India (Asia/Kolkata timezone) without manual mentor selection.

---

## 🌟 Key Features

1. **Seamless Booking Flow**:
   - Step 1: Select Date & Time (with live timezone conversion and availability checking).
   - Step 2: Enter Learner & Parent contact details with validation.
   - Step 3: Review Booking summary before confirmation.
   - Step 4: Finding Mentor loading animation, followed by Confirmed status with unique dummy live-class link.
2. **Timezone & Daylight Saving Time (DST) Intelligence**:
   - Source-of-truth timestamps stored in **UTC**.
   - Preserves recipient context: Parent sees their local time (e.g. `10:00 AM EDT`), Mentor sees their local time (e.g. `7:30 PM IST`).
   - Uses strict **IANA identifiers** (`America/New_York`, `Europe/London`, `Asia/Kolkata`) and **Luxon** for accurate DST offset transitions (EST vs EDT, GMT vs BST).
3. **Automatic Mentor Assignment**:
   - Parents do **not** manually choose a mentor. The backend algorithm automatically selects an active, available mentor.
   - Respects configurable mentor working hours (**Monday–Friday, 10:00 AM – 9:00 PM Asia/Kolkata**).
   - Enforces a strict **maximum of 2 trial classes per mentor per local calendar day** (evaluated on the mentor's local date, not UTC).
   - Prevents overlapping bookings with atomic database transactions.
4. **Resilient Email System (Resend API & Nodemailer)**:
   - Real email delivery integrated with **Resend API** (set `RESEND_API_KEY` in the server environment) using verified sender `Codeyoung <onboarding@resend.dev>`.
   - Dispatches localized confirmation emails to Parents and notification emails to Mentors.
   - Email dispatch errors are safely caught and logged without failing confirmed bookings.
5. **Security & Production Best Practices**:
   - Helmet security headers, CORS protection, express-rate-limit on booking endpoints.
   - Zod request validation for inputs, query params, and timezones.
   - Centralized error handling preventing internal database or credential leakage.
   - Preserves 100% of the existing frontend design system, light/dark mode, and responsive layout.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database & ORM**: SQLite for local development and PostgreSQL for deployment, via Prisma ORM
- **Validation**: Zod
- **Timezone Management**: Luxon (with standard IANA timezone handling)
- **Email Delivery**: Nodemailer
- **Frontend**: React 19, Vite, Tailwind CSS v4 (Existing UI & Design System)
- **Testing**: Node.js Test Runner (`node --test`)

---

## 📁 Repository Structure

```text
CODEYOUNG/
├── package.json                         # Root orchestration scripts
├── scripts/
│   └── start-dev.js                     # Dev runner for client & server
├── Premium Trial Class Booking/         # Frontend React + Vite Application
│   ├── src/
│   │   ├── App.tsx                      # Connected main application component
│   │   ├── index.css                    # Tailwind & Design tokens
│   │   ├── main.tsx                     # React entrypoint
│   │   └── services/
│   │       └── api.ts                   # Centralized frontend API client
│   └── vite.config.ts
└── server/                              # Express Backend Service
    ├── prisma/
    │   ├── schema.prisma                # Local SQLite schema
    │   ├── schema.postgresql.prisma     # PostgreSQL deployment schema
    │   └── seed.js                      # 10 Mentors seed data
    ├── src/
    │   ├── config/
    │   │   ├── constants.js             # Environment & working hours config
    │   │   └── prisma.js                # Prisma Client singleton
    │   ├── controllers/
    │   │   ├── availabilityController.js
    │   │   ├── bookingController.js
    │   │   └── healthController.js
    │   ├── middleware/
    │   │   ├── errorHandler.js          # Centralized safe error handler
    │   │   ├── rateLimiter.js           # Rate limiting middleware
    │   │   └── validateRequest.js       # Zod schema validation middleware
    │   ├── routes/
    │   │   └── apiRoutes.js             # REST API routes
    │   ├── services/
    │   │   ├── availabilityService.js   # Slot availability calculation
    │   │   ├── bookingService.js        # Transactional booking creation
    │   │   ├── classLinkService.js      # Unique live-class link generation
    │   │   ├── emailService.js          # Localized email notifications
    │   │   ├── mentorAssignmentService.js # Capacity & assignment engine
    │   │   └── timezoneService.js       # Luxon IANA/DST conversions
    │   ├── validators/
    │   │   ├── availabilityValidator.js
    │   │   └── bookingValidator.js
    │   ├── app.js                       # Express app configuration
    │   └── server.js                    # Server entrypoint
    ├── tests/
    │   ├── booking.test.js              # Integration & edge case tests
    │   ├── emailAndClassLink.test.js    # Link generator & email tests
    │   ├── mentorAssignment.test.js     # Mentor capacity & overlap tests
    │   ├── timezone.test.js             # Timezone & DST tests
    │   └── validation.test.js           # Zod schema tests
    ├── .env.example
    └── package.json
```

---

## ⚙️ Environment Variables

For local development, copy `server/.env.example` to `server/.env`. For production, use the safe templates `server/.env.production.example` and `Premium Trial Class Booking/.env.example` as references, then enter values in the Render and Vercel environment-variable dashboards. **Never commit actual `.env` files or real credentials.**

### Production environment settings

- **Render backend:** use `NODE_ENV=production`, set `CLIENT_URL` to the deployed Vercel site URL, and set `DATABASE_URL` to the Render PostgreSQL connection string. Configure Prisma with `npm run prisma:generate:postgres` in the build command. `PORT` is provided by Render. Set a new `RESEND_API_KEY` only in Render's private environment settings; use a sender address verified with Resend for production email delivery.
- **Vercel frontend:** set `VITE_API_BASE_URL` to `https://codeyoung.onrender.com/api` in the Vercel project's Environment Variables, then redeploy.

Do not copy placeholder values from the production template into a live service. Do not run database schema-push or seed commands against a database with existing booking data without first confirming the schema and taking a backup.

Local development example (`server/.env`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Local SQLite database (matches server/prisma/schema.prisma)
DATABASE_URL="file:./dev.db"

# Mentor Work Configuration
MENTOR_DEFAULT_TIMEZONE="Asia/Kolkata"
MENTOR_WORK_START_HOUR=10
MENTOR_WORK_END_HOUR=21
MENTOR_MAX_DAILY_CLASSES=2
CLASS_DURATION_MINUTES=45

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=""
SMTP_PASSWORD=""
EMAIL_FROM="Codeyoung <trial@codeyoung.com>"
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd "../Premium Trial Class Booking"
npm install
```

### 2. Database Migration & Seeding
```bash
cd server

# Generate Prisma Client
npx prisma generate

# Apply database schema
npx prisma db push

# Seed 10 active mentors
node prisma/seed.js
```

For a PostgreSQL deployment such as Render, configure `DATABASE_URL` with the PostgreSQL connection string and use `npm run prisma:generate:postgres` so Prisma generates from `prisma/schema.postgresql.prisma`. Apply the PostgreSQL schema once with `npm run prisma:push:postgres` before seeding. Do not use the local SQLite URL for a production database.

### 3. Running the Application

**Option A: Run Both Backend & Frontend Simultaneously (from workspace root)**
```bash
npm run dev
```

**Option B: Run Individually**
- Backend (Port 5000):
  ```bash
  cd server
  npm run dev
  ```
- Frontend (Port 8443 / 5173):
  ```bash
  cd "Premium Trial Class Booking"
  npm run dev
  ```

---

## 🧪 Running Tests

A comprehensive suite of 18 tests verifies timezone conversion, DST handling, daily mentor capacity limits, overlap prevention, validation, and safe error handling:

```bash
cd server
npm test
```

Test coverage includes:
- ✅ IANA timezone validation & rejection of manual offset strings (e.g. `UTC+5:30`).
- ✅ Daylight Saving Time transitions (America/New_York EST vs EDT, Europe/London GMT vs BST).
- ✅ Cross-boundary mentor local calendar day calculations.
- ✅ Mentor working hours filtering (10:00 AM – 9:00 PM Asia/Kolkata).
- ✅ Maximum 2 trial classes per mentor per local calendar day limit.
- ✅ Overlapping booking protection.
- ✅ Automatic mentor assignment with load-balancing.
- ✅ Required parent email & optional student email validation.
- ✅ Safe email failure handling (email outage does not fail confirmed bookings).

---

## 📡 API Endpoints

### 1. Health Check
`GET /api/health`
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "codeyoung-trial-booking-api",
  "timestamp": "2026-09-26T17:00:00.000Z"
}
```

### 2. Slot Availability
`GET /api/availability?date=YYYY-MM-DD&timezone=IANA_TZ`
- **Example**: `GET /api/availability?date=2026-09-30&timezone=America/New_York`
- **Response**: `200 OK`
```json
{
  "success": true,
  "date": "2026-09-30",
  "timezone": "America/New_York",
  "slots": [
    {
      "time": "10:00 AM",
      "available": true,
      "remainingMentors": 8,
      "localDisplay": "10:00 AM",
      "mentorDisplay": "7:30 PM IST"
    }
  ]
}
```

### 3. Create Booking
`POST /api/bookings`
- **Request Body**:
```json
{
  "parent": {
    "fullName": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "phone": "+1 555 123 4567",
    "timezone": "America/New_York"
  },
  "student": {
    "firstName": "John",
    "age": 12,
    "grade": "Grade 7",
    "codingExperience": "Beginner",
    "email": ""
  },
  "date": "2026-09-30",
  "time": "10:00 AM",
  "timezone": "America/New_York"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "booking": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "CONFIRMED",
    "classLink": "https://live.codeyoung.com/trial/CY-2846",
    "parentTime": "10:00 AM",
    "parentDate": "Wednesday, September 30, 2026",
    "parentTimezone": "America/New_York",
    "mentorTime": "7:30 PM IST",
    "mentorDate": "Wednesday, September 30, 2026",
    "mentorTimezone": "Asia/Kolkata",
    "mentor": {
      "id": "m01-uuid-0001",
      "name": "Alex Johnson",
      "role": "Coding Mentor"
    }
  }
}
```
- **Response when no mentor is available (409 Conflict)**:
```json
{
  "success": false,
  "message": "No mentor is available for this time slot. Please choose another time."
}
```

### 4. Get Booking Details
`GET /api/bookings/:id`

### 5. Get Live Class Link
`GET /api/bookings/:id/class-link`

---

## 🕒 How Timezone & Mentor Capacity Logic Works

1. **Instant Representation**: All bookings are stored in PostgreSQL using UTC timestamps (`startTimeUtc` and `endTimeUtc`).
2. **Mentor Local Date Evaluation**: To evaluate if a mentor has conducted >= 2 classes, the UTC start time is projected into the mentor's local timezone (`Asia/Kolkata`). The start of day (`00:00:00 IST`) and end of day (`23:59:59 IST`) are computed in UTC, ensuring mentors never conduct more than 2 classes in their own calendar day, regardless of parent timezones.
3. **Automatic Assignment & Concurrency**: The assignment engine runs inside a `prisma.$transaction`. It filters eligible mentors by working hours, checks current day capacity, checks for overlapping bookings, selects the mentor with the lowest load, and commits the booking atomically.
#   c o d e y o u n g 
 
 #   c o d e y o u n g 
 
 #   c o d e y o u n g 
 
 #   c o d e y o u n g 
 
 