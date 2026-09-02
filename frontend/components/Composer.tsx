"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { Entry } from "../lib/store";
import { createEntry } from "../lib/api";

const TAGS = ["Learning", "Build log", "Thought", "Life"];

const TAG_CLASSES: Record<string, string> = {
  Learning: "tag-learning",
  "Build log": "tag-buildlog",
  Thought: "tag-thought",
  Life: "tag-life",
};

const PROMPTS = [
  "The idea that stayed with me today…",
  "One thing I finally understand…",
  "Something I built or shipped…",
  "A thought I keep returning to…",
  "What surprised me today…",
  "A small win worth recording…",
];

function randomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
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
  const placeholder = useRef(randomPrompt());
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title on mount
  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 60);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
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
      setError(err instanceof Error ? err.message : "Couldn't save this entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/20 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog */}
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
        className="w-full max-w-lg rounded-2xl border bg-card shadow-modal animate-slide-up"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              <Sparkles size={12} aria-hidden="true" />
              {formatDate(selectedDate)}
            </p>
            <h2
              id="composer-title"
              className="mt-1.5 text-2xl font-semibold tracking-[-0.04em]"
            >
              Add to the record
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close note composer"
            onClick={onClose}
            className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="space-y-4 px-6 py-5">
          {/* Title */}
          <div>
            <label htmlFor="c-title" className="mb-1.5 block text-sm font-medium">
              Title <span className="text-primary">*</span>
            </label>
            <input
              id="c-title"
              ref={titleRef}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={placeholder.current}
              className="h-11 w-full rounded-xl border bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="c-body" className="mb-1.5 block text-sm font-medium">
              Note <span className="text-primary">*</span>
            </label>
            <textarea
              id="c-body"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="A few sentences is enough…"
              rows={5}
              className="w-full resize-none rounded-xl border bg-background px-3.5 py-3 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            />
            <p className="mt-1 text-right font-mono text-[11px] text-muted-foreground">
              {body.length} / 10 000
            </p>
          </div>

          {/* Tag */}
          <div>
            <p className="mb-2 text-sm font-medium">Tag</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    TAG_CLASSES[t] ?? "tag-default"
                  } ${tag === t ? "ring-2 ring-primary ring-offset-1" : "opacity-55 hover:opacity-100"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !body.trim()}
            aria-busy={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 transition-all"
          >
            {saving ? (
              "Saving…"
            ) : (
              <>
                <Check size={15} />
                Save note
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
