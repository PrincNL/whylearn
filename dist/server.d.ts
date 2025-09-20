import express from 'express';
type CreateAppOptions = {
    nextHandler?: (req: express.Request, res: express.Response) => void | Promise<void>;
};
export declare const createApp: (options?: CreateAppOptions) => import("express-serve-static-core").Express;
export declare const startServer: () => Promise<void>;
export {};
//# sourceMappingURL=server.d.ts.map