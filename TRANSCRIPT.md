# Codeyoung Trial Booking — AI-Assisted Development Record

- **Project:** Codeyoung Trial Class Booking
- **Live application:** https://codeyoungassessment.vercel.app/
- **Record updated:** 2026-09-28

## Transcript note

I used Figma, Antigravity, and Cursor outside the current workspace, and their original response logs are not available here. I have recorded my tool use and prompt goals below; no external agent replies have been invented.


## AI tools and workflow

1. **Figma — UI/UX design.** I designed the interface in Figma using the supplied design brief.
2. **Google Antigravity — implementation assistance.** I provided Antigravity with the full-stack implementation brief.
3. **Cursor — implementation assistance.** I also used Cursor with the full-stack brief. I ran out of usage credits for both Antigravity and Cursor, so I continued with GitHub Copilot.
4. **GitHub Copilot — continued implementation.** Copilot was used to continue work on the existing repository, add the chatbot modes, make README/screenshot updates, and verify the code with the available build and test commands.

> The Figma/Antigravity/Cursor workflow above is my account of how I used those tools. Their raw session exports are not in this repository, so exact prompts, replies, and dates for those sessions cannot be reproduced here.

## Prompt record

The following records summarize the prompt briefs I supplied during the project. They are **summaries**, not claimed verbatim exports.

### Prompt 1 — Figma UI/UX design brief (my prompt, summarized)

Create a premium, parent-focused Codeyoung booking experience while preserving the existing purple/lavender identity, typography, rounded cards, whitespace, and booking layout. The brief calls for a minimal navigation and a welcoming landing hero, followed by a clear sequence for time selection, learner and parent details, review, mentor matching, confirmation, and joining a demo class. Specify the booking progress indicator, date and slot states, local-time/timezone presentation, booking summary, required guardian email, optional student email, form validation, loading/empty/error/success states, and join/copy-link actions. Include dedicated light and dark themes, a 1440/1280/768/390 responsive layout, accessible reduced-motion behavior, polished component states, and restrained 120–700 ms motion. Avoid replacing the product with a generic SaaS dashboard, excessive glass effects, or an unrelated visual concept.

**My outcome:** I designed the UI/UX in Figma and supplied it as the existing frontend foundation. The original Figma response/export is not included in this repository.

### Prompt 2 — Antigravity and Cursor full-stack brief (my prompt, summarized)

Work in the existing React application rather than rebuilding it. Keep routes, controllers, services, validators, Prisma, and configuration modular. The brief requests a Node.js/Express REST API; Mentor, Parent, Student, and Booking models; ten demo mentors; local SQLite plus a PostgreSQL schema; Zod validation; Luxon/IANA timezone conversion with UTC persistence; configurable India mentor work hours; a two-booking per mentor-local-day limit; overlap and double-booking checks; unique demo class links; parent and mentor emails; safe errors; environment templates; seed scripts; tests; and API/setup documentation. It specifically calls out required parent email, optional student email, US/UK DST, final booking rechecks, non-fatal email failures, and connecting the existing screens to real API responses without redesigning them.

**My outcome:** I used this brief with Antigravity and Cursor before running out of credits. I do not have their exact responses or a file-by-file contribution history, so I have not attributed specific code changes to either tool.

### Prompt 3 — GitHub Copilot chatbot/full-stack brief (my prompt, summarized)

Build a functional booking assistant inside the existing Codeyoung UI—not a standalone redesign or a fake static chat. The pasted prompt asks the assistant to be the main booking entry point: open it from the floating launcher and existing “Book a Free Trial” CTA; keep a five-stage booking state; collect/validate student and guardian details; request live availability in an IANA timezone; let the family choose date/time; show a mentor returned or previewed by backend availability; preserve details when changing time; review and explicitly confirm; submit the actual booking; and display the real response ID/class link. It also specifies 409/no-mentor/error handling, mobile behavior, email trigger, session handling, security, and end-to-end tests. It allows a structured conversational state machine instead of an LLM, but forbids made-up slots, mentors, or booking confirmations.

