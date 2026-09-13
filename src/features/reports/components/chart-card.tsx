import type { ReactNode } from "react";

export function ChartCard({
  title,
  summary,
  legend,
  children,
}: {
  title: string;
  summary: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {legend}
      </div>
      <p className="mt-2 text-sm leading-7 text-foreground/60">{summary}</p>
      {children}
    </section>
  );
}

export function ChartLegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-foreground/55">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
