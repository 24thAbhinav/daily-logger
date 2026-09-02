"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedDate: string;
  entryCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

function formatDisplay(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const label =
    iso === today
      ? "Today"
      : iso === yesterday
      ? "Yesterday"
      : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);

  const full = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(date);

  return { label, full };
}

export function DateNav({
  selectedDate,
  entryCount,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const { label, full } = formatDisplay(selectedDate);

  return (
    <div className="flex flex-col gap-3 border-y py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Date selector */}
      <div className="flex items-center gap-1">
        <button
          aria-label="Previous day"
          onClick={onPrev}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className="min-w-[180px] text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-base font-bold tracking-[-0.02em]">
              {label}
            </span>
            <span className="text-sm text-muted-foreground">{full}</span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {entryCount === 0
              ? "no notes yet"
              : `${entryCount} ${entryCount === 1 ? "note" : "notes"} logged`}
          </p>
        </div>

        <button
          aria-label="Next day"
          onClick={onNext}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={onToday}
            className="h-8 rounded-lg border bg-background px-3 text-xs font-semibold
                       hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          >
            Jump to today
          </button>
        )}
      </div>
    </div>
  );
}
