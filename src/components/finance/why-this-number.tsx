import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WhyThisNumber({
  children,
  className,
  label = "چرا این عدد؟",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <details className={cn(className)}>
      <summary className="cursor-pointer list-none text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <div className="mt-3 space-y-2 text-sm text-foreground/70">{children}</div>
    </details>
  );
}

export function FormulaRow({
  label,
  value,
  prefix = "",
}: {
  label: string;
  value: string;
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="numeric-display">
        {prefix}
        {value}
      </dd>
    </div>
  );
}
