import { cn } from "@/lib/utils";

export function UsageBar({
  pct,
  tone = "primary",
}: {
  pct: number;
  tone?: "primary" | "warning" | "expense" | "savings";
}) {
  const width = Math.min(100, Math.max(0, pct));

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
      <div
        className={cn(
          "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out",
          tone === "warning" && "bg-warning",
          tone === "expense" && "bg-expense",
          tone === "savings" && "bg-savings",
          tone === "primary" && "bg-primary",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
