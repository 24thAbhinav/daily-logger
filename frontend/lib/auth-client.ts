import { createAuthClient } from "better-auth/react";

/**
 * Client-side Better Auth instance.
 * `useSession()` gives us the current user + raw session token.
 * `signIn.social()` initiates Google OAuth.
 * `signOut()` clears the session.
 *
 * baseURL uses window.location.origin at runtime so auth requests always
 * go to the same origin the user is on — works correctly on every
 * deployment URL (production, preview, local).
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
});

// Re-export the hook so components can import it from one place.
export const { useSession } = authClient;
