"use client";

import { useState } from "react";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import type { Entry } from "../lib/store";
import { updateEntry as apiUpdate } from "../lib/api";

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
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

type Props = {
  entry: Entry;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<Entry>) => void;
  style?: React.CSSProperties;
};

export function EntryCard({ entry, onDelete, onUpdate, style }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function copyContent() {
    const text = `${entry.title}\n\n${entry.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tags = ["Learning", "Build log", "Thought", "Life"];

  return (
    <article
      style={style}
      className="group relative rounded-xl border bg-card p-5 transition-all duration-150 hover:border-foreground/30 shadow-soft"
    >
      {/* ── View mode ── */}
      {!editing && (
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${tagClass(
                    entry.tag,
                  )}`}
                >
                  {entry.tag}
                </span>

                <span className="font-mono text-xs text-foreground-subtle">
                  {timeLabel(entry.created_at)}
                  {entry.updated_at && entry.updated_at !== entry.created_at && (
                    <span className="ml-1 text-[10px] opacity-75">(edited)</span>
                  )}
                </span>
              </div>

              <h2 className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
                {entry.title}
              </h2>
            </div>

            {/* Quick actions toolbar */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-75">
              {confirming ? (
                <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5 shadow-sm">
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    aria-label="Cancel delete"
                    onClick={() => setConfirming(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 rounded-lg border bg-background/80 p-0.5">
                  <button
                    aria-label="Copy note text"
                    title="Copy note"
                    onClick={copyContent}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <button
                    aria-label="Edit entry"
                    title="Edit entry"
                    onClick={() => setEditing(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    aria-label={`Delete ${entry.title}`}
                    title="Delete entry"
                    onClick={() => setConfirming(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div
            className={`mt-3 overflow-hidden transition-all duration-200 ${
              expanded ? "max-h-[800px]" : "max-h-24"
            }`}
          >
            <p
              className={`whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted ${
                !expanded ? "line-clamp-3" : ""
              }`}
            >
              {entry.body}
            </p>
          </div>

          {/* Expand toggle */}
          {entry.body.length > 200 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="mt-2 text-xs font-semibold text-primary hover:underline transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* ── Edit mode ── */}
      {editing && (
        <div className="animate-scale-in">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Editing entry
            </span>
            <button
              onClick={cancelEdit}
              className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              placeholder="Title"
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
              placeholder="Your note..."
            />
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditTag(t)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
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

          <div className="mt-4 flex justify-end gap-2 border-t pt-3">
            <button
              onClick={cancelEdit}
              className="h-8 rounded-lg px-3 text-xs font-medium text-foreground-muted hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving || !editTitle.trim() || !editBody.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
