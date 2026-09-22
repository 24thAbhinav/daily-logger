"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Entry } from "../lib/store";

type Props = {
  selectedDate: string;
  entries: Entry[];
  onSelectDate: (date: string) => void;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localISO(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function todayISO() {
  const d = new Date();
  return localISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function Calendar({ selectedDate, entries, onSelectDate }: Props) {
  const [selYear, selMonth] = selectedDate.split("-").map(Number);
  const [viewYear, setViewYear] = useState(selYear);
  const [viewMonth, setViewMonth] = useState(selMonth);

  useEffect(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m);
  }, [selectedDate]);

  const entryDates = useMemo(
    () => new Set(entries.map((e) => e.entry_date)),
    [entries],
  );

  const today = todayISO();

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: localISO(viewYear, viewMonth, d), day: d });
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear, viewMonth - 1, 1));

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          <button
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] font-medium text-foreground-subtle">
            {w}
          </span>
        ))}

        {cells.map((c, i) => {
          if (!c) return <span key={`empty-${i}`} />;

          const hasEntry = entryDates.has(c.iso);
          const isToday = c.iso === today;
          const isSelected = c.iso === selectedDate;
          const isFuture = c.iso > today;

          return (
            <button
              key={c.iso}
              onClick={() => onSelectDate(c.iso)}
              aria-label={c.iso}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "text-primary ring-1 ring-primary/40 hover:bg-muted"
                    : "text-foreground-muted hover:bg-muted hover:text-foreground"
              } ${isFuture ? "opacity-40" : ""}`}
            >
              {c.day}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
