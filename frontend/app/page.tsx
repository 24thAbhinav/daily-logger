"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  BookOpen,
  CalendarDays,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  Command,
  Sun,
  Moon,
  Keyboard,
  X,
  CheckCircle2,
  Terminal,
  Database,
  Layers,
} from "lucide-react";

import { getEntries, deleteEntry as apiDelete } from "../lib/api";
import { authClient, useSession } from "../lib/auth-client";
import { useLoggerStore, type Entry } from "../lib/store";

import { EntryCard } from "../components/EntryCard";
import { Composer } from "../components/Composer";
import { AuthModal } from "../components/AuthModal";
import { Sidebar } from "../components/Sidebar";
import { DateNav } from "../components/DateNav";

/* ─── Helpers ─────────────────────────────────────────────────── */

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function SkeletonCard() {
  return <div className="h-32 rounded-xl border bg-muted/30 shimmer" aria-hidden="true" />;
}

/* ─── Landing Page Subcomponents (Zero Gradients) ─────────────── */

const SAAS_FEATURES = [
  {
    icon: Zap,
    title: "Zero-Friction Capture",
    description: "Write your thoughts between commits without wrestling with folders, tags, or complex setups.",
  },
  {
    icon: ShieldCheck,
    title: "Local-First & Private",
    description: "Your database, your keys. No third-party AI models scraping your private notes or logs.",
  },
  {
    icon: Command,
    title: "Keyboard-Driven Flow",
    description: "Navigate days with J/K, search instantly with /, and create notes with N without touching the mouse.",
  },
  {
    icon: Layers,
    title: "Compound Analytics",
    description: "Visualize your 7-day consistency and category distribution across Learning, Build logs, and Thoughts.",
  },
  {
    icon: Database,
    title: "Dual Engine Ready",
    description: "Runs seamlessly on local SQLite for quick hacking or PostgreSQL for production multi-device sync.",
  },
  {
    icon: Terminal,
    title: "Developer Aesthetic",
    description: "High-density, distraction-free typography with dark and light themes crafted for engineers.",
  },
];

const METRIC_BADGES = [
  { label: "Query latency", value: "< 25ms" },
  { label: "Data ownership", value: "100% Private" },
  { label: "Telemetry or ads", value: "Zero" },
  { label: "Storage", value: "SQLite / Postgres" },
];

interface LandingProps {
  onEnterApp: () => void;
  onSignIn: () => void;
}

