import { createAuthClient } from "better-auth/react";

/**
 * Client-side Better Auth instance.
 * `useSession()` gives us the current user + raw session token.
 * `signIn.social()` initiates Google / X OAuth.
 * `signOut()` clears the session.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

// Re-export the hook so components can import it from one place.
export const { useSession } = authClient;
