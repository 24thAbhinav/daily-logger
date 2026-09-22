"use client";

import { useEffect, useState } from "react";
import { LogOut, X, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { authClient } from "../lib/auth-client";
import type { User } from "../lib/store";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

type Props = {
  user: User | null;
  onClose: () => void;
  onSignOut: () => void;
};

export function AuthModal({ user, onClose, onSignOut }: Props) {
  const [loading, setLoading] = useState<"google" | "twitter" | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (result?.error) {
        const code = (result.error as any).code as string | undefined;
        const providerLabel = provider === "google" ? "Google" : "X";
        const msg =
          code === "PROVIDER_NOT_FOUND"
            ? `${providerLabel} sign-in isn't configured. Set ${
                provider === "google" ? "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET" : "X_CLIENT_ID / X_CLIENT_SECRET"
              } in your environment and redeploy.`
            : result.error.message ||
              code ||
              "Sign-in failed. Please verify OAuth callback URL settings.";
        setError(msg);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not connect to the auth provider. Try demo mode.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-modal animate-scale-in"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 id="auth-title" className="text-sm font-bold tracking-tight text-foreground">
                {user ? "Your Workspace Account" : "Sign In to Daily Logger"}
              </h2>
              <p className="text-[11px] text-foreground-subtle">Private & Local-First</p>
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="pt-4">
          {user ? (
            /* Signed-in state */
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-foreground-muted">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border bg-emerald-500/10 p-2.5 text-xs text-emerald-500">
                <ShieldCheck size={16} className="shrink-0" />
                <span>Connected & synchronizing with your personal database.</span>
              </div>

              <button
                onClick={onSignOut}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border bg-background text-xs font-semibold text-foreground-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            /* Signed-out state */
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-foreground-muted">
                Sync your daily logs seamlessly across devices. Data is private to your account.
              </p>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  id="btn-google"
                  onClick={() => signIn("google")}
                  disabled={loading !== null}
                  className="flex h-9 w-full items-center justify-center gap-2.5 rounded-lg border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {loading === "google" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                <button
                  id="btn-x"
                  onClick={() => signIn("twitter")}
                  disabled={loading !== null}
                  className="flex h-9 w-full items-center justify-center gap-2.5 rounded-lg border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {loading === "twitter" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XIcon />
                  )}
                  Continue with X
                </button>
              </div>

              <div className="flex items-center gap-2 py-1 text-xs text-foreground-subtle">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] uppercase tracking-wider">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <button
                id="btn-demo-mode"
                onClick={onClose}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/30 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <span>Continue in Demo Mode</span>
                <ArrowRight size={13} className="text-foreground-muted" />
              </button>

              <p className="text-center text-[11px] text-foreground-subtle">
                Demo mode uses a shared local workspace. No login required.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