function LandingPage({ onEnterApp, onSignIn }: LandingProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen size={16} />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              daily <span className="text-foreground-subtle">/</span> logger
            </span>
            <span className="hidden sm:inline-flex items-center rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-mono font-medium text-foreground-muted">
              v2.0 · Local-First
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-sign-in"
              onClick={onSignIn}
              className="h-9 rounded-lg px-3.5 text-xs font-medium text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              Sign In
            </button>
            <button
              id="landing-start-writing"
              onClick={onEnterApp}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              <span>Launch App</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        {/* Announcement Pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3.5 py-1 text-xs font-medium text-foreground-muted">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span>Private daily logging for developers & high-output teams</span>
        </div>

        {/* Solid Headline (No Gradients) */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[1.15]">
          The high-velocity daily log for modern builders.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground-muted sm:text-lg">
          Capture architectural decisions, solved bugs, and hard-earned lessons in seconds.
          Stay in the flow, reflect with clarity, and build an enduring personal archive.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onEnterApp}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm"
          >
            Start Logging — It&apos;s Free
            <ArrowRight size={15} />
          </button>
          <button
            onClick={onSignIn}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border bg-card px-5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Sign In with Google / X
          </button>
        </div>

        {/* Metric Badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-8 border-y py-6">
          {METRIC_BADGES.map((m) => (
            <div key={m.label} className="text-center px-3">
              <div className="font-mono text-lg font-bold text-foreground">{m.value}</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Interactive SaaS Product Mockup ── */}
        <div className="mt-14 rounded-2xl border bg-card p-2 sm:p-4 text-left shadow-modal">
          <div className="flex items-center justify-between border-b pb-3 px-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-border" />
                <div className="h-3 w-3 rounded-full bg-border" />
                <div className="h-3 w-3 rounded-full bg-border" />
              </div>
              <span className="ml-2 font-mono text-xs text-foreground-subtle">
                daily-logger // workspace-demo
              </span>
            </div>
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
            >
              Open Live <ArrowRight size={12} />
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              {/* Mock Date Bar */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-foreground">Today</span>
                  <span className="text-foreground-subtle">· September 13, 2026</span>
                </div>
                <span className="font-mono text-[11px] text-foreground-muted">2 entries logged</span>
              </div>

              {/* Sample Card 1 */}
              <div className="rounded-xl border bg-background p-4 shadow-soft">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="tag-learning rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    Learning
                  </span>
                  <span className="font-mono text-xs text-foreground-subtle">10:45 AM</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Optimized BetterAuth session caching with local cookie fallback
                </h3>
                <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                  Avoided a database query on every protected route by validating the HMAC token directly on the edge. Latency dropped from 140ms to 18ms.
                </p>
              </div>

              {/* Sample Card 2 */}
              <div className="rounded-xl border bg-background p-4 shadow-soft">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="tag-buildlog rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    Build log
                  </span>
                  <span className="font-mono text-xs text-foreground-subtle">04:20 PM</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Shipped keyboard-first shortcut navigation
                </h3>
                <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                  Implemented J/K date jumping and N key note creation. Feels as fast as Linear.
                </p>
              </div>
            </div>

            {/* Mock Sidebar */}
            <div className="hidden lg:block space-y-3">
              <div className="rounded-xl border bg-background p-3.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-2">
                  Consistency
                </div>
                <div className="flex justify-between gap-1 mb-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className={`h-5 w-full rounded ${i < 6 ? "bg-primary" : "bg-muted"}`} />
                      <span className="text-[9px] text-foreground-subtle">{d}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-foreground-muted">
                  <span className="font-bold text-foreground">6-day streak</span> maintained
                </div>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 text-xs text-foreground-muted">
                <p className="font-semibold text-foreground mb-1">Hotkeys</p>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span>New Note</span><kbd>N</kbd></div>
                  <div className="flex justify-between"><span>Next Day</span><kbd>K</kbd></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid (Solid Cards, Zero Gradients) ── */}
      <section className="border-t bg-muted/10 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Built For Flow
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="mt-3 text-sm text-foreground-muted max-w-xl mx-auto">
              Designed around the daily rhythms of software engineering, system design, and creative work.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SAAS_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 transition-all hover:border-foreground/30 shadow-soft"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon size={18} />
                </div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Banner ── */}
      <section className="border-t py-16 px-6 text-center">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 sm:p-12 shadow-soft">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Start logging your daily wins today.
          </h2>
          <p className="mt-3 text-sm text-foreground-muted">
            Free forever for personal use. No credit card required.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={onEnterApp}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm"
            >
              Open Daily Logger <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 px-6 text-xs text-foreground-subtle">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground-muted">All Systems Operational</span>
          </div>
          <div>© {new Date().getFullYear()} daily / logger. Built for builders.</div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Keyboard Shortcuts Modal ────────────────────────────────── */

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shortcuts = [
    { key: "N", desc: "Compose new note" },
    { key: "/", desc: "Focus search input" },
    { key: "J", desc: "Previous day" },
    { key: "K", desc: "Next day" },
    { key: "T", desc: "Jump to today" },
    { key: "Esc", desc: "Close dialogs / clear focus" },
    { key: "⌘ + Enter", desc: "Save note in composer" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-modal animate-scale-in">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <Keyboard size={16} className="text-primary" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-xs"
            >
              <span className="text-foreground-muted">{s.desc}</span>
              <kbd>{s.key}</kbd>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-foreground-subtle">
          Press <kbd>Esc</kbd> to close this dialog
        </p>
      </div>
    </div>
  );
}

