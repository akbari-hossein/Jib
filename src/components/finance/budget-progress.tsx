import { UsageBar } from "@/components/usage-bar";
import { MoneyDisplay } from "@/components/money/money-display";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import type { BudgetStatus } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

function toneFor(status: BudgetStatus) {
  if (status === "over") return "expense" as const;
  if (status === "near") return "warning" as const;
  return "primary" as const;
}

export function BudgetProgress({
  name,
  spent,
  limit,
  pct,
  status,
  caption,
  className,
}: {
  name: string;
  spent: bigint;
  limit: bigint;
  pct: number;
  status: BudgetStatus;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{toPersianDigits(pct)}٪</p>
      </div>
      <p className="text-sm">
        <MoneyDisplay amount={spent} withUnit={false} className="font-semibold" />
        <span className="text-muted-foreground"> از {formatToman(limit)}</span>
      </p>
      <UsageBar pct={pct} tone={toneFor(status)} />
      {caption ? <p className="text-xs leading-6 text-muted-foreground">{caption}</p> : null}
    </div>
  );
}
