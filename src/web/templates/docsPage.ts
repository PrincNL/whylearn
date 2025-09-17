const section = (title: string, body: string) => `
  <section class="card">
    <h2>${title}</h2>
    <p>${body}</p>
  </section>
`;

const quickLinks = [
  {
    label: 'Register learner',
    endpoint: 'POST /api/auth/register',
  },
  {
    label: 'Check progress',
    endpoint: 'GET /api/progress/:userId',
  },
  {
    label: 'Gamification boost',
    endpoint: 'POST /api/gamification',
  },
  {
    label: 'Latest coaching snapshot',
    endpoint: 'GET /api/coaching/:userId',
  },
];

const renderQuickLinks = () =>
  quickLinks
    .map(
      (item) => `
        <li>
          <span class="label">${item.label}</span>
          <code>${item.endpoint}</code>
        </li>
      `
    )
    .join('');

export const renderDocsPage = () => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>WhyLearn Docs</title>
      <style>
        :root {
          font-family: 'Segoe UI', Tahoma, sans-serif;
          background: #020617;
          color: #e2e8f0;
        }

        body {
          margin: 0;
          padding: clamp(1.5rem, 4vw, 3.5rem);
          background: radial-gradient(circle at top, rgba(59, 130, 246, 0.12), rgba(2, 6, 23, 0.95));
        }

        header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        header h1 {
          font-size: clamp(2.2rem, 6vw, 3.2rem);
          margin-bottom: 0.35rem;
        }

        header p {
          color: rgba(226, 232, 240, 0.75);
          max-width: 640px;
          margin: 0 auto;
        }

        main {
          display: grid;
          gap: 1.5rem;
          max-width: 960px;
          margin: 0 auto;
        }

        .card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 1.5rem;
          padding: clamp(1.25rem, 2vw, 1.75rem);
          border: 1px solid rgba(148, 163, 184, 0.3);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
        }

        .card h2 {
          margin-top: 0;
          margin-bottom: 0.75rem;
          font-size: 1.4rem;
          color: #38bdf8;
        }

        ul.quick-links {
          padding: 0;
          margin: 0;
          list-style: none;
          display: grid;
          gap: 0.75rem;
        }

        ul.quick-links li {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 0.75rem 1rem;
          background: rgba(30, 41, 59, 0.75);
          border-radius: 0.9rem;
          border: 1px solid rgba(148, 163, 184, 0.25);
        }

        ul.quick-links .label {
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          color: rgba(248, 250, 252, 0.75);
        }

        code {
          display: inline-block;
          padding: 0.35rem 0.6rem;
          border-radius: 0.5rem;
          background: rgba(15, 23, 42, 0.85);
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.85rem;
          color: #e0f2fe;
        }

        a.home-link {
          display: inline-block;
          margin-top: 2rem;
          text-decoration: none;
          color: #38bdf8;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>WhyLearn API Guide</h1>
        <p>Quick links to core endpoints for onboarding, plan progress, gamification, subscriptions, and coaching.</p>
      </header>
      <main>
        ${section('Getting started', 'Use the Supabase credentials in .env to configure authentication. The /api/auth/register endpoint returns a seeded learning plan for a user.')} 
        ${section('Track engagement', 'Progress events, gamification rewards, and coaching advice feed into the overall learner picture. All responses include ready-made JSON for dashboards.')} 
        <section class="card">
          <h2>Endpoints</h2>
          <ul class="quick-links">
            ${renderQuickLinks()}
          </ul>
          <a class="home-link" href="/">Back to WhyLearn</a>
        </section>
      </main>
    </body>
  </html>
`;