/* ─── Main Application Page ───────────────────────────────────── */

export default function Home() {
  const {
    user, setUser,
    entries, setEntries, addEntry, updateEntry, removeEntry,
    selectedDate, setSelectedDate,
    isLoading, setLoading,
    error, setError,
  } = useLoggerStore();

  const { data: session } = useSession();
  const [composerOpen, setComposerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [composerInitialBody, setComposerInitialBody] = useState("");
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showApp, setShowApp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Sync theme class on <html> ── */
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  /* ── Sync Better Auth session → Zustand user ── */
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? "User",
        image: (session.user as any).image ?? null,
      });
      setShowApp(true);
    } else {
      setUser(null);
    }
  }, [session, setUser]);

  /* ── Fetch entries ── */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEntries();
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load entries.");
    }
  }, [setEntries, setLoading, setError]);

  useEffect(() => {
    if (showApp) fetchEntries();
  }, [showApp, fetchEntries]);

  /* ── Global Keyboard Shortcuts ── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setComposerOpen(true);
      } else if (e.key === "j" || e.key === "J" || e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedDate(shiftDate(selectedDate, -1));
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedDate(shiftDate(selectedDate, 1));
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setSelectedDate(new Date().toISOString().slice(0, 10));
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((p) => !p);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDate, setSelectedDate]);

  /* ── Entries filtering ── */
  const dayEntries = useMemo(
    () => entries.filter((e) => e.entry_date === selectedDate),
    [entries, selectedDate],
  );

  const visibleEntries = useMemo(() => {
    return dayEntries.filter((e) => {
      const matchesQuery =
        !query ||
        `${e.title} ${e.body} ${e.tag}`.toLowerCase().includes(query.toLowerCase());
      const matchesTag = !selectedTag || e.tag === selectedTag;
      return matchesQuery && matchesTag;
    });
  }, [dayEntries, query, selectedTag]);

  const tagList = ["Learning", "Build log", "Thought", "Life"];

  /* ── Handlers ── */
  function openComposer(initialBody = "") {
    setComposerInitialBody(initialBody);
    setComposerOpen(true);
  }

  function handleSave(entry: Entry) {
    addEntry(entry);
    setComposerOpen(false);
  }

  async function handleDelete(id: number) {
    try {
      await apiDelete(id);
      removeEntry(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete entry.");
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    setUser(null);
    setShowApp(false);
    setAuthOpen(false);
  }

  /* ── Landing Page View ── */
  if (!showApp) {
    return (
      <>
        <LandingPage
          onEnterApp={() => setShowApp(true)}
          onSignIn={() => setAuthOpen(true)}
        />
        {authOpen && (
          <AuthModal user={user} onClose={() => setAuthOpen(false)} onSignOut={handleSignOut} />
        )}
      </>
    );
  }

  /* ── SaaS App Interface ── */
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ═══ Header ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo & Workspace Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowApp(false)}
              className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Return to home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen size={16} />
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground hidden sm:inline">
                daily <span className="text-foreground-subtle">/</span> logger
              </span>
            </button>

            <span className="text-foreground-subtle hidden sm:inline">/</span>
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-foreground-muted">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{user ? user.name : "Personal Workspace"}</span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Keyboard shortcut guide */}
            <button
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              <Keyboard size={15} />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle theme"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* New Note Button */}
            <button
              id="btn-add-note-header"
              onClick={() => openComposer()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Plus size={14} />
              <span>New Entry</span>
              <kbd className="ml-1 hidden md:inline-flex text-[10px] opacity-80 border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground">
                N
              </kbd>
            </button>

            {/* Profile Avatar / Auth */}
            <button
              onClick={() => setAuthOpen(true)}
              aria-label={user ? `Profile for ${user.name}` : "Sign in"}
              className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {user ? (
                <>
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline">{user.name.split(" ")[0]}</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Content Grid ═════════════════════════════════════════ */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 pt-8 md:px-8 lg:grid-cols-[1fr_300px] lg:gap-10">
        <section className="min-w-0 space-y-4">
          {/* Date Navigator & Picker Bar */}
          <DateNav
            selectedDate={selectedDate}
            entryCount={dayEntries.length}
            onPrev={() => setSelectedDate(shiftDate(selectedDate, -1))}
            onNext={() => setSelectedDate(shiftDate(selectedDate, 1))}
            onToday={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            onSelectDate={(date) => setSelectedDate(date)}
          />

          {/* Search & Tag Filter Toolbar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input with shortcut hint */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search entries for this date... (press / to focus)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg border bg-card pl-9 pr-8 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow placeholder:text-foreground-subtle"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex text-[10px]">
                  /
                </kbd>
              )}
            </div>

            {/* Tag Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTag === null
                    ? "bg-foreground text-background"
                    : "border bg-card text-foreground-muted hover:bg-muted"
                }`}
              >
                All ({dayEntries.length})
              </button>

              {tagList.map((t) => {
                const count = dayEntries.filter((e) => e.tag === t).length;
                const isSelected = selectedTag === t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(isSelected ? null : t)}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-foreground text-background"
                        : "border bg-card text-foreground-muted hover:bg-muted"
                    }`}
                  >
                    <span>{t}</span>
                    <span className="font-mono text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <span>{error}</span>
              <button
                onClick={() => { setError(null); fetchEntries(); }}
                className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-semibold hover:bg-destructive/20 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Notes List */}
          <div>
            {isLoading ? (
              <div className="space-y-3" aria-label="Loading notes">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : visibleEntries.length === 0 ? (
              /* SaaS Empty State */
              <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center animate-fade-in">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40 text-foreground-muted">
                  <CalendarDays size={18} />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {query || selectedTag ? "No matching entries found" : "No entries recorded for this date"}
                </h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-foreground-muted">
                  {query || selectedTag
                    ? "Try adjusting your search query or category filters."
                    : "Capture your thoughts, solved problems, or daily learnings."}
                </p>

                {/* Quick Prompts inside Empty State */}
                {!query && !selectedTag && (
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => openComposer("Shipped today: \nImpact: ")}
                        className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground-muted hover:border-primary/40 hover:text-foreground transition-colors"
                      >
                        + Shipped today
                      </button>
                      <button
                        onClick={() => openComposer("Today I learned: ")}
                        className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground-muted hover:border-primary/40 hover:text-foreground transition-colors"
                      >
                        + Key insight
                      </button>
                      <button
                        onClick={() => openComposer("Architecture decision: \nTrade-offs: ")}
                        className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground-muted hover:border-primary/40 hover:text-foreground transition-colors"
                      >
                        + Architecture note
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={() => openComposer()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Create First Entry (N)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleEntries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onUpdate={updateEntry}
                    style={{ animationDelay: `${i * 30}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══ Sidebar ══════════════════════════════════════════════ */}
        <Sidebar
          entries={entries}
          selectedDate={selectedDate}
          onPromptClick={(body) => openComposer(body)}
        />
      </div>

      {/* ═══ Mobile Floating Action Button ═════════════════════════ */}
      <button
        id="btn-add-note-fab"
        onClick={() => openComposer()}
        aria-label="Add new note"
        className="fixed bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-modal md:hidden hover:bg-primary-hover active:scale-95 transition-all"
      >
        <Plus size={20} />
      </button>

      {/* ═══ Modals ════════════════════════════════════════════════ */}
      {composerOpen && (
        <Composer
          selectedDate={selectedDate}
          initialBody={composerInitialBody}
          onSave={handleSave}
          onClose={() => {
            setComposerOpen(false);
            setComposerInitialBody("");
          }}
        />
      )}

      {authOpen && (
        <AuthModal
          user={user}
          onClose={() => setAuthOpen(false)}
          onSignOut={handleSignOut}
        />
      )}

      {shortcutsOpen && (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      )}
    </main>
  );
}
