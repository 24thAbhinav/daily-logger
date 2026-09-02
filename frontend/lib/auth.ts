import { betterAuth } from "better-auth";
import { Pool } from "pg";

/**
 * Better Auth instance — runs entirely inside Next.js API routes.
 * Uses the raw pg Pool so we don't need a second ORM (Drizzle) just for auth.
 * The backend (FastAPI) never touches this file; it verifies sessions by
 * calling GET /api/auth/get-session with the session token cookie.
 */
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://daily_logger:daily_logger@localhost:5432/daily_logger",
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    twitter: {
      clientId: process.env.X_CLIENT_ID ?? "",
      clientSecret: process.env.X_CLIENT_SECRET ?? "",
    },
  },
});
