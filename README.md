# WhyLearn Platform

Combined Express API and Next.js App Router app backed by JSON file storage. The goal is a fully local, testable stack for learning plans, gamification, and premium coaching.

## Requirements
- Node.js 18+
- npm 9+

## Quick Start
1. 
pm install
2. Copy .env.example to .env
3. Copy .env.local.example to .env.local
4. 
pm run dev

### Environment variables
src/config/env.ts validates the server config:
- PORT – Express + Next listening port (default 4000)
- WEB_PORT – unused in production but reserved for split dev workflows
- STRIPE_SECRET_KEY, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL – optional when enabling real Stripe checkout

Front-end builds read .env.local; we expose NEXT_PUBLIC_API_BASE_URL for client requests when needed.

## Storage
All application data lives in .data/ via the JsonFileDriver. Writes are atomic (tmp ? fsync ? rename) with journaling and daily backups. Tests use setupTestStorage() to isolate data under a temp directory.

## Scripts
- 
pm run dev – concurrently boot the API (src/server.ts) and Next.js app
- 
pm run build – build the Next.js frontend and compile TypeScript to dist/
- 
pm start – run the compiled Express + Next bundle
- 
pm test – Vitest unit + integration suite (API + UI components)
- 
pm run test:e2e – Playwright API flow hitting the in-memory server
- 
pm run test:lighthouse – Lighthouse CI against the production build
- 
pm run data:* – JSON storage maintenance CLI (migrate, validate, backup, export, import)

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

All API routes require a bearer session token issued by registration/login and enforced by equireAuth. Premium routes check entitlements via equirePremium.

## CLI
	sx src/cli/data/index.ts <command> powers migrations, validation, backups, exports, and imports on the JSON datasets.

## Architecture Notes
- Express mounts API routes first, then forwards the rest to Next.js via createApp({ nextHandler }).
- Storage adapters are swappable; src/storage/index.ts manages the current adapter.
- Tests stub external services and run completely offline.
