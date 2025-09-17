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
- [ ] `/pricing`: tiers, feature matrix, CTA → upgrade flow.
- [ ] `/legal/*`: terms, privacy.
- [ ] `/auth/*`: login/signup/reset met RHF + Zod.
- [ ] Skeleton + loading states.

---

## 7) App Routes
- **/app/dashboard**
  - Overzicht plan, voortgang, streaks, coach-hint.
- **/app/learn**
  - Milestones lijst, updates → optimistic POST /api/progress.
- **/app/progress**
  - Progress bars, streaks, planner visualisatie.
- **/app/rewards**
  - Badges, points, history, animaties, admin controls.
- **/app/coach**
  - Chat-UI, streaming-like feedback, “apply suggestion”.
- **/app/account**
  - Profile settings, theme prefs, subscription beheer.

---

## 8) Paywall & Premium UX
- [ ] Paywall middleware: blok premium routes → toon preview + CTA.
- [ ] Premium chip in header met status.
- [ ] Checkout flow (mocked of Stripe-API).
- [ ] Edge cases: verlopen, downgrade → duidelijke UX.

---

## 9) Accessibility & i18n
- [ ] WCAG 2.1 AA: focus rings, ARIA, skip links, reduced motion.
- [ ] i18n scaffolding (en/nl, content Engels default).
- [ ] Tests: keyboard-nav, contrast, reduced motion check.

---

## 10) Quality & Tests
- [ ] Unit tests (RTL) voor UI components en forms.
- [ ] Integration tests: API routes met JsonFileDriver.
- [ ] Playwright e2e: signup → plan → progress → reward → coach → upgrade → premium routes.
- [ ] Lighthouse CI: targets halen.
- [ ] `npm run build` + `npm test` groen.

---

## 11) Express + Next Integratie
- [ ] `src/server.ts`: mount Next na API-routers.
- [ ] Security middleware behouden.
- [ ] Health route blijft werken.

---

## 12) Docs & Checklist
- [ ] README: setup, scripts, data-driver, migraties, route-map, screenshots.
- [ ] `.env.local.example` voor frontend, `.env.example` server.
- [ ] WhyLearn_Business_Plan.md: beslissingen (storage design, UX keuzes).
- [ ] `tasks/todo.md`: bijwerken na elke afgeronde stap met �
.

---

## Definition of Done
- Alles werkt end-to-end.
- JSON storage betrouwbaar, migraties getest, backups beschikbaar.
- Frontend + backend geïntegreerd, premium UX compleet.
- Tests + Lighthouse groen.
- Docs volledig en helder.
\n## Review 2025-09-17\n- Section 4 fundament opgezet: theme provider zonder third-party deps, layout met header/footer, providers voor Query\n- Landing page uitgebreid met features, progress blok, social proof, FAQ, CTA en framer-motion animaties\n- Nieuwe smoke test voor web entrypoint en vitest alias voor '@' toegevoegd\n- npm --prefix apps/web run lint en npm test gedraaid voor controle
