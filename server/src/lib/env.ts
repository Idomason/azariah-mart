import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  CLIENT_URL: z.string().url().default("http://localhost:5173"),

  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_API_BASE_URL: z.string().url().default("https://api.polar.sh"),
  POLAR_CHECKOUT_PRODUCT_ID: z.string(), //  FIXED: Make this later to a uuid string

  STREAM_API_KEY: z.string().min(1, "STREAM_API_KEY is required"),
  STREAM_API_SECRET: z.string().min(1, "STREAM_API_SECRET is required"),

  IMAGEKIT_PUBLIC_KEY: z.string().min(1, "IMAGEKIT_PUBLIC_KEY is required"),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, "IMAGEKIT_PRIVATE_KEY is required"),
  IMAGEKIT_URL_ENDPOINT: z
    .string()
    .url()
    .min(1, "IMAGEKIT_URL_ENDPOINT is required"),

  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const loadEnv = function (): Env {
  const env = envSchema.safeParse(process.env);

  if (!env.success) {
    console.error(
      "Environment variable validation failed:",
      env.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }
  return env.data;
};

let cachedEnv: Env | null = null;

export const getEnv = function (): Env {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }
  return cachedEnv;
};
