import Link from "next/link";
import { UsageBar } from "@/components/usage-bar";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/money/money-display";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { EMERGENCY_FUND_COPY } from "@/features/emergency-fund/copy";

export function EmergencyFundCard({
  currentAmount,
  targetAmount,
  progressPercent,
}: {
  currentAmount: number;
  targetAmount: number;
  progressPercent: number;
}) {
  const current = BigInt(Math.max(0, Math.round(currentAmount)));
  const target = BigInt(Math.max(0, Math.round(targetAmount)));

  return (
    <Link
      href="/goals/emergency-fund"
      className="block rounded-3xl border border-border bg-card px-4 py-4 transition-colors hover:bg-surface-muted"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">{EMERGENCY_FUND_COPY.name}</p>
        <p className="text-xs text-muted-foreground">{toPersianDigits(progressPercent)}٪</p>
      </div>
      <p className="mt-3 text-sm">
        <MoneyDisplay amount={current} withUnit={false} className="font-semibold" />
        <span className="text-muted-foreground"> / {formatToman(target)}</span>
      </p>
      <div className="mt-2">
        <UsageBar pct={progressPercent} tone={progressPercent >= 100 ? "savings" : "primary"} />
      </div>
    </Link>
  );
}

export function EmergencyFundSetupCard() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-border bg-card px-5 py-5">
      <h2 className="font-medium">{EMERGENCY_FUND_COPY.name}</h2>
      <p className="text-sm leading-7 text-muted-foreground">{EMERGENCY_FUND_COPY.setupIntro}</p>
      <Button asChild>
        <Link href="/goals/emergency-fund">{EMERGENCY_FUND_COPY.setupCta}</Link>
      </Button>
    </section>
  );
}
