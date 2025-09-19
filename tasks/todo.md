# WhyLearn — Phase 6+ Full App with JSON Storage

## Principes
- Eén server: **Express API + Next.js App Router** in één proces (`npm run start`).
- **Lokale dataopslag in `.data/`**: JSON-bestanden per dataset.
- **StorageAdapter** abstractie: drivers mogen wisselen, maar **JsonFileDriver** is standaard.
- Geen externe database. Alle data staat in files, veilig en makkelijk te migreren.
- Data-integriteit: atomic writes, journaling, dagelijkse backups.
- Migraties: nooit dataverlies, altijd rollback mogelijk.

---

## 1) Storage & CLI Fundament
- [x] Definieer alle datamodellen (conceptueel, geen SQL):
  - Users (id, email, hashedPassword, premiumTier, createdAt)
  - LearningPlans (id, userId, goal, milestones[], timestamps)
  - Progress (id, userId, planId, entries[], totals, streaks)
  - Gamification (id, userId, points, badges[], level, history[])
  - Coaching (id, userId, snapshots[], lastAdviceAt)
  - Subscriptions (id, userId, tier, status, renewedAt, cancelAt)
- [x] Bouw **StorageAdapter interface** (read, write, query).
- [x] Implementeer **JsonFileDriver**:
  - Atomic writes: tmp → fsync → rename.
  - File locking + append-only journal voor crash recovery.
  - Dagelijkse backup naar `.data/backups/YYYY-MM-DD/`.
- [x] Helpermodules: ID-generator, schema-validator, journaling utils.
- [x] Tests voor JsonFileDriver (concurrentie, corruptie, recovery).

---

## 2) CLI Tools
- [x] `data:migrate`: detecteer versie, voer conversie uit, backup + rollback.
- [x] `data:validate`: schema-check, referentiële integriteit, orphan detectie.
- [x] `data:backup`: maak on-demand snapshot in `.data/backups/`.
- [x] `data:export`: dump alle JSON naar één archive.
- [x] `data:import`: herstel data, behoud versies.
- [x] CLI-tests (happy path, corrupt data, rollback).

---

## 3) Backend Integratie
- [x] Vervang Supabase-services door calls naar `JsonFileDriver`.
- [x] Auth flow: signup/login/reset → user object + hashed password opslaan.
- [x] Progress: POST/GET → update JSON progress + gamification.
- [x] Rewards: badges/points automatisch bijhouden + opslaan.
- [x] Coaching: AI-feedback snapshots persist in coaching dataset.
- [x] Subscriptions: upgrade/downgrade status opslaan in JSON.
- [x] Premium middleware: check `user.premiumTier` → blokkeer of laat door.
- [x] Behoud bestaande Express middleware (helmet, rate limits, error handling).

---

## 4) Next.js Fundament
- [x] Scaffold Next.js App Router (TS).
- [x] Config: Tailwind, shadcn/ui, lucide-react, Framer Motion, Zustand, TanStack Query, RHF/Zod.
- [x] ThemeProvider: light/dark, system-aware, persist, geen FOUC.
- [x] Layout: header (branding, nav, theme toggle, sub-status), footer.
- [x] Design tokens: kleur, spacing, radii, typography.
- [x] Tests: rendering/layout smoke tests.

---

## 5) Landing Page (niet AI-style)
- [x] Hero met waardepropositie (“AI-driven learning coach”).
- [x] Features grid (personal plans, progress, gamification, coaching, premium).
- [x] Animaties: subtiel, dopamine, geen “AI stock vibes”.
- [x] Social proof blok (placeholders).
- [x] FAQ + call-to-action.
- [x] Lighthouse: LCP < 2.5s, SEO/Perf/Best Practices ≥95.

---

## 6) Public Pages
- [x] `/pricing`: tiers, feature matrix, CTA → upgrade flow.
- [x] `/legal/*`: terms, privacy.
- [x] `/auth/*`: login/signup/reset met RHF + Zod.
- [x] Skeleton + loading states.

---

## 7) App Routes
- [x] **/app/dashboard**
  - Overzicht plan, voortgang, streaks, coach-hint.
