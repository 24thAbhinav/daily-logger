"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from "lucide-react";

type Props = {
  selectedDate: string;
  entryCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelectDate?: (date: string) => void;
};

function formatDisplay(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const dayRelative =
    iso === today
      ? "Today"
      : iso === yesterday
      ? "Yesterday"
      : new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return { dayRelative, formattedDate, isToday: iso === today };
}

export function DateNav({
  selectedDate,
  entryCount,
  onPrev,
  onNext,
  onToday,
  onSelectDate,
}: Props) {
  const { dayRelative, formattedDate, isToday } = formatDisplay(selectedDate);
  const datePickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Date Navigation & Picker */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
          <button
            aria-label="Previous day (J or Left Arrow)"
            title="Previous day (J)"
            onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-card hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          <button
            aria-label="Jump to Today (T)"
            title="Jump to Today (T)"
            onClick={onToday}
            className={`px-2.5 h-8 text-xs font-semibold rounded-md transition-colors ${
              isToday
                ? "bg-card text-foreground shadow-soft"
                : "text-foreground-muted hover:bg-card hover:text-foreground"
            }`}
          >
            Today
          </button>

          <button
            aria-label="Next day (K or Right Arrow)"
            title="Next day (K)"
            onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-card hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Calendar Picker Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => datePickerRef.current?.showPicker?.()}
            className="flex h-9 items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 text-xs font-medium text-foreground-muted hover:bg-card hover:text-foreground transition-colors"
            title="Pick a date"
          >
            <Calendar size={14} className="text-foreground-muted" />
            <span className="hidden xs:inline">Jump</span>
          </button>
          <input
            ref={datePickerRef}
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value && onSelectDate) {
                onSelectDate(e.target.value);
              }
            }}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* Date Display */}
        <div className="flex items-baseline gap-2 pl-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {dayRelative}
          </span>
          <span className="text-xs text-foreground-muted">{formattedDate}</span>
        </div>
      </div>

      {/* Right side stats badge & quick actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2 border-t pt-2 sm:border-t-0 sm:pt-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs font-medium text-foreground-muted">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </span>

          {!isToday && (
            <button
              onClick={onToday}
              className="flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw size={12} className="text-foreground-muted" />
              <span>Back to Today</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
