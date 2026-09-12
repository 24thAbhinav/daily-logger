"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
  RefreshCw,
  ChevronRight,
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
  return <div className="h-36 rounded-xl border shimmer" aria-hidden="true" />;
}

/* ─── Landing sub-components ─────────────────────────────────── */

const FEATURES = [
  {
    icon: Lock,
    title: "Stays private",
    body: "Your notes live in your own database. No ads, no tracking, no third-party reading your thoughts.",
  },
  {
    icon: Zap,
    title: "Zero friction",
    body: "Open, write, done. No folders, no tags required. Just you and a blank line ready for the next idea.",
  },
  {
    icon: RefreshCw,
    title: "Compounds over time",
    body: "Browse any past date, search across everything, and watch the small wins add up into something real.",
  },
];

const STATS = [
  { value: "365+", label: "days supported" },
  { value: "∞",    label: "entries per day"  },
  { value: "0",    label: "ads or trackers"  },
];

interface LandingProps {
  onEnterApp: () => void;
  onSignIn: () => void;
}

function LandingPage({ onEnterApp, onSignIn }: LandingProps) {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />
        <div className="hero-orb hero-orb-3" aria-hidden="true" />

        {/* Nav */}
        <nav
          className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12"
          aria-label="Site navigation"
        >
          <a
            href="#"
            className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(17,79%,47%)] text-white">
              <BookOpen size={15} aria-hidden="true" />
            </div>
            <span className="text-white font-semibold text-lg tracking-[-0.04em]">
              daily <span className="font-light text-white/40">/</span> logger
            </span>
          </a>

          <button
            id="landing-sign-in"
            onClick={onSignIn}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium
                       text-white/80 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
          >
            Sign in
          </button>

          <div className="hero-nav-glow" aria-hidden="true" />
        </nav>

        {/* Body */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-12 text-center">
          {/* Badge */}
          <div
            className="animate-badge-pop mb-8 inline-flex items-center gap-2 rounded-full border border-white/10
                        bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]
                        text-white/60 backdrop-blur-sm"
          >
            <Sparkles size={11} className="text-[hsl(17,79%,60%)]" aria-hidden="true" />
            Private · Local-first · No clutter
          </div>

          {/* Headline */}
          <h1
            className="animate-hero-fade-up gradient-headline max-w-3xl text-5xl font-bold
                       leading-[1.12] tracking-[-0.04em] md:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Capture what you learn.
            <br />
            Watch yourself grow.
          </h1>

          {/* Sub */}
          <p
            className="animate-hero-fade-up mt-6 max-w-xl text-base leading-7 text-white/50 md:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            A quiet, private daily log for developers, builders, and curious minds.
            Track insights, ideas, and small wins — before they slip away.
          </p>

          {/* CTAs */}
          <div
            className="animate-hero-fade-up mt-10 flex flex-col items-center gap-3 sm:flex-row"
            style={{ animationDelay: "280ms" }}
          >
            <button
              id="landing-start-writing"
              onClick={onEnterApp}
              className="cta-glow inline-flex h-12 items-center gap-2 rounded-xl
                         bg-[hsl(17,79%,47%)] px-7 text-sm font-semibold text-white"
            >
              Start writing — it&apos;s free
              <ArrowRight size={15} aria-hidden="true" />
            </button>

            <button
              id="landing-sign-in-alt"
              onClick={onSignIn}
              className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-white/10
                         px-6 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 transition-all"
            >
              Sign in <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Stats */}
          <div
            className="animate-hero-fade-up mt-16 flex flex-wrap items-center justify-center gap-8"
            style={{ animationDelay: "380ms" }}
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="mt-0.5 text-xs text-white/35 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fade to features */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-48"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(220,25%,5%) 90%)" }}
          aria-hidden="true"
        />
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section
        className="relative bg-[hsl(220,25%,5%)] px-6 pb-28 pt-4 md:px-12"
        aria-label="Features"
      >
        <div className="mx-auto max-w-5xl">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/25">
            Why daily / logger
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card p-6">
                <div
                  className="mb-4 grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: "hsl(17,79%,47%,0.15)" }}
                >
                  <f.icon size={18} className="text-[hsl(17,79%,60%)]" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-6 text-white/45">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section
        className="bg-[hsl(220,25%,4%)] px-6 py-20 text-center"
        aria-label="Call to action"
      >
        <p className="mx-auto mb-6 max-w-md text-xl font-semibold leading-snug text-white md:text-2xl">
          The best time to start was yesterday.
          <br />
          <span className="text-white/40">The second best time is now.</span>
        </p>
        <button
          id="landing-bottom-cta"
          onClick={onEnterApp}
          className="cta-glow inline-flex h-12 items-center gap-2 rounded-xl
                     bg-[hsl(17,79%,47%)] px-8 text-sm font-semibold text-white"
        >
          Open the logger <ArrowRight size={15} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

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
  const [composerInitialBody, setComposerInitialBody] = useState("");
  const [query, setQuery] = useState("");
  const [showApp, setShowApp] = useState(false);

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

  /* ── Entries for selected date ── */
  const visibleEntries = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.entry_date === selectedDate &&
          `${e.title} ${e.body} ${e.tag}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [entries, selectedDate, query],
  );

  const dayCount = entries.filter((e) => e.entry_date === selectedDate).length;

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

  /* ── Landing ── */
  if (!showApp) {
    return (
      <>
        <LandingPage onEnterApp={() => setShowApp(true)} onSignIn={() => setAuthOpen(true)} />
        {authOpen && (
          <AuthModal user={user} onClose={() => setAuthOpen(false)} onSignOut={handleSignOut} />
        )}
      </>
    );
  }

  /* ── App ── */
  return (
    <main className="min-h-screen">
      {/* ═══ Header ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8">
          <a
            href="#top"
            className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen size={16} aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold tracking-[-0.04em]">
              daily <span className="font-light text-muted-foreground">/</span> logger
            </span>
          </a>

          <button
            onClick={() => setAuthOpen(true)}
            aria-label={user ? `Open profile for ${user.name}` : "Sign in"}
            className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2
                       text-sm font-medium hover:bg-muted transition-colors"
          >
            {user ? (
              <>
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </div>
      </header>

      {/* ═══ Content ═══════════════════════════════════════════════ */}
      <div
        id="top"
        className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 pt-10 md:px-8 lg:grid-cols-[1fr_290px] lg:gap-14 lg:pt-14"
      >
        <section>
          {/* Hero */}
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles size={13} aria-hidden="true" />
                A little record of becoming
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.06em] md:text-5xl">
                What did you learn
                <br className="hidden md:block" />
                today?
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                Keep the small things. They compound into something bigger than you expect.
                So keep logging
              </p>
            </div>

            <button
              id="btn-add-note"
              onClick={() => openComposer()}
              className="hidden md:inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5
                         text-sm font-semibold text-primary-foreground shadow-sm
                         hover:-translate-y-0.5 hover:brightness-105 transition-all"
            >
              <Plus size={17} aria-hidden="true" />
              Add a note
            </button>
          </div>

          <DateNav
            selectedDate={selectedDate}
            entryCount={dayCount}
            onPrev={() => setSelectedDate(shiftDate(selectedDate, -1))}
            onNext={() => setSelectedDate(shiftDate(selectedDate, 1))}
            onToday={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
          />

          <div className="relative mt-4">
            <Search
              size={15}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <label htmlFor="search" className="sr-only">Search notes</label>
            <input
              id="search"
              type="search"
              placeholder="Search notes for this day…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border bg-card pl-10 pr-4 text-sm
                         outline-none placeholder:text-muted-foreground focus-visible:ring-2
                         focus-visible:ring-ring transition-shadow"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-center justify-between rounded-xl border border-destructive/30
                         bg-destructive/5 px-4 py-3 text-sm"
            >
              <span className="text-destructive">{error}</span>
              <button
                onClick={() => { setError(null); fetchEntries(); }}
                className="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary
                           hover:bg-muted transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-4" aria-label="Loading notes">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            ) : visibleEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/60 px-6 py-16 text-center animate-fade-in">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-primary">
                  <CalendarDays size={20} aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">
                  {query ? "No matches found." : "A blank page, for now."}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  {query
                    ? "Try a different search term, or clear it to see all notes."
                    : "The best time to capture a thought is while it's still warm."}
                </p>
                {!query && (
                  <button
                    onClick={() => openComposer()}
                    className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl border
                               bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Plus size={15} aria-hidden="true" />
                    Write the first one
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleEntries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onUpdate={updateEntry}
                    style={{ animationDelay: `${i * 40}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <Sidebar
          entries={entries}
          selectedDate={selectedDate}
          onPromptClick={(body) => openComposer(body)}
        />
      </div>

      {/* ═══ FAB (mobile) ══════════════════════════════════════════ */}
      <button
        id="btn-add-note-fab"
        onClick={() => openComposer()}
        aria-label="Add a note"
        className="fixed bottom-6 right-6 z-20 md:hidden
                   grid h-14 w-14 place-items-center rounded-full bg-primary
                   text-primary-foreground shadow-modal
                   hover:brightness-105 active:scale-95 transition-all"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      {composerOpen && (
        <Composer
          selectedDate={selectedDate}
          initialBody={composerInitialBody}
          onSave={handleSave}
          onClose={() => { setComposerOpen(false); setComposerInitialBody(""); }}
        />
      )}

      {authOpen && (
        <AuthModal user={user} onClose={() => setAuthOpen(false)} onSignOut={handleSignOut} />
      )}
    </main>
  );
}
