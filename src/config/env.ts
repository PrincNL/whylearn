import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env", override: false, quiet: true });

const envSchema = z.object({
  DATA_DIR: z.string().default('.data'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  APP_URL: z.string().url().optional(),
  MAIL_FROM: z.string().email().optional(),
  MAIL_FROM_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables");
}

const data = parsed.data;

const appUrl = data.APP_URL ?? `http://localhost:${data.WEB_PORT}`;
const smtpPort = data.SMTP_PORT ?? (data.SMTP_SECURE ? 465 : 587);
const smtpSecure = data.SMTP_SECURE ?? smtpPort === 465;

export const env = {
  ...data,
  APP_URL: appUrl,
  SMTP_PORT: smtpPort,
  SMTP_SECURE: smtpSecure,
};
