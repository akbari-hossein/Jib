import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-3 rounded-3xl border border-border bg-surface px-5 py-6",
        className,
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm leading-7 text-foreground/65">{description}</p>
      {action}
    </section>
  );
}
