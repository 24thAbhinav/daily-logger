import type { Entry } from "./store";
import { authClient } from "./auth-client";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Core fetch wrapper.
 * - Reads the current Better Auth session token and forwards it as
 *   `Authorization: Bearer <token>` so the FastAPI backend can verify it.
 * - Falls back gracefully (no token sent) in local demo mode.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Get the live session token from Better Auth (client-side, no round-trip).
  const { data: sessionData } = await authClient.getSession();
  const token = (sessionData as any)?.session?.token as string | undefined;

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