**Copilot response / verified implementation record:** the repository already contained an Express/Prisma booking backend and a React booking flow. Copilot continued that implementation rather than replacing the site: it added/adjusted the floating assistant placement, introduced separate Booking and General chat modes, and extended General chat with rule-based answers and quick questions. The booking assistant code calls the existing availability and booking API client. This is not an LLM integration; general chat responses are deterministic client-side FAQ matching.

**Acceptance-gap note:** this implementation is API-connected, but it does not meet every item in the supplied chatbot brief. Booking is completed through structured form fields and date/time/mentor controls inside the panel, not by parsing all details from natural-language messages. The landing-page “Book a Free Trial” CTA still navigates to the separate full booking page rather than opening the chatbot. General chat uses local FAQ matching, not an LLM or backend conversation endpoint. No live PostgreSQL booking/email end-to-end test was performed.

## GitHub Copilot work recorded in this workspace

The following changes were made or verified during the Copilot-assisted workspace sessions:

- Inspected the existing React/Vite frontend, Express routes and services, Prisma schemas, API client, tests, and setup scripts before editing.
- Added a fixed bottom-right chatbot launcher and moved the widget outside the landing page's clipping container so the fixed position could render.
- Kept the existing booking assistant and added a separate General chat tab with its own message history, suggestions, and answers about trials, ages/programs, mentors, scheduling, equipment, and beginner experience.
- Confirmed the booking flow uses the existing API client for live availability and booking creation; the backend contains timezone-aware availability, mentor assignment, Prisma booking creation, class-link generation, and optional notifications.
- Replaced the brand code glyph with the supplied yellow/orange mark and registered an SVG favicon.
- Updated `README.md` to document the project, actual setup commands, live URL, API, submission requirements, and screenshots. Uploaded screenshots are stored under `Premium Trial Class Booking/public/` and referenced with HTML `<img>` tags.
- Adjusted two Resend tests to isolate sender/API-key configuration so they do not depend on the developer's live `.env` settings.

## Detailed GitHub Copilot session log (condensed)

This section records the important prompt → response/action pairs from the available Copilot work. It is a condensed reconstruction, not a word-for-word dump of every turn.

### A. Inspect and integrate the existing chatbot

**My prompt (summary):** “Make the chatbot appear in the bottom-right corner when clicked.”

**Copilot response/action:** Located the existing `DemoChatbotWidget` in `Premium Trial Class Booking/src/App.tsx`. Rather than create another chatbot, retained its existing booking flow, added a round fixed-position launcher, and styled the open panel above it in `src/index.css`.

**My follow-up:** “It did not appear.”

**Copilot response/action:** Traced the visibility issue to the widget being nested inside the landing page, which uses clipping/animation styles. Moved the widget to a sibling of the page container so its fixed position could render, then opened the app in the integrated browser and verified that the launcher appeared and opened the assistant.

### B. Split booking and general conversation

**My prompt (summary):** Add one option for booking and another for general conversation.

**Copilot response/action:** Added a `mode` state with `booking` and `general` values, separate message histories, and a two-button bottom navigation. Booking mode retains the existing details/time/mentor/review/confirmed stages. General chat has a free-text input and popular-question buttons. The general responses use local keyword matching for price, age/programs, mentor, schedule, timezone, preparation, beginner experience, and class format; no external LLM is called.

**My follow-up:** Add more details for General chat.

**Copilot response/action:** Expanded those deterministic replies and added quick questions for trial details, age groups, preparation, and booking. A browser check sent trial, preparation, and booking questions, observed the corresponding answers, and switched back to Booking successfully.

### C. Apply the supplied logo

**My prompts (summary):** Use the supplied logo in the site brand and browser tab/address area.

**Copilot response/action:** Replaced the shared brand’s code glyph with an SVG recreation of the uploaded yellow/orange mark, added `public/favicon.svg`, and registered that SVG as the Vite favicon in `Premium Trial Class Booking/index.html`. The production frontend build succeeded.

### D. Rework README and use the uploaded project screenshots

**My prompts (summary):** Make the README impressive for the assignment, include the live URL, use the uploaded images, remove the mentor photo, and use the same image-embedding style as the mentor image.

