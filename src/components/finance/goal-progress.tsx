import { UsageBar } from "@/components/usage-bar";
import { MoneyDisplay } from "@/components/money/money-display";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { cn } from "@/lib/utils";

export function GoalProgress({
  name,
  currentAmount,
  targetAmount,
  pct,
  monthlyNeed,
  caption,
  className,
}: {
  name: string;
  currentAmount: bigint;
  targetAmount: bigint;
  pct: number;
  monthlyNeed?: bigint | null;
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
        <MoneyDisplay amount={currentAmount} withUnit={false} className="font-semibold" />
        <span className="text-muted-foreground"> از {formatToman(targetAmount)}</span>
      </p>
      <UsageBar pct={pct} tone={pct >= 100 ? "savings" : "primary"} />
      {caption ? (
        <p className="text-xs leading-6 text-muted-foreground">{caption}</p>
      ) : monthlyNeed != null ? (
        <p className="text-xs leading-6 text-muted-foreground">
          با ماهی حدود {formatCompactToman(monthlyNeed)}
        </p>
      ) : null}
    </div>
  );
}
