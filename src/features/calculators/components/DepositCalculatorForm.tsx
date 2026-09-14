"use client";

import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CALCULATOR_COPY } from "@/features/calculators/copy";
import type { useDepositCalculator } from "@/features/calculators/hooks/useDepositCalculator";
import { cn } from "@/lib/utils";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function DepositCalculatorForm({
  calculator,
}: {
  calculator: ReturnType<typeof useDepositCalculator>;
}) {
  const { values, errors, rateWarning, submit } = calculator;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="deposit-amount">{CALCULATOR_COPY.depositAmount}</Label>
        <MoneyInput
          id="deposit-amount"
          invalid={Boolean(errors.depositAmount)}
          onAmountChange={calculator.setDepositAmount}
        />
        <FieldError message={errors.depositAmount} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="deposit-annual-rate">{CALCULATOR_COPY.annualRate}</Label>
        <Input
          id="deposit-annual-rate"
          inputMode="decimal"
          dir="ltr"
          autoComplete="off"
          className={cn("numeric-display", errors.annualRatePercent && "border-destructive")}
          value={values.annualRatePercent}
          aria-invalid={Boolean(errors.annualRatePercent)}
          onChange={(event) => calculator.setAnnualRatePercent(event.target.value)}
        />
        <FieldError message={errors.annualRatePercent} />
        {rateWarning ? (
          <p className="text-xs leading-6 text-muted-foreground">{rateWarning}</p>
        ) : null}
      </div>

      <Button type="submit" className="w-full">
        {CALCULATOR_COPY.submit}
      </Button>
    </form>
  );
}
