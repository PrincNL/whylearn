# WhyLearn API

Secure onboarding, learning-plan generation, progress tracking, and gamification for the WhyLearn platform.

## Requirements

- Node.js 18+
- Supabase project with the following tables:

```sql
create table public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  plan jsonb not null,
  created_at timestamp with time zone default timezone('utc', now())
);
create index learning_plans_user_id_idx on public.learning_plans (user_id);

create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  milestone_id text not null,
  status text not null check (status in ('pending', 'completed')),
  progress_timestamp timestamp with time zone,
  points integer not null default 0,
  badge_codes text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  unique (user_id, milestone_id)
);
create index learning_progress_user_idx on public.learning_progress (user_id, plan_id);

create table public.user_gamification (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  progress_points integer not null default 0,
  bonus_points integer not null default 0,
  total_points integer not null default 0,
  level integer not null default 1,
  updated_at timestamp with time zone default timezone('utc', now()),
  primary key (user_id, plan_id)
);

create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  badge_code text not null,
  awarded_at timestamp with time zone default timezone('utc', now()),
  primary key (user_id, plan_id, badge_code)
);

create table public.user_coaching_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  summary text not null,
  recommended_milestones text[] not null default '{}',
  recommended_actions text[] not null default '{}',
  focus_areas text[] not null default '{}',
  motivational_message text not null,
  plan_adjustments text[] not null default '{}',
  metadata jsonb default null,
  created_at timestamp with time zone default timezone('utc', now())
);
```sql
create table public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  plan jsonb not null,
  created_at timestamp with time zone default timezone('utc', now())
);
create index learning_plans_user_id_idx on public.learning_plans (user_id);

create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  milestone_id text not null,
  status text not null check (status in ('pending', 'completed')),
  progress_timestamp timestamp with time zone,
  points integer not null default 0,
  badge_codes text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  unique (user_id, milestone_id)
);
create index learning_progress_user_idx on public.learning_progress (user_id, plan_id);

create table public.user_gamification (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  progress_points integer not null default 0,
  bonus_points integer not null default 0,
  total_points integer not null default 0,
  level integer not null default 1,
  updated_at timestamp with time zone default timezone('utc', now()),
  primary key (user_id, plan_id)
);

create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.learning_plans(id) on delete cascade,
  badge_code text not null,
  awarded_at timestamp with time zone default timezone('utc', now()),
  primary key (user_id, plan_id, badge_code)
);
```

Copy `.env.example` to `.env` and paste your Supabase credentials.
If you plan to use Stripe for paid subscriptions, provide `STRIPE_SECRET_KEY`, `STRIPE_SUCCESS_URL`, and `STRIPE_CANCEL_URL` in the `.env` file.


## Scripts

- `npm run dev` – start the API with hot reload
- `npm run build` – compile TypeScript output
- `npm start` – serve compiled build
- `npm test` – run automated tests

## API

### POST `/api/auth/register`

Registers a new user, validates password strength, generates a deterministic learning plan, and persists both the user and plan in Supabase.

**Body**

```json
{
  "email": "learner@example.com",
  "password": "SecureP@ssw0rd",
  "goal": "Become a frontend developer",
  "preferredPaceHoursPerWeek": 8
}
```

**Response**

```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "planId": "uuid",
    "plan": {
      "goal": "Become A Frontend Developer",
      "summary": "...",
      "milestones": [
        { "title": "...", "durationHours": 10 }
      ]
    }
  }
}
```

Validation errors return HTTP 422. Supabase or server issues return HTTP 500 with a safe message.

### POST `/api/progress`

Marks a milestone as completed (or pending) for a user. Defaults to the most recent plan when `planId` is omitted and automatically recalculates gamification points/badges.

**Body**

```json
{
  "userId": "uuid",
  "milestoneId": "milestone-uuid",
  "status": "completed",
  "planId": "uuid",
  "progressTimestamp": "2025-01-01T00:00:00.000Z"
}
```

**Response**

```json
{
  "status": "success",
  "data": {
    "record": {
      "milestone_id": "milestone-uuid",
      "status": "completed",
      "points": 100,
      "badge_codes": ["first_milestone"],
      "progress_timestamp": "2025-01-01T00:00:00.000Z"
    },
    "gamification": {
      "totalPoints": 150,
      "level": 1,
      "bonusPoints": 50,
      "completionRate": 0.25,
      "badges": [
        {
          "code": "first_milestone",
          "name": "First Milestone",
          "awardedAt": "2025-01-01T00:00:00.000Z",
          "bonusPoints": 50
        }
      ]
    },
    "newBadges": [
      {
        "code": "first_milestone",
        "name": "First Milestone",
        "description": "Completed the first milestone in a learning plan.",
        "awardedAt": "2025-01-01T00:00:00.000Z",
        "bonusPoints": 50
      }
    ]
  }
}
```

### GET `/api/progress/:userId`

Returns a progress overview with milestone statuses, earned points, and completion counts. An optional `planId` query parameter restricts the overview to a specific learning plan.

### POST `/api/gamification`

Applies manual gamification rewards (extra points or forcing a badge) and returns the updated gamification snapshot.

### POST `/api/subscriptions`

Changes or upgrades a user's subscription tier. If Stripe is configured the response includes a Checkout Session to complete payment; otherwise the subscription is applied immediately.

**Body**

```json
{
  "userId": "uuid",
  "tierId": "premium",
  "couponId": "PROMO10"
}
```

### GET `/api/subscriptions/:userId`

Returns the current subscription status, active entitlements, and renewal metadata for the specified user.

### GET `/api/gamification/:userId`

Fetches the aggregated gamification state, including levels, totals, badges, and completion rate. Accepts an optional `planId` query parameter.

### POST `/api/coaching`

Generates AI-coaching feedback that combines progress and gamification metrics, stores the snapshot, and returns the tailored advice.

**Body**

```json
{
  "userId": "uuid",
  "planId": "uuid",
  "notes": "Focus on deeper practice"
}
```

**Response**

```json
{
  "status": "success",
  "data": {
    "advice": {
      "summary": "...",
      "recommendedMilestones": ["Practice"],
      "recommendedActions": ["Plan review"],
      "focusAreas": ["Consistency"],
      "motivationalMessage": "...",
      "planAdjustments": ["Split tasks"],
      "boosters": ["Share progress"],
      "insights": [{ "label": "Voltooiingsgraad", "value": "50%" }]
    },
    "progress": { "completedMilestones": 2 },
    "gamification": { "totalPoints": 250, "level": 2 },
    "history": []
  }
}
```

### GET `/api/coaching/:userId`

Returns the latest coaching status, including stored feedback history, up-to-date progress metrics, and the current gamification snapshot. Accepts an optional `planId` query parameter.

## Design Notes

- `express-rate-limit` and `helmet` harden the public endpoints.
- `zod` ensures request validation and clear error payloads.
- Learning plans remain deterministic for predictable tests and future AI extensions.
- Supabase persistence stores plan JSON, milestone progress, and gamification aggregates, enabling downstream analytics and coaching features.
- Gamification points and badges are derived from milestone completion and configurable badge definitions; manual rewards can adjust totals or grant specific badges for campaigns.
- Progress endpoints assume authenticated contexts will be layered on top; for now the user ID is provided explicitly for integration testing.
- - Subscription service enforces entitlement checks against Supabase data and leverages Stripe Checkout when price identifiers are configured.
#   w h y l e a r n  
 