import { Info } from "lucide-react";
import type { PurchasingPowerHint as PurchasingPowerHintData } from "@/lib/finance/purchasing-power";
import { cn } from "@/lib/utils";

export function PurchasingPowerHint({
  hint,
  className,
}: {
  hint: PurchasingPowerHintData;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <span className="numeric-display font-normal">{hint.text}</span>
      <RateSourceInfo dateLabel={hint.rateDateLabel} />
    </span>
  );
}

export function PurchasingPowerSentence({
  sentence,
  rateDateLabel,
  className,
}: {
  sentence: string;
  rateDateLabel: string;
  className?: string;
}) {
  return (
    <p className={cn("inline-flex items-start gap-1 text-sm text-muted-foreground", className)}>
      <span>{sentence}</span>
      <RateSourceInfo dateLabel={rateDateLabel} />
    </p>
  );
}

function RateSourceInfo({ dateLabel }: { dateLabel: string }) {
  const copy = `بر اساس نرخ ${dateLabel}`;

  return (
    <details className="relative inline-flex shrink-0">
      <summary
        className="flex size-5 cursor-help list-none items-center justify-center rounded-full text-muted-foreground/70 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden"
        aria-label={copy}
      >
        <Info className="size-3.5" aria-hidden />
      </summary>
      <p
        role="tooltip"
        className="absolute end-0 top-full z-20 mt-1 w-max max-w-[16rem] rounded-xl border border-border bg-card px-3 py-2 text-xs leading-6 text-foreground shadow-md"
      >
        {copy}
      </p>
    </details>
  );
}
