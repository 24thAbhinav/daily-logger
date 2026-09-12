"use client";

import { useEffect, useState } from "react";
import { BookOpen, LogOut, X, Loader2 } from "lucide-react";
import { authClient } from "../lib/auth-client";
import type { User } from "../lib/store";

/* ── Social brand SVGs ────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

/* ── Props ────────────────────────────────────────────────────── */

type Props = {
  user: User | null;
  onClose: () => void;
  onSignOut: () => void;
};

/* ── Component ────────────────────────────────────────────────── */

export function AuthModal({ user, onClose, onSignOut }: Props) {
  const [loading, setLoading] = useState<"google" | "twitter" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function signIn(provider: "google" | "twitter") {
    setError(null);
    setLoading(provider);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin,
      });
      // signIn.social redirects the page — if we're still here, something went wrong
      if (result?.error) {
        setError(
          result.error.message ??
            "OAuth is not configured yet. Use demo mode for now."
        );
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not connect to the auth provider. Try demo mode."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/20 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-sm rounded-2xl border bg-card shadow-modal animate-scale-in"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                daily / logger
              </p>
              <h2
                id="auth-title"
                className="text-xl font-semibold tracking-[-0.03em]"
              >
                {user ? "Your account" : "Welcome back"}
              </h2>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5">
          {user ? (
            /* Signed-in state */
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            /* Signed-out state */
            <div className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Sign in to sync your notes across devices. Your log stays
                private — only you can see it.
              </p>

              {/* Error banner */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
                >
                  {error}
                </div>
              )}

              <button
                id="btn-google"
                onClick={() => signIn("google")}
                disabled={loading !== null}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === "google" ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <button
                id="btn-x"
                onClick={() => signIn("twitter")}
                disabled={loading !== null}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === "twitter" ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <XIcon />
                )}
                Continue with X
              </button>

              <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Demo mode — now a real button */}
              <button
                id="btn-demo-mode"
                onClick={onClose}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-dashed
                           text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Continue in demo mode
              </button>

              <p className="text-center text-xs text-muted-foreground/60">
                Demo mode uses a shared local account. No sign-in required.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
