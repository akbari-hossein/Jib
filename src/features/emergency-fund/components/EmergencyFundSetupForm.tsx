"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { MoneyInput } from "@/components/money/money-input";
import { MoneyDisplay } from "@/components/money/money-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EssentialCategoryPicker } from "@/features/emergency-fund/components/EssentialCategoryPicker";
import {
  EMERGENCY_FUND_COPY,
  averageBasisCopy,
  monthPresetLabel,
  recentAverageCopy,
} from "@/features/emergency-fund/copy";
import { useEmergencyFund } from "@/features/emergency-fund/hooks/useEmergencyFund";
import type { EmergencyFundPreset } from "@/features/emergency-fund/types";
import { formatToman, toLatinDigits, toPersianDigits } from "@/lib/currency/format";
import { EMERGENCY_FUND_TARGET_MONTH_PRESETS } from "@/lib/finance/emergencyFund";
import { cn } from "@/lib/utils";
import { saveEmergencyFund, type EmergencyFundActionState } from "@/server/actions/emergency-fund";
import type { EmergencyFundData } from "@/server/emergencyFund/getEmergencyFundData";

const initial: EmergencyFundActionState = { ok: false };

function toToman(amount: number): bigint {
  return BigInt(Math.max(0, Math.round(amount)));
}

function initialPreset(targetMonths: number | null): EmergencyFundPreset | 0 {
  if (targetMonths == null || targetMonths <= 0) {
    return 0;
  }
  if ((EMERGENCY_FUND_TARGET_MONTH_PRESETS as readonly number[]).includes(targetMonths)) {
    return targetMonths as 3 | 6 | 9;
  }
  return "custom";
}

export function EmergencyFundSetupForm({
  data,
  mode = "create",
  onSaved,
}: {
  data: EmergencyFundData;
  mode?: "create" | "edit";
  onSaved?: () => void;
}) {
  const [state, action, pending] = useActionState(saveEmergencyFund, initial);

  useEffect(() => {
    if (state.ok) {
      onSaved?.();
    }
  }, [onSaved, state.ok]);
  const [preset, setPreset] = useState<EmergencyFundPreset | 0>(initialPreset(data.goal?.targetMonths ?? null));
  const [customMonths, setCustomMonths] = useState(
    data.goal?.targetMonths && initialPreset(data.goal.targetMonths) === "custom"
      ? String(data.goal.targetMonths)
      : "",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(
    data.goal?.essentialCategoryIds.length
      ? data.goal.essentialCategoryIds
      : data.defaultEssentialCategoryIds,
  );
  const [currentAmount, setCurrentAmount] = useState(data.goal?.currentAmount ?? 0);
  const [estimated, setEstimated] = useState<number | null>(data.goal?.estimatedMonthlyEssential ?? null);

  const targetMonths = useMemo(() => {
    if (preset === "custom") {
      const value = Number(toLatinDigits(customMonths).trim());
      return Number.isInteger(value) ? value : 0;
    }
    return preset;
  }, [customMonths, preset]);

  const preview = useEmergencyFund({
    categoryMonthTotals: data.categoryMonthTotals,
    windowMonths: data.windowMonths,
    monthlyFlows: data.monthlyFlows,
    selectedCategoryIds: selectedIds,
    targetMonths,
    currentAmount,
    estimatedMonthlyEssential: estimated,
  });

  function toggleCategory(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  const averageLabel = formatToman(toToman(preview.average));

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="targetMonths" value={targetMonths > 0 ? String(targetMonths) : ""} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium mb-2">{EMERGENCY_FUND_COPY.targetLabel}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EMERGENCY_FUND_TARGET_MONTH_PRESETS.map((months) => (
            <button
              key={months}
              type="button"
              onClick={() => setPreset(months)}
              className={cn(
                "h-12 rounded-2xl border text-sm font-medium transition-colors",
                preset === months
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-surface-muted",
              )}
            >
              {monthPresetLabel(months)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={cn(
              "h-12 rounded-2xl border text-sm font-medium transition-colors",
              preset === "custom"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-surface-muted",
            )}
          >
            {EMERGENCY_FUND_COPY.customMonths}
          </button>
        </div>
        {preset === "custom" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="customMonths">{EMERGENCY_FUND_COPY.customMonthsLabel}</Label>
            <Input
              id="customMonths"
              inputMode="numeric"
              value={customMonths}
              onChange={(event) => setCustomMonths(event.target.value)}
            />
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">{EMERGENCY_FUND_COPY.categoryLabel}</p>
        <EssentialCategoryPicker
          categories={data.categories}
          selectedIds={selectedIds}
          onToggle={toggleCategory}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="emergency-current">{EMERGENCY_FUND_COPY.currentAmountLabel}</Label>
        <MoneyInput
          id="emergency-current"
          name="currentAmount"
          defaultValue={String(Math.round(data.goal?.currentAmount ?? 0))}
          allowZero
          onAmountChange={(amount) => setCurrentAmount(amount == null ? 0 : Number(amount))}
        />
      </div>

      {preview.sufficientData ? null : (
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface-muted/50 p-4">
          <p className="text-sm leading-7 text-muted-foreground">{EMERGENCY_FUND_COPY.insufficientDataShort}</p>
          <p className="text-xs leading-6 text-muted-foreground">{EMERGENCY_FUND_COPY.estimateHint}</p>
          <Label htmlFor="emergency-estimate">{EMERGENCY_FUND_COPY.estimateLabel}</Label>
          <MoneyInput
            id="emergency-estimate"
            name="estimatedMonthlyEssential"
            defaultValue={
              data.goal?.estimatedMonthlyEssential
                ? String(Math.round(data.goal.estimatedMonthlyEssential))
                : undefined
            }
            allowZero
            onAmountChange={(amount) => setEstimated(amount == null || amount <= 0n ? null : Number(amount))}
          />
          <p className="text-xs leading-6 text-muted-foreground">{EMERGENCY_FUND_COPY.waitForHistory}</p>
        </div>
      )}

      {targetMonths > 0 ? (
        <div className="rounded-3xl border border-border bg-card px-4 py-4">
          <p className="text-xs text-muted-foreground">{EMERGENCY_FUND_COPY.name}</p>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={toToman(preview.progress.currentAmount)} withUnit={false} className="font-semibold" />
            <span className="text-muted-foreground"> از {formatToman(toToman(preview.targetAmount))}</span>
          </p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {averageBasisCopy(averageLabel, preview.monthsUsed, preview.usingEstimate)}
            {preview.usingEstimate ? null : ` ${recentAverageCopy(preview.monthsUsed)}`}
          </p>
          {preview.usingEstimate ? (
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{EMERGENCY_FUND_COPY.estimateUsed}</p>
          ) : null}
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "در حال ذخیره…"
          : mode === "edit"
            ? EMERGENCY_FUND_COPY.saveChanges
            : EMERGENCY_FUND_COPY.save}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {toPersianDigits(selectedIds.length)} دسته انتخاب شده
      </p>
    </form>
  );
}
