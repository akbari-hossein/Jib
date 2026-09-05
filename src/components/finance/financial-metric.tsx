import type { ReactNode } from "react";
import { MoneyDisplay } from "@/components/money/money-display";
import { cn } from "@/lib/utils";

export function FinancialMetric({
  label,
  amount,
  hint,
  secondary,
  empty,
  tone = "default",
  size = "md",
  heading = false,
  className,
}: {
  label: string;
  amount?: bigint | string;
  hint?: string;
  secondary?: ReactNode;
  empty?: boolean;
  tone?: "default" | "income" | "expense" | "savings";
  size?: "sm" | "md" | "lg";
  heading?: boolean;
  className?: string;
}) {
  const LabelTag = heading ? "h1" : "p";

  return (
    <div className={cn("flex flex-col", className)}>
      <LabelTag className="text-xs font-medium text-muted-foreground">{label}</LabelTag>
      {empty ? (
        <p
          className={cn(
            "numeric-display mt-2 font-semibold tracking-tight text-foreground/25",
            size === "lg" && "text-4xl",
            size === "md" && "text-2xl",
            size === "sm" && "text-lg",
          )}
        >
          — — —
        </p>
      ) : (
        <p
          className={cn(
            "mt-2 font-semibold tracking-tight",
            size === "lg" && "text-4xl",
            size === "md" && "text-2xl",
            size === "sm" && "text-lg",
            tone === "income" && "text-income",
            tone === "expense" && "text-expense",
            tone === "savings" && "text-savings",
          )}
        >
          <MoneyDisplay amount={amount ?? 0n} />
        </p>
      )}
      {secondary ? <div className="mt-2">{secondary}</div> : null}
      {hint ? <p className="mt-2 text-xs leading-6 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
