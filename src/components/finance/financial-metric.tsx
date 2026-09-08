import { MoneyDisplay } from "@/components/money/money-display";
import { cn } from "@/lib/utils";

export function FinancialMetric({
  label,
  amount,
  hint,
  empty,
  tone = "default",
  size = "md",
  heading = false,
  className,
}: {
  label: string;
  amount?: bigint | string;
  hint?: string;
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
            "numeric-display font-semibold tracking-tight text-foreground/25",
            size === "lg" ? "mt-3 text-4xl break-words" : "mt-2",
            size === "md" && "text-2xl",
            size === "sm" && "text-lg",
          )}
        >
          — — —
        </p>
      ) : (
        <p
          className={cn(
            "font-semibold tracking-tight",
            size === "lg" ? "mt-3 text-4xl break-words" : "mt-2",
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
      {hint ? <p className="mt-3 text-xs leading-6 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
