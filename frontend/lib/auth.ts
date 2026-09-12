import { betterAuth } from "better-auth";
import { Pool } from "pg";

/**
 * Better Auth instance — runs entirely inside Next.js API routes.
 * Uses the raw pg Pool so we don't need a second ORM (Drizzle) just for auth.
 * The backend (FastAPI) never touches this file; it verifies sessions by
 * calling GET /api/auth/get-session with the session token cookie.
 */
const isRemoteDb =
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("localhost") &&
  !process.env.DATABASE_URL.includes("127.0.0.1");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://daily_logger:daily_logger@localhost:5432/daily_logger",
  ssl:
    process.env.NODE_ENV === "production" || isRemoteDb
      ? { rejectUnauthorized: false }
      : undefined,
});

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const twitterConfigured =
  !!process.env.X_CLIENT_ID && !!process.env.X_CLIENT_SECRET;

export const auth = betterAuth({
  database: pool,
  // BETTER_AUTH_URL is the canonical base URL (set in Vercel env vars).
  // Better Auth uses this to construct OAuth callback URIs sent to providers.
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    ...(googleConfigured && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
    ...(twitterConfigured && {
      twitter: {
        clientId: process.env.X_CLIENT_ID!,
        clientSecret: process.env.X_CLIENT_SECRET!,
      },
    }),
  },
});
