import type { Entry } from "./store";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Fetches the Auth0 access token from the Next.js session endpoint
 * provided by @auth0/nextjs-auth0.
 */
async function getAccessToken(): Promise<string> {
  const res = await fetch("/api/auth-token");
  if (!res.ok) throw new Error("Not authenticated");
  const data = await res.json();
  if (!data.token) throw new Error("No access token in session");
  return data.token;
}

/**
 * Core fetch wrapper for the FastAPI backend.
 * Automatically attaches the Auth0 Bearer token to every request.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string> | undefined),
  };

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
