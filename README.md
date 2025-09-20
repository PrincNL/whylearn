# WhyLearn Platform

Combined Express API and Next.js App Router app backed by JSON file storage. The goal is a fully local, testable stack for learning plans, gamification, and premium coaching.

## Requirements
- Node.js 18+
- npm 9+

## Quick Start
1. `npm install`
2. Copy `.env.example` to `.env`
3. Copy `.env.local.example` to `.env.local`
4. `npm run dev`

### Environment variables
`src/config/env.ts` validates server configuration. Key entries:
- `APP_URL` – base URL for the web app; used when building password reset links (defaults to `http://localhost:WEB_PORT`).
- `DATA_DIR` – directory for JSON datasets (default `.data`).
- `PORT` / `WEB_PORT` – API listener + companion web port.
- `MAIL_FROM` / `MAIL_FROM_NAME` – friendly sender shown in outgoing emails.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` – configure SMTP delivery. When omitted the system logs reset links instead of sending them.
- `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL` – optional payment integration.
- `CORS_ORIGINS` – comma separated list of allowed browser origins (defaults to `http://localhost:WEB_PORT`).

Front-end builds read .env.local and use `NEXT_PUBLIC_API_ORIGIN` to reach the API.

### Password reset emails
WhyLearn now generates branded reset emails via the SMTP settings above. During development you can leave the SMTP variables unset to have links logged to the console. In production, supply working credentials and set `APP_URL` to the public site so emails route learners to the correct reset screen.

## Storage
All application data lives in the directory defined by DATA_DIR (default `.data`) via the JsonFileDriver. Writes are atomic (tmp -> fsync -> rename) with journaling and daily backups. Tests use setupTestStorage() to isolate data under a temp directory.

## Scripts
- `npm run dev` – concurrently boot the API (`src/server.ts`) and Next.js app.
- `npm run build` – build the Next.js frontend and compile TypeScript to `dist/`.
- `npm start` – run the compiled Express + Next bundle.
- `npm test` – Vitest unit + integration suite (API + UI components).
- `npm run test:e2e` – Playwright API flow hitting the in-memory server.
- `npm run test:lighthouse` – Lighthouse CI against the production build.
- `npm run data:*` – JSON storage maintenance CLI (migrate, validate, backup, export, import).

## Testing & QA
- UI: React Testing Library covers form validation, language toggle, skip link, etc.
- API: Supertest exercises authentication, progress, gamification, coaching, subscriptions, and a full premium upgrade flow.
- E2E: Playwright spins up the Express app in-memory and performs register ? progress ? upgrade ? coaching.
- Accessibility & Performance: 
pm run test:lighthouse asserts =0.95 across performance, accessibility, SEO, and best practices.

## API Overview
- POST /api/auth/register|login|logout|reset/*
- POST /api/progress and GET /api/progress/:userId
- POST /api/gamification and GET /api/gamification/:userId
- POST /api/coaching and GET /api/coaching/:userId
- POST /api/subscriptions and GET /api/subscriptions/:userId
- GET /health

All API routes require a bearer session token issued by registration/login and enforced by 
equireAuth. Premium routes check entitlements via 
equirePremium.

## CLI
	sx src/cli/data/index.ts <command> powers migrations, validation, backups, exports, and imports on the JSON datasets.

## Architecture Notes
- Express mounts API routes first, then forwards the rest to Next.js via createApp({ nextHandler }).
- Storage adapters are swappable; src/storage/index.ts manages the current adapter.
- Tests stub external services and run completely offline.
