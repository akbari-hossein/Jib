import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
  dataTour,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  dataTour?: string;
}) {
  return (
    <header data-tour={dataTour} className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
