"use client";

import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { CALCULATOR_COPY } from "@/features/calculators/copy";
import type { useLoanCalculator } from "@/features/calculators/hooks/useLoanCalculator";
import { toPersianDigits } from "@/lib/currency/format";
import { cn } from "@/lib/utils";

const INTERVAL_OPTIONS = [1, 2, 3, 6, 12] as const;

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

export function LoanCalculatorForm({
  calculator,
}: {
  calculator: ReturnType<typeof useLoanCalculator>;
}) {
  const { values, errors, rateWarning, submit } = calculator;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-2">{CALCULATOR_COPY.loanModeLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["standard", CALCULATOR_COPY.standardMode],
              ["qarzAlHasaneh", CALCULATOR_COPY.qarzMode],
            ] as const
          ).map(([mode, label]) => (
            <label
              key={mode}
              className={cn(
                "cursor-pointer rounded-full bg-surface-muted px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              )}
            >
              <input
                type="radio"
                name="loanMode"
                value={mode}
                checked={values.mode === mode}
                onChange={() => calculator.applyMode(mode)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="loan-principal">{CALCULATOR_COPY.principal}</Label>
        <MoneyInput
          id="loan-principal"
          invalid={Boolean(errors.principal)}
          onAmountChange={calculator.setPrincipal}
        />
        <FieldError message={errors.principal} />
      </div>

      {values.mode === "standard" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="loan-annual-rate">{CALCULATOR_COPY.annualRate}</Label>
          <Input
            id="loan-annual-rate"
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
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="loan-fee-rate">{CALCULATOR_COPY.feeRate}</Label>
          <Input
            id="loan-fee-rate"
            inputMode="decimal"
            dir="ltr"
            autoComplete="off"
            className={cn("numeric-display", errors.feeRatePercent && "border-destructive")}
            value={values.feeRatePercent}
            aria-invalid={Boolean(errors.feeRatePercent)}
            onChange={(event) => calculator.setFeeRatePercent(event.target.value)}
          />
          <p className="text-xs leading-6 text-muted-foreground">{CALCULATOR_COPY.feeDisclaimer}</p>
          <FieldError message={errors.feeRatePercent} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="loan-installment-count">{CALCULATOR_COPY.installmentCount}</Label>
        <Input
          id="loan-installment-count"
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
            className={cn("numeric-display", errors.installmentCount && "border-destructive")}
            value={values.installmentCount}
            aria-invalid={Boolean(errors.installmentCount)}
          onChange={(event) => calculator.applyInstallmentCount(event.target.value)}
        />
        <FieldError message={errors.installmentCount} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="loan-interval">{CALCULATOR_COPY.installmentInterval}</Label>
        <NativeSelect
          id="loan-interval"
          value={values.installmentIntervalMonths}
          aria-invalid={Boolean(errors.installmentIntervalMonths)}
          onChange={(event) => calculator.applyInterval(event.target.value)}
        >
          {INTERVAL_OPTIONS.map((months) => (
            <option key={months} value={months}>
              {toPersianDigits(months)}
            </option>
          ))}
        </NativeSelect>
        <FieldError message={errors.installmentIntervalMonths} />
      </div>

      {values.mode === "qarzAlHasaneh" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="loan-term">{CALCULATOR_COPY.loanTerm}</Label>
          <Input
            id="loan-term"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            className={cn("numeric-display", errors.loanTermMonths && "border-destructive")}
            value={values.loanTermMonths}
            aria-invalid={Boolean(errors.loanTermMonths)}
            onChange={(event) => calculator.setLoanTermMonths(event.target.value)}
          />
          <FieldError message={errors.loanTermMonths} />
        </div>
      ) : null}

      <Button type="submit" className="w-full">
        {CALCULATOR_COPY.submit}
      </Button>
    </form>
  );
}
