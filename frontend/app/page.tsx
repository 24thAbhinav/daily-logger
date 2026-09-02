"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, Plus, Search, Sparkles } from "lucide-react";

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
  return (
    <div className="h-36 rounded-xl border shimmer" aria-hidden="true" />
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

  /* ── Sync Better Auth session → Zustand user ── */
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? "User",
        image: (session.user as any).image ?? null,
      });
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
    fetchEntries();
  }, [fetchEntries]);

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
    setAuthOpen(false);
  }

  /* ── Render ── */
  return (
    <main className="min-h-screen">
      {/* ═══ Header ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8">
          {/* Logo */}
          <a
            href="#top"
            className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen size={16} aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold tracking-[-0.04em]">
              daily{" "}
              <span className="font-light text-muted-foreground">/</span>{" "}
              logger
            </span>
          </a>

          {/* Right — user avatar / sign in */}
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
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
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
        {/* ── Main column ── */}
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
                Keep the small things. They compound into something bigger than
                you expect.
              </p>
            </div>

            {/* Add button (desktop) */}
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

          {/* Date nav + search */}
          <DateNav
            selectedDate={selectedDate}
            entryCount={dayCount}
            onPrev={() => setSelectedDate(shiftDate(selectedDate, -1))}
            onNext={() => setSelectedDate(shiftDate(selectedDate, 1))}
            onToday={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
          />

          {/* Search bar */}
          <div className="relative mt-4">
            <Search
              size={15}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <label htmlFor="search" className="sr-only">
              Search notes
            </label>
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

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="mt-5 flex items-center justify-between rounded-xl border border-destructive/30
                         bg-destructive/5 px-4 py-3 text-sm"
            >
              <span className="text-destructive">{error}</span>
              <button
                onClick={() => {
                  setError(null);
                  fetchEntries();
                }}
                className="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary
                           hover:bg-muted transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Entry list */}
          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-4" aria-label="Loading notes">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
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

        {/* ── Sidebar ── */}
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

      {/* ═══ Composer overlay ══════════════════════════════════════ */}
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

      {/* ═══ Auth modal ════════════════════════════════════════════ */}
      {authOpen && (
        <AuthModal
          user={user}
          onClose={() => setAuthOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </main>
  );
}
