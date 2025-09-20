"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)({ path: ".env", override: false, quiet: true });
const envSchema = zod_1.z.object({
    DATA_DIR: zod_1.z.string().default('.data'),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    WEB_PORT: zod_1.z.coerce.number().int().positive().default(3000),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_SUCCESS_URL: zod_1.z.string().url().optional(),
    STRIPE_CANCEL_URL: zod_1.z.string().url().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid environment variables");
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map