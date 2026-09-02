"use client";

import { Clock3, Flame, TrendingUp } from "lucide-react";
import type { Entry } from "../lib/store";

type Props = {
  entries: Entry[];
  selectedDate: string;
  onPromptClick: (body: string) => void;
};

const PROMPTS = [
  { label: "One thing I finally understand…", body: "One thing I finally understand is " },
  { label: "Something I shipped today…", body: "Today I shipped: " },
  { label: "A thought I keep returning to…", body: "I keep thinking about " },
  { label: "What surprised me…", body: "Today I was surprised by " },
];

function calcStreak(entries: Entry[]): number {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map((e) => e.entry_date))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  for (const d of dates) {
    if (d === cursor) {
      streak++;
      const prev = new Date(`${cursor}T12:00:00`);
      prev.setDate(prev.getDate() - 1);
      cursor = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

function tagFreq(entries: Entry[]): Array<{ tag: string; count: number }> {
  const map: Record<string, number> = {};
  for (const e of entries) map[e.tag] = (map[e.tag] ?? 0) + 1;
  return Object.entries(map)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

const TAG_BG: Record<string, string> = {
  Learning: "tag-learning",
  "Build log": "tag-buildlog",
  Thought: "tag-thought",
  Life: "tag-life",
};

export function Sidebar({ entries, selectedDate, onPromptClick }: Props) {
  const streak = calcStreak(entries);
  const todayCount = entries.filter((e) => e.entry_date === selectedDate).length;
  const tags = tagFreq(entries);

  return (
    <aside className="space-y-4 lg:pt-2">
      {/* ── Rhythm card ── */}
      <div className="rounded-xl border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Your rhythm</p>
          <Clock3 size={16} className="text-primary" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/60 px-2 py-3">
            <p className="font-mono text-2xl font-bold tracking-tight">
              {entries.length}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Total
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 px-2 py-3">
            <p className="font-mono text-2xl font-bold tracking-tight text-primary">
              {streak}
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Flame size={10} className="text-primary" />
              Streak
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 px-2 py-3">
            <p className="font-mono text-2xl font-bold tracking-tight">
              {todayCount}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Today
            </p>
          </div>
        </div>

        {/* Progress bar — today vs all-time avg (scaled simply) */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>All-time archive</span>
            <span className="font-mono">{entries.length} notes</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${Math.min(100, (entries.length / 50) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            {entries.length === 0
              ? "The log is empty — every great archive starts here."
              : entries.length < 10
              ? "You're building the habit. Keep going."
              : entries.length < 30
              ? "A solid archive taking shape. Nice work."
              : "You're building something thoughtful. Keep going."}
          </p>
        </div>
      </div>

      {/* ── Tags card ── */}
      {tags.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Your themes</p>
            <TrendingUp size={16} className="text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            {tags.map(({ tag, count }) => (
              <div key={tag} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    TAG_BG[tag] ?? "tag-default"
                  }`}
                >
                  {tag}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                    style={{ width: `${(count / entries.length) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground w-4 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Daily prompt ── */}
      <div className="rounded-xl border bg-muted/40 p-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          A gentle prompt
        </p>
        <div className="mt-3 space-y-2.5">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => onPromptClick(p.body)}
              className="block w-full rounded-lg border bg-card px-3 py-2.5 text-left text-xs font-medium leading-relaxed
                         hover:border-primary/30 hover:text-primary transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="px-1 text-[11px] leading-5 text-muted-foreground">
        Private by default. Your notes are yours to revisit.
      </p>
    </aside>
  );
}
