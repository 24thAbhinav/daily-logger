"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Plus, X, Calendar, Sparkles } from "lucide-react";
import type { Entry } from "../lib/store";
import { createEntry } from "../lib/api";

const TAGS = ["Learning", "Build log", "Thought", "Life"];

const TAG_CLASSES: Record<string, string> = {
  Learning: "tag-learning",
  "Build log": "tag-buildlog",
  Thought: "tag-thought",
  Life: "tag-life",
};

const TEMPLATES = [
  { label: "Today I learned", prefix: "Today I learned: " },
  { label: "Shipped today", prefix: "Shipped: \nImpact: " },
  { label: "Architecture decision", prefix: "Decision: \nContext: \nTrade-offs: " },
  { label: "Bug analysis", prefix: "Problem: \nRoot cause: \nFix: " },
];

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

type Props = {
  selectedDate: string;
  initialBody?: string;
  onSave: (entry: Entry) => void;
  onClose: () => void;
};

export function Composer({ selectedDate, initialBody = "", onSave, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(initialBody);
  const [tag, setTag] = useState("Learning");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title on mount
  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts: Escape to close, Cmd+Enter to submit
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (title.trim() && body.trim() && !saving) {
          submitDirect();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, title, body, saving]);

  async function submitDirect() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const entry = await createEntry({
        entry_date: selectedDate,
        title: title.trim(),
        body: body.trim(),
        tag,
      });
      onSave(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    await submitDirect();
  }

  function applyTemplate(prefix: string) {
    setBody((prev) => (prev ? `${prev}\n\n${prefix}` : prefix));
  }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
        className="w-full max-w-xl rounded-xl border bg-card shadow-modal animate-scale-in"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground-muted">
              <Calendar size={12} />
              {formatDate(selectedDate)}
            </span>
            <span className="text-xs text-foreground-subtle">/</span>
            <h2 id="composer-title" className="text-sm font-semibold tracking-tight text-foreground">
              New Daily Note
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-flex">Esc</kbd>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="space-y-3.5 p-5">
          {/* Quick template triggers */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-foreground-subtle mr-1">
              <Sparkles size={11} className="text-primary" />
              Templates:
            </span>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl.prefix)}
                className="rounded-md border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground-muted hover:bg-card hover:text-foreground transition-colors"
              >
                + {tpl.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="composer-input-title" className="sr-only">
              Title
            </label>
            <input
              id="composer-input-title"
              ref={titleRef}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you learn or ship today?..."
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow placeholder:text-foreground-subtle placeholder:font-normal"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="composer-input-body" className="sr-only">
              Note Content
            </label>
            <textarea
              id="composer-input-body"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your reflection, notes, architecture thoughts, or discoveries..."
              rows={6}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow placeholder:text-foreground-subtle"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-foreground-subtle">
              <span>Supports plain text & markdown notes</span>
              <span className="font-mono">
                {wordCount} {wordCount === 1 ? "word" : "words"} · {body.length} chars
              </span>
            </div>
          </div>

          {/* Tag Selector */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-foreground-muted mr-1.5">
                Category:
              </span>
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                    TAG_CLASSES[t] ?? "tag-default"
                  } ${tag === t ? "ring-2 ring-primary ring-offset-1" : "opacity-50 hover:opacity-100"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/20">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-foreground-subtle">
            <kbd>⌘</kbd> + <kbd>Enter</kbd> to save
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg px-3 text-xs font-medium text-foreground-muted hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !body.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-xs font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Check size={13} />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
