"use client";

type Props = {
  selectedDate: string;
  entryCount: number;
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

  return { dayRelative, formattedDate };
}

export function DateNav({ selectedDate, entryCount }: Props) {
  const { dayRelative, formattedDate } = formatDisplay(selectedDate);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Date Display */}
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {dayRelative}
        </span>
        <span className="text-xs text-foreground-muted">{formattedDate}</span>
      </div>

      {/* Entry Count */}
      <div className="flex items-center gap-2 border-t pt-2 sm:border-t-0 sm:pt-0">
        <span className="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs font-medium text-foreground-muted">
          {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
      </div>
    </div>
  );
}
