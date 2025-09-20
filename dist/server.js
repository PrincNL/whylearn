"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.createApp = void 0;
const path_1 = __importDefault(require("path"));
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
const createApp = (options = {}) => {
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
    if (options.nextHandler) {
        app.use((req, res, next) => {
            Promise.resolve(options.nextHandler?.(req, res)).catch(next);
        });
    }
    return app;
};
exports.createApp = createApp;
const startServer = async () => {
    const dev = env_1.env.NODE_ENV !== 'production';
    const next = (await Promise.resolve().then(() => __importStar(require('next')))).default;
    const nextApp = next({ dev, dir: path_1.default.resolve(__dirname, '../apps/web') });
    await nextApp.prepare();
    const handler = nextApp.getRequestHandler();
    const app = (0, exports.createApp)({ nextHandler: handler });
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`WhyLearn API listening on port ${env_1.env.PORT}`);
    });
};
exports.startServer = startServer;
if (require.main === module) {
    (0, exports.startServer)().catch((error) => {
        logger_1.logger.error(error, 'Failed to start server');
        process.exitCode = 1;
    });
}
//# sourceMappingURL=server.js.map