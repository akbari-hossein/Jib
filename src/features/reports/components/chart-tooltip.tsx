import { formatChartPercent, formatChartScore, formatChartTomanFull } from "@/features/reports/components/chart-theme";

type TooltipRow = {
  name: string;
  value: number;
  color: string;
};

export function ChartTooltip({
  active,
  label,
  rows,
  kind = "money",
}: {
  active?: boolean;
  label?: string;
  rows: TooltipRow[];
  kind?: "money" | "percent" | "score";
}) {
  if (!active || rows.length === 0) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-border bg-card px-3 py-2 text-xs leading-6 shadow-xs"
    >
      {label ? <p className="text-foreground/55">{label}</p> : null}
      {rows.map((row) => (
        <p key={row.name} className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-foreground/70">
            <span className="size-1.5 rounded-full" style={{ background: row.color }} />
            {row.name}
          </span>
          <span className="numeric-display text-foreground">
            {kind === "percent"
              ? formatChartPercent(row.value)
              : kind === "score"
                ? formatChartScore(row.value)
                : formatChartTomanFull(row.value)}
          </span>
        </p>
      ))}
    </div>
  );
}