**Copilot response/action:** Rewrote the project README with product overview, journey, architecture, setup, API, tests, deployment, submission instructions, and a screenshot gallery. After the user showed that the first gallery links rendered as broken in their preview, searched the repository, found the uploaded `light.jpg`, `dark.jpg`, `chatbot.jpg`, `chatbot1.jpg`, `student.jpg`, `parent.jpg`, `time.jpg`, `draft.jpg`, `conform.jpg`, `parent mail.jpg`, and `mentor mail.jpg` under the generated `dist/` folder, and copied them into `Premium Trial Class Booking/public/`. Updated the gallery to use HTML `<img>` tags with encoded spaces, matching the mentor-image pattern. Removed the separate mentor-photo block when asked. Confirmed that every linked public image exists locally.

**My follow-up:** Remove the mentor photo from the README.

**Copilot response/action:** Removed the standalone mentor `<img>` and changed the gallery introduction so it no longer referred to that image.

### E. Make this transcript accurate

**My prompt (summary):** Record my use of Figma for UI/UX, Antigravity and Cursor for implementation prompts, and GitHub Copilot for the chatbot; mention the supplied design/full-stack/chatbot prompts.

**Copilot response/action:** Replaced the old backend-only summary, which inaccurately described the local SQLite schema as PostgreSQL and overstated frontend integration, with this tool-use record. External tool activity is explicitly identified as user-reported; Copilot changes and project behavior are separated as repository-verified facts.

## Booking and conversation flow — implementation detail

### Booking assistant

1. The launcher opens the panel; the initial booking messages and **Start Booking** choice are present before the details stage starts.
2. The details panel collects student first name, age, grade, optional experience, optional student email, guardian name, required guardian email, and optional phone. `validateForm()` requires the student name, age, grade, guardian name, and a valid guardian email; student email is validated only when supplied.
3. The selected timezone defaults from the browser’s resolved IANA timezone, with a fallback of `America/New_York`. The time stage displays selectable weekdays and requests current data through `getAvailabilityData(date, timezone)`.
4. Only slots marked available by the API are displayed. Choosing a slot selects the mentor preview/available mentor included in that slot response; the frontend does not invent a mentor record.
5. The mentor stage offers **Accept mentor** and **Change time**. Changing time clears the selected time/mentor but retains student and parent details. The booking effect reloads availability when the flow returns to the time stage.
6. Review displays the collected student, parent, timezone, date/time, and selected mentor. Confirmation calls the shared `createBooking()` API client with those values and the selected mentor ID.
7. On success, the assistant stores and displays the booking response, including booking ID and class link. A `409` response displays a slot-taken message and returns the stage to time selection.

### Backend path invoked by the booking UI

```text
React booking assistant
  ├─ GET /api/availability?date=...&timezone=...
  │    └─ Express route → Zod query validation → AvailabilityController
  │         → AvailabilityService → MentorAssignmentService → Prisma
  └─ POST /api/bookings
	  └─ Express route → booking rate limit → Zod body validation
		  → BookingController → BookingService transaction
			  → mentor availability/capacity/overlap recheck
			  → Parent/Student/Booking Prisma writes
			  → unique demo class link
			  → asynchronous parent/mentor email attempts
```

The local Prisma schema (`server/prisma/schema.prisma`) uses SQLite. A distinct `schema.postgresql.prisma` and generation/push scripts exist for PostgreSQL deployments. No live PostgreSQL database or production email provider was exercised in the verification recorded here.

### General chat

General chat is a small deterministic FAQ responder, not a language model. It appends the visitor’s message to its own React state and selects a canned answer with keyword regular expressions. Supported topics include trial price, preparation/device needs, beginner experience, programs and ages, mentors, booking, timezones/weekday availability, online format, and trial duration. Unknown questions receive a fallback response. Because this mode is client-side and rule-based, it does not read/write booking data and should not be presented as an AI/LLM-backed service.

## Verified architecture and limitations

