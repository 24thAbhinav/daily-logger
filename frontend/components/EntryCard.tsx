"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { Entry } from "../lib/store";
import { updateEntry as apiUpdate } from "../lib/api";

/* ─── Helpers ────────────────────────────────────────────────── */

const TAG_CLASSES: Record<string, string> = {
  Learning: "tag-learning",
  "Build log": "tag-buildlog",
  Thought: "tag-thought",
  Life: "tag-life",
};

function tagClass(tag: string): string {
  return TAG_CLASSES[tag] ?? "tag-default";
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/* ─── Props ──────────────────────────────────────────────────── */

type Props = {
  entry: Entry;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<Entry>) => void;
  style?: React.CSSProperties;
};

/* ─── Component ──────────────────────────────────────────────── */

export function EntryCard({ entry, onDelete, onUpdate, style }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editBody, setEditBody] = useState(entry.body);
  const [editTag, setEditTag] = useState(entry.tag);

  async function saveEdit() {
    setSaving(true);
    try {
      const updated = await apiUpdate(entry.id, {
        title: editTitle,
        body: editBody,
        tag: editTag,
      });
      onUpdate(entry.id, updated);
      setEditing(false);
    } catch {
      // keep editor open on failure
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditTitle(entry.title);
    setEditBody(entry.body);
    setEditTag(entry.tag);
    setEditing(false);
  }

  const tags = ["Learning", "Build log", "Thought", "Life"];

  return (
    <article
      style={style}
      className="group relative rounded-xl border bg-card shadow-soft transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-card animate-fade-in"
    >
      {/* ── View mode ── */}
      {!editing && (
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${tagClass(entry.tag)}`}
                >
                  {entry.tag}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {timeLabel(entry.created_at)}
                  {entry.updated_at && entry.updated_at !== entry.created_at && (
                    <span className="ml-1 text-[10px] opacity-70">(edited)</span>
                  )}
                </span>
              </div>

              <button
                onClick={() => setExpanded((p) => !p)}
                className="text-left"
              >
                <h2 className="text-base font-semibold leading-snug tracking-[-0.02em] transition-colors group-hover:text-primary">
                  {entry.title}
                </h2>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {confirming ? (
                <>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    aria-label="Cancel delete"
                    onClick={() => setConfirming(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    aria-label="Edit entry"
                    onClick={() => setEditing(true)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    aria-label={`Delete ${entry.title}`}
                    onClick={() => setConfirming(true)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body — collapsed / expanded */}
          <div
            className={`mt-3 overflow-hidden transition-all duration-300 ${
              expanded ? "max-h-[600px]" : "max-h-[4.5rem]"
            }`}
          >
            <p
              className={`whitespace-pre-wrap text-sm leading-7 text-muted-foreground ${
                !expanded ? "line-clamp-3" : ""
              }`}
            >
              {entry.body}
            </p>
          </div>

          {/* Expand toggle (only if body is long) */}
          {entry.body.length > 220 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="mt-2 text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* ── Edit mode ── */}
      {editing && (
        <div className="p-5 animate-scale-in">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              Editing
            </p>
            <button
              onClick={cancelEdit}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
              placeholder="Title"
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
              placeholder="Your note..."
            />
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditTag(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    editTag === t
                      ? "ring-2 ring-primary ring-offset-1 " + tagClass(t)
                      : tagClass(t) + " opacity-60 hover:opacity-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-60 transition-all"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Check size={14} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
