"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const level = process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL ?? 'info';
exports.logger = (0, pino_1.default)({
    level,
    redact: {
        paths: ['req.headers.authorization', 'payload.password', 'payload.goal'],
        remove: true,
    },
});
//# sourceMappingURL=logger.js.map