import { LogoMark } from "@/components/brand/logo";
import { APP_NAME } from "@/lib/config/app";
import { toPersianDigits } from "@/lib/currency/format";
import { HEALTH_SCORE_COPY, scoreDeltaCopy, shareHighlightCopy } from "@/lib/finance/financial-health-copy";
import type { ScoreTrend } from "@/lib/finance/financial-health-copy";
import type { ScoreComponentKey } from "@/lib/finance/financial-health-score";
import { cn } from "@/lib/utils";

const PALETTE = {
  bg: "#F5F2EA",
  fg: "#1C2430",
  muted: "rgba(28, 36, 48, 0.5)",
  faint: "rgba(28, 36, 48, 0.28)",
  savings: "#5A4E86",
} as const;

export type ScoreShareCardModel = {
  totalScore: number;
  trend: ScoreTrend;
  scoreDelta: number | null;
  driverKey: ScoreComponentKey | null;
  driverRawValue?: number;
  driverPreviousValue?: number;
};

export function ScoreShareCard({
  model,
  variant,
  includeHighlight,
  className,
}: {
  model: ScoreShareCardModel;
  variant: "story" | "square";
  includeHighlight: boolean;
  className?: string;
}) {
  const story = variant === "story";
  const highlight =
    includeHighlight && model.driverKey
      ? shareHighlightCopy({
          driverKey: model.driverKey,
          rawValue: model.driverRawValue,
          previousValue: model.driverPreviousValue,
        })
      : null;

  return (
    <div
      dir="rtl"
      className={cn("flex h-full w-full flex-col font-sans", className)}
      style={{
        background: PALETTE.bg,
        color: PALETTE.fg,
        padding: story ? "11% 12%" : "9% 10%",
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-medium" style={{ color: PALETTE.faint }}>
          <LogoMark className="h-3 w-auto" />
          {APP_NAME}
        </p>
        <p className="text-[0.7rem]" style={{ color: PALETTE.faint }}>
          {HEALTH_SCORE_COPY.title}
        </p>
      </header>

      <div className={cn("flex flex-col", story ? "mt-16" : "mt-10")}>
        <p className="text-[0.8rem]" style={{ color: PALETTE.muted }}>
          {HEALTH_SCORE_COPY.title}
        </p>
        <p
          className={cn(
            "numeric-display mt-4 font-semibold tracking-tight",
            story ? "text-[5.4rem] leading-none" : "text-[4.2rem] leading-none",
          )}
          style={{ color: PALETTE.savings }}
        >
          {toPersianDigits(model.totalScore)}
        </p>
        <p className="mt-5 text-[0.9rem]" style={{ color: PALETTE.muted }}>
          {scoreDeltaCopy(model.scoreDelta, model.trend)}
        </p>
        {highlight ? (
          <p className="mt-3 text-[0.85rem] leading-7" style={{ color: PALETTE.fg }}>
            {highlight}
          </p>
        ) : null}
      </div>

      <footer className="mt-auto flex items-center gap-1.5 pt-10">
        <LogoMark className="h-3.5 w-auto" />
        <p className="text-[0.75rem] font-medium" style={{ color: PALETTE.faint }}>
          {APP_NAME}
        </p>
      </footer>
    </div>
  );
}
