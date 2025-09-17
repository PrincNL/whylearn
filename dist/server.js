"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = require("./routes/authRoutes");
const progressRoutes_1 = require("./routes/progressRoutes");
const gamificationRoutes_1 = require("./routes/gamificationRoutes");
const coachingRoutes_1 = require("./routes/coachingRoutes");
const subscriptionRoutes_1 = require("./routes/subscriptionRoutes");
const createApp = () => {
    const app = (0, express_1.default)();
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)());
    app.use(express_1.default.json({ limit: '10kb' }));
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.use('/api/auth', authRoutes_1.authRouter);
    app.use('/api/progress', progressRoutes_1.progressRouter);
    app.use('/api/gamification', gamificationRoutes_1.gamificationRouter);
    app.use('/api/subscriptions', subscriptionRoutes_1.subscriptionRouter);
    app.use('/api/coaching', coachingRoutes_1.coachingRouter);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
const startServer = () => {
    const app = (0, exports.createApp)();
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`WhyLearn API listening on port ${env_1.env.PORT}`);
    });
};
exports.startServer = startServer;
if (require.main === module) {
    (0, exports.startServer)();
}
//# sourceMappingURL=server.js.map