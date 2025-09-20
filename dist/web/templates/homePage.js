"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHomePage = void 0;
const features = [
    {
        title: 'AI learning plans',
        description: 'Personalised, deterministic plans combine the local data store with coaching rules so progress stays trackable.',
    },
    {
        title: 'Gamification that sticks',
        description: 'Milestone completions award badges, experience levels, and bonus challenges to keep learners motivated.',
    },
    {
        title: 'Coaching insights',
        description: 'AI coaching reports surface focus areas and actionable advice for every learner and plan.',
    },
    {
        title: 'Subscription ready',
        description: 'Stripe-ready tiers link to data-service entitlements stored alongside learner progress, so upgrades unlock premium content instantly.',
    },
];
const renderFeatureList = () => features
    .map((feature) => `
        <li class="feature">
          <h3>${feature.title}</h3>
          <p>${feature.description}</p>
        </li>
      `)
    .join('');
const renderHomePage = () => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>WhyLearn Platform</title>
      <style>
        :root {
          color-scheme: light dark;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #0f172aa6;
          color: #e2e8f0;
        }

        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        header {
          padding: 3rem 1.5rem 2rem;
          text-align: center;
          background: linear-gradient(135deg, #0f172a, #1e293b);
        }

        header h1 {
          font-size: clamp(2.5rem, 4vw, 3.75rem);
          margin-bottom: 1rem;
        }

        header p {
          max-width: 740px;
          margin: 0 auto;
          line-height: 1.6;
          font-size: 1.1rem;
          color: #cbd5f5;
        }

        main {
          flex: 1;
          width: min(1080px, 92vw);
          margin: -2rem auto 3rem;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 28px;
          padding: 3rem clamp(1.5rem, 3vw, 3rem);
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(12px);
        }

        .hero {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .hero h2 {
          font-size: 2rem;
          margin: 0;
        }

        .cta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .cta a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.75rem;
          border-radius: 999px;
          font-weight: 600;
          text-decoration: none;
          color: #0f172a;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }

        .cta a.secondary {
          background: rgba(226, 232, 240, 0.1);
          color: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }

        .cta a:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 30px rgba(56, 189, 248, 0.25);
        }

        .features {
          display: grid;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .feature {
          list-style: none;
          padding: 1.5rem;
          border-radius: 1.25rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.08);
        }

        .feature h3 {
          margin-top: 0;
          margin-bottom: 0.75rem;
          font-size: 1.35rem;
          color: #38bdf8;
        }

        footer {
          text-align: center;
          padding: 1.5rem;
          font-size: 0.95rem;
          color: rgba(226, 232, 240, 0.75);
        }

        @media (min-width: 720px) {
          .features {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      </style>
    </head>
    <body>
      <header>
        <h1>WhyLearn</h1>
        <p>
          A focused learning experience combining smart onboarding, deterministic plans,
          real-time progress tracking, gamified engagement, and premium coaching.
        </p>
      </header>
      <main>
        <section class="hero">
          <h2>Launch a full-stack learning platform in days, not months.</h2>
          <p>
            The WhyLearn API powers secure authentication, adaptive learning plans, and rich gamification.
            The companion web app gives learners and coaches a polished experience out of the box.
          </p>
          <div class="cta">
            <a href="/docs">Explore the docs</a>
            <a class="secondary" href="/status">API status</a>
          </div>
        </section>
        <section>
          <ul class="features">
            ${renderFeatureList()}
          </ul>
        </section>
      </main>
      <footer>
        <span>WhyLearn Platform - ${new Date().getFullYear()}</span>
      </footer>
    </body>
  </html>
`;
exports.renderHomePage = renderHomePage;
//# sourceMappingURL=homePage.js.map