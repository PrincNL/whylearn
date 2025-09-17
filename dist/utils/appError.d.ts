export declare class AppError extends Error {
    readonly statusCode: number;
    readonly details?: unknown | undefined;
    constructor(message: string, statusCode?: number, details?: unknown | undefined);
}
//# sourceMappingURL=appError.d.ts.map