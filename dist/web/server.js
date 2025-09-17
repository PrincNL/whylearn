"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebServer = exports.createWebApp = void 0;
const express_1 = __importDefault(require("express"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const docsPage_1 = require("./templates/docsPage");
const homePage_1 = require("./templates/homePage");
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
const createWebApp = () => {
    const app = (0, express_1.default)();
    app.disable('x-powered-by');
    app.get('/', (_req, res) => {
        res.type('html').send((0, homePage_1.renderHomePage)());
    });
    app.get('/docs', (_req, res) => {
        res.type('html').send((0, docsPage_1.renderDocsPage)());
    });
    app.get(['/status', '/health'], (_req, res) => {
        res.json({
            status: 'ok',
            site: 'WhyLearn web',
            apiHealthEndpoint: `/api/health -> http://localhost:${env_1.env.PORT}/health`,
            timestamp: new Date().toISOString(),
        });
    });
    app.use((_req, res) => {
        res.status(404).type('html').send(renderNotFound());
    });
    return app;
};
exports.createWebApp = createWebApp;
const startWebServer = () => {
    const app = (0, exports.createWebApp)();
    const port = env_1.env.WEB_PORT;
    const server = app.listen(port, () => {
        logger_1.logger.info(`WhyLearn web listening on port ${port}`);
    });
    server.on('error', (error) => {
        logger_1.logger.error({ err: error }, 'WhyLearn web server failed to start');
    });
    return server;
};
exports.startWebServer = startWebServer;
if (require.main === module) {
    (0, exports.startWebServer)();
}
//# sourceMappingURL=server.js.map