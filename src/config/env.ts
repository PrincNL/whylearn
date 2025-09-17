import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env", override: false, quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables");
}

export const env = parsed.data;
