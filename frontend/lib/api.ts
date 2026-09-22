import type { Entry } from "./store";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Core fetch wrapper.
 * - Reads the current Better Auth session token from the browser cookie and
 *   forwards it as `Authorization: Bearer <token>` so the FastAPI backend
 *   can verify it via its /get-session call to Better Auth.
 * - Falls back gracefully (no token sent) in local demo mode.
 */
/**
 * Read the Better Auth session token from the browser cookie.
 * Better Auth stores the raw token in:
 *   - `better-auth.session_token` (HTTP / dev)
 *   - `__Secure-better-auth.session_token` (HTTPS / production)
 *
 * NOTE: this only works when the cookie is NOT HttpOnly.
 * Better Auth sets it as non-HttpOnly by default so that client-side
 * code can forward it to external APIs.
 */
function getSessionTokenFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookieNames = [
    "__Secure-better-auth.session_token",
    "better-auth.session_token",
  ];
  for (const name of cookieNames) {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`));
    if (match) return decodeURIComponent(match.split("=").slice(1).join("="));
  }
  return undefined;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Read the raw session token from the browser cookie so it can be forwarded
  // to the FastAPI backend as `Authorization: Bearer <token>`. The backend then
  // calls Better Auth's /get-session endpoint with the token as a cookie to
  // verify it server-side.
  const token = getSessionTokenFromCookie();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!response.ok) {
    const detail =
      (await response.json().catch(() => null))?.detail ??
      "The API could not complete that request.";
    throw new Error(detail);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

// ---------------------------------------------------------------------------
// Typed API helpers
// ---------------------------------------------------------------------------

export const getEntries = (date?: string) =>
  api<Entry[]>(`/api/entries${date ? `?entry_date=${date}` : ""}`);

export const createEntry = (
  payload: Omit<Entry, "id" | "created_at" | "updated_at">
) => api<Entry>("/api/entries", { method: "POST", body: JSON.stringify(payload) });

export const updateEntry = (
  id: number,
  payload: Partial<Pick<Entry, "title" | "body" | "tag">>
) =>
  api<Entry>(`/api/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteEntry = (id: number) =>
  api<void>(`/api/entries/${id}`, { method: "DELETE" });