- **Frontend:** React 19, TypeScript, Vite, and Tailwind CSS. Booking and chat UI are in `Premium Trial Class Booking/src/App.tsx`; API calls are centralized in `src/services/api.ts`.
- **Backend:** Express routes include `GET /api/health`, `GET /api/availability`, `POST /api/bookings`, `GET /api/bookings/:id`, and `GET /api/bookings/:id/class-link`.
- **Storage:** `server/prisma/schema.prisma` is SQLite for local development. `server/prisma/schema.postgresql.prisma` is a separate PostgreSQL schema. The local build/test run does **not** prove that a live PostgreSQL deployment was exercised.
- **Timezone/mentor rules:** backend services use Luxon/IANA timezones, mentor-local day ranges, working hours, daily limits, overlap checks, and booking creation through Prisma transactions.
- **Email:** the backend supports Resend and SMTP/Nodemailer configuration. Emails are dispatched after booking creation and failures are treated as non-fatal. Automated email tests stub the provider; no claim is made that real email delivery was tested during this session.
- **Chat AI:** no LLM/API key is used for General chat. Its FAQ replies are rule-based. Booking data is submitted to the existing API; the chat UI is not a separate database or source of availability.
- **Class link:** generated links are demo links; there is no live video classroom integration.

## Verification performed

Commands run from the repository root:

```text
npm run build:client
npm run test:server
```

**Observed result:** frontend production build completed successfully; the server test suite reported **25 passed, 0 failed**. These checks do not constitute a live PostgreSQL, real-email, or deployed end-to-end acceptance test.

The 25 server tests were grouped as follows:

- **Booking service (3):** retain an available requested mentor; reject an unavailable requested mentor instead of silently substituting; reject the requested mentor outside work hours.
- **Class link and email (5):** generate unique class links; handle an email dispatch failure; prevent production Resend-sandbox redirection; send to the requested recipient when a verified sender is configured; use separate parent/mentor credentials and sender identities. Network calls are stubbed in tests.
- **Mentor assignment (5):** assign an active mentor during work hours; return the available mentor IDs; avoid an overlapping mentor; enforce the two-booking daily maximum; report no availability outside working hours.
- **Timezone and DST (6):** validate IANA zones; convert New York during EDT and EST; handle London BST/GMT; calculate mentor-local day across a date boundary; enforce mentor hours/weekdays.
- **Request validation (6):** accept valid payloads; allow omitted student email; reject invalid parent email; reject invalid/manual-offset timezones; accept valid availability query parameters; reject invalid date/timezone query parameters.

### Exact test cases in the repository

The names below are transcribed from the current `server/tests/` files:

**`bookingService.test.js`**
- “keeps the exact requested mentor when available”
- “rejects an unavailable requested mentor rather than substituting another”
- “rejects the requested mentor outside their working hours”

**`emailAndClassLink.test.js`**
- “generates unique live-class links for different bookings”
- “handles email dispatch errors safely without throwing”
- “refuses to silently redirect production parent email through the Resend sandbox”
- “sends production email directly to the requested parent with a verified sender”
- “uses separate parent and mentor Resend credentials and sender identities”

**`mentorAssignment.test.js`**
- “automatically assigns an active mentor during working hours”
- “returns exact available mentor IDs for the selected time”
- “prevents overlapping bookings for the same mentor”
- “enforces maximum 2 trial classes per mentor per local calendar day”
- “returns no availability when slot is outside mentor working hours”

**`timezone.test.js`**
- “validates correct and incorrect IANA timezones”
- “correctly converts parent time in America/New_York to UTC during Daylight Saving Time (EDT, UTC-4)”
- “correctly converts parent time in America/New_York to UTC during Standard Time (EST, UTC-5)”
- “correctly handles Europe/London DST changes (BST UTC+1 vs GMT UTC+0)”
- “calculates mentor local calendar day accurately across day boundaries”
- “enforces mentor working hours (10:00 AM to 9:00 PM Asia/Kolkata, Monday-Friday)”

**`validation.test.js`**
- “validates successful booking payload with required parent and student data”
- “passes when student email is omitted (student email is optional)”
- “rejects when parent email is missing or invalid”
- “rejects when timezone is invalid or manual offset”
- “validates availability query params with valid date and timezone”
- “rejects availability query params with invalid date format or timezone”

## Raw session exports still needed for the assignment

Before submission, append the original prompt-and-response exports for Figma, Antigravity, Cursor, and any Copilot sessions not already included. This reconstructed record intentionally does not claim to be a complete verbatim export where source logs were unavailable.