- [x] **/app/learn**
  - Milestones lijst, updates → optimistic POST /api/progress.
- [x] **/app/progress**
  - Progress bars, streaks, planner visualisatie.
- [x] **/app/rewards**
  - Badges, points, history, animaties, admin controls.
- [x] **/app/coach**
  - Chat-UI, streaming-like feedback, “apply suggestion”.
- [x] **/app/account**
  - Profile settings, theme prefs, subscription beheer.

---

## 8) Paywall & Premium UX
- [x] Paywall middleware: blok premium routes → toon preview + CTA.
- [x] Premium chip in header met status.
- [x] Checkout flow (mocked of Stripe-API).
- [x] Edge cases: verlopen, downgrade → duidelijke UX.

---

## 9) Accessibility & i18n\r\n- 
[x] WCAG 2.1 AA: focus rings, ARIA, skip links, reduced motion.\r\n- 
[x] i18n scaffolding (en/nl, content Engels default).\r\n- 
[x] Tests: keyboard-nav, contrast, reduced motion check.

---

## 10) Quality & Tests
- [x] Unit tests (RTL) voor UI components en forms.
- [x] Integration tests: API routes met JsonFileDriver.
- [x] Playwright e2e: signup → plan → progress → reward → coach → upgrade → premium routes.
- [x] Lighthouse CI: targets halen.
- [x] `npm run build` + `npm test` groen.

---

## 11) Express + Next Integratie
- [x] `src/server.ts`: mount Next na API-routers.
- [x] Security middleware behouden.
- [x] Health route blijft werken.

---

## 12) Docs & Checklist
- [x] README: setup, scripts, data-driver, migraties, route-map, screenshots.
- [x] `.env.local.example` voor frontend, `.env.example` server.
- [x] WhyLearn_Business_Plan.md: beslissingen (storage design, UX keuzes).
- [x] `tasks/todo.md`: bijwerken na elke afgeronde stap met review

---

## Definition of Done
- Alles werkt end-to-end.
- JSON storage betrouwbaar, migraties getest, backups beschikbaar.
- Frontend + backend geïntegreerd, premium UX compleet.
- Tests + Lighthouse groen.
- Docs volledig en helder.

## Review 2025-09-17
- Section 4 fundament opgezet: theme provider zonder third-party deps, layout met header/footer, providers voor Query
- Landing page uitgebreid met features, progress blok, social proof, FAQ, CTA en framer-motion animaties
- Nieuwe smoke test voor web entrypoint en vitest alias voor '@' toegevoegd
- npm --prefix apps/web run lint en npm test gedraaid voor controle
## Review 2025-09-18
- Publice pagina's toegevoegd: /pricing, /legal/terms, /legal/privacy en auth flows met RHF/Zod inclusief skeleton states
- App workspace routes gebouwd (dashboard, learn, progress, rewards, coach, account) met demo fallback + API-integraties via identity
- Premium guard, header chip en mock checkout/downgrade acties toegevoegd voor paywall UX
- npm --prefix apps/web run lint en npm test uitgevoerd
## Review 2025-09-19
- Landing page (step 5) opnieuw gecontroleerd; geen extra wijzigingen nodig.
- Premium guard uitgebreid met statuscategorieen, gerichte messaging en aangepaste CTA's.
- Account en header tonen nu duidelijke signalen bij betalingsachterstand/downgrade.
## Review 2025-09-20
- Header/footer navigatie volledig vertaalbaar gemaakt, nieuwe skip link component met fallback en focus-visible stijlen toegevoegd.
- Reduced-motion styling geactiveerd in globals.css en FeatureShowcase laat animaties achterwege wanneer nodig.
- Nieuwe vitest checks voor i18n keys en CSS accessibility gedraaid + `npm test -- tests/web/accessibility-config.test.ts tests/web/css-accessibility.test.ts`.
## Review 2025-09-21
- Tests uitgebreid: loginformulier (RTL), end-to-end JSON flow met Supertest, Playwright scenario en LHCI-config met 0.95-doelen.
- Express/Next integratie vastgelegd met vitest; health check en wildcard routing blijven werken.
- README herwerkt, env-templates toegevoegd en businessplan aangevuld voor onboarding/QA.

