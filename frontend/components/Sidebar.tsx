"use client";

import { Clock3, Flame, TrendingUp, Sparkles, Command } from "lucide-react";
import type { Entry } from "../lib/store";
import { Calendar } from "./Calendar";

type Props = {
  entries: Entry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPromptClick: (body: string) => void;
};

const PROMPTS = [
  { label: "Architecture decision made…", body: "Today's architecture decision: " },
  { label: "Bug solved & root cause…", body: "Resolved issue with: \nRoot cause was: " },
  { label: "Something I shipped…", body: "Shipped today: " },
  { label: "Core insight / lesson learned…", body: "Key takeaway: " },
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

// Past 7 days consistency indicators
function getPast7Days(entries: Entry[]) {
  const entryDateSet = new Set(entries.map((e) => e.entry_date));
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(d);
    days.push({
      iso,
      dayName,
      hasEntry: entryDateSet.has(iso),
      isToday: i === 0,
    });
  }
  return days;
}

export function Sidebar({ entries, selectedDate, onSelectDate, onPromptClick }: Props) {
  const streak = calcStreak(entries);
  const todayCount = entries.filter((e) => e.entry_date === selectedDate).length;
  const tags = tagFreq(entries);
  const past7Days = getPast7Days(entries);

  return (
    <aside className="space-y-4">
      {/* ── Metric & Rhythm Card ── */}
      <div className="rounded-xl border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <Clock3 size={14} className="text-primary" />
            <span>Activity Overview</span>
          </div>
          {streak > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
              <Flame size={12} />
              {streak}d streak
            </span>
          )}
        </div>

        {/* Custom Calendar */}
        <div className="mb-3 rounded-lg border bg-background/70 p-2">
          <Calendar
            selectedDate={selectedDate}
            entries={entries}
            onSelectDate={onSelectDate}
          />
        </div>

        {/* 3 Stats in a clean grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-background/70 p-2.5 text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-foreground">
              {entries.length}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">
              Total
            </p>
          </div>

          <div className="rounded-lg border bg-background/70 p-2.5 text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-primary">
              {streak}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">
              Streak
            </p>
          </div>

          <div className="rounded-lg border bg-background/70 p-2.5 text-center">
            <p className="font-mono text-xl font-bold tracking-tight text-foreground">
              {todayCount}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-subtle">
              Selected
            </p>
          </div>
        </div>

        {/* 7-Day Consistency Strip */}
        <div className="mt-4 border-t pt-3">
          <div className="mb-2 flex items-center justify-between text-[11px] text-foreground-muted">
            <span>7-day consistency</span>
            <span className="font-mono text-[10px]">
              {past7Days.filter((d) => d.hasEntry).length}/7 days
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5">
            {past7Days.map((d) => (
              <div key={d.iso} className="flex flex-col items-center gap-1 flex-1">
                <div
                  title={`${d.iso}: ${d.hasEntry ? "Logged" : "No entries"}`}
                  className={`h-6 w-full rounded-md transition-colors ${
                    d.hasEntry
                      ? "bg-primary"
                      : "bg-muted/70 border border-border"
                  } ${d.isToday ? "ring-2 ring-foreground/20" : ""}`}
                />
                <span className="font-mono text-[10px] text-foreground-subtle">
                  {d.dayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Themes / Tags distribution ── */}
      {tags.length > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              <TrendingUp size={14} className="text-foreground-muted" />
              <span>Themes</span>
            </div>
            <span className="font-mono text-xs text-foreground-subtle">
              {entries.length} notes
            </span>
          </div>

          <div className="space-y-2.5">
            {tags.map(({ tag, count }) => {
              const pct = Math.round((count / entries.length) * 100);
              return (
                <div key={tag} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        TAG_BG[tag] ?? "tag-default"
                      }`}
                    >
                      {tag}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-foreground-subtle">
                      <span>{count}</span>
                      <span>({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Guided Prompts Card ── */}
      <div className="rounded-xl border bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          <Sparkles size={13} className="text-primary" />
          <span>Quick Starters</span>
        </div>
        <p className="mb-3 text-xs text-foreground-subtle">
          Click any prompt to instantly draft a note:
        </p>
        <div className="space-y-1.5">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => onPromptClick(p.body)}
              className="group flex w-full items-center justify-between rounded-lg border bg-background/60 px-2.5 py-2 text-left text-xs font-medium text-foreground-muted hover:border-primary/40 hover:bg-card hover:text-foreground transition-colors"
            >
              <span className="truncate">{p.label}</span>
              <span className="ml-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                +
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Keyboard Shortcuts Quick Reference ── */}
      <div className="rounded-xl border bg-muted/30 p-3 text-xs text-foreground-muted">
        <div className="mb-2 flex items-center gap-1.5 font-semibold text-foreground">
          <Command size={13} />
          <span>Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span>New note</span>
            <kbd>N</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Search</span>
            <kbd>/</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Prev day</span>
            <kbd>J</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span>Next day</span>
            <kbd>K</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}
