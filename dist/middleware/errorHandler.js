"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
const appError_1 = require("../utils/appError");
const errorHandler = (error, _req, res, _next) => {
    const statusCode = error instanceof appError_1.AppError ? error.statusCode : 500;
    const message = error instanceof appError_1.AppError ? error.message : 'Internal server error';
    logger_1.logger.error({ err: error, statusCode }, 'Request failed');
    res.status(statusCode).json({
        status: 'error',
        message,
        details: error instanceof appError_1.AppError ? error.details : undefined,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map