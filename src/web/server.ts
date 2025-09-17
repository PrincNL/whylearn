import express from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { renderDocsPage } from './templates/docsPage';
import { renderHomePage } from './templates/homePage';

const renderNotFound = () => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Page not found - WhyLearn</title>
      <style>
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, sans-serif;
          background: #0f172a;
          color: #e2e8f0;
          height: 100vh;
          display: grid;
          place-items: center;
        }

        main {
          text-align: center;
          padding: 2rem 2.5rem;
          border-radius: 1.5rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.85);
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.4);
        }

        a {
          color: #38bdf8;
          text-decoration: none;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <main>
        <h1>We could not find that page.</h1>
        <p><a href="/">Return to the WhyLearn home page</a></p>
      </main>
    </body>
  </html>
`;

export const createWebApp = () => {
  const app = express();

  app.disable('x-powered-by');

  app.get('/', (_req, res) => {
    res.type('html').send(renderHomePage());
  });

  app.get('/docs', (_req, res) => {
    res.type('html').send(renderDocsPage());
  });

  app.get(['/status', '/health'], (_req, res) => {
    res.json({
      status: 'ok',
      site: 'WhyLearn web',
      apiHealthEndpoint: `/api/health -> http://localhost:${env.PORT}/health`,
      timestamp: new Date().toISOString(),
    });
  });

  app.use((_req, res) => {
    res.status(404).type('html').send(renderNotFound());
  });

  return app;
};

export const startWebServer = () => {
  const app = createWebApp();
  const port = env.WEB_PORT;

  const server = app.listen(port, () => {
    logger.info(`WhyLearn web listening on port ${port}`);
  });

  server.on('error', (error) => {
    logger.error({ err: error }, 'WhyLearn web server failed to start');
  });

  return server;
};

if (require.main === module) {
  startWebServer();
}
