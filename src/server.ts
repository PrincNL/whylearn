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

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
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
    app.all('*', (req, res) => {
      return options.nextHandler?.(req, res);
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
