import path from 'path';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/authRoutes';
import { progressRouter } from './routes/progressRoutes';
import { gamificationRouter } from './routes/gamificationRoutes';
import { coachingRouter } from './routes/coachingRoutes';
import { subscriptionRouter } from './routes/subscriptionRoutes';

type CreateAppOptions = {
  nextHandler?: (req: express.Request, res: express.Response) => void | Promise<void>;
};

const parseAllowedOrigins = (raw: string | undefined): string[] =>
  raw
    ? raw
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    : [];

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGINS);
  if (!allowedOrigins.length && env.NODE_ENV !== 'production') {
    allowedOrigins.push(`http://localhost:${env.WEB_PORT}`);
  }
  const allowAnyOrigin = allowedOrigins.includes('*');

  app.use((req, res, next) => {
    const origin = req.header('Origin');
    const isAllowed = allowAnyOrigin || (origin ? allowedOrigins.includes(origin) : false);

    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', allowAnyOrigin ? '*' : origin ?? '*');
      res.header('Vary', 'Origin');
      if (!allowAnyOrigin) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }
    }

    if (req.method === 'OPTIONS') {
      const requestedHeaders = req.header('Access-Control-Request-Headers');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', requestedHeaders ?? 'Content-Type, Authorization');
      if (!origin || isAllowed) {
        res.status(204).end();
      } else {
        res.status(403).json({ status: 'error', message: 'CORS origin not allowed' });
      }
      return;
    }

    if (origin && !isAllowed && allowedOrigins.length && !allowAnyOrigin) {
      res.status(403).json({ status: 'error', message: 'CORS origin not allowed' });
      return;
    }

    next();
  });

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/gamification', gamificationRouter);
  app.use('/api/subscriptions', subscriptionRouter);
  app.use('/api/coaching', coachingRouter);
  app.use(errorHandler);

  if (options.nextHandler) {
    app.use((req, res, next) => {
      Promise.resolve(options.nextHandler?.(req, res)).catch(next);
    });
  }

  return app;
};

export const startServer = async () => {
  const dev = env.NODE_ENV !== 'production';
  const next = (await import('next')).default;
  const nextApp = next({ dev, dir: path.resolve(__dirname, '../apps/web') });
  await nextApp.prepare();
  const handler = nextApp.getRequestHandler();

  const app = createApp({ nextHandler: handler });
  app.listen(env.PORT, () => {
    logger.info(`WhyLearn API listening on port ${env.PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    logger.error(error, 'Failed to start server');
    process.exitCode = 1;
  });
}
