"use client";

import { WhyThisNumber } from "@/components/finance/why-this-number";
import { Card, CardContent } from "@/components/ui/card";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { LoanAmortizationTable } from "@/features/calculators/components/LoanAmortizationTable";
import { CALCULATOR_COPY, loanInputSummary } from "@/features/calculators/copy";
import { formatCalculatorToman, roundToman } from "@/features/calculators/format";
import type { LoanCalculatorInput, LoanCalculatorResult } from "@/features/calculators/types";

export function LoanCalculatorResult({
  input,
  result,
}: {
  input: LoanCalculatorInput;
  result: LoanCalculatorResult;
}) {
  const isQarz = input.mode === "qarzAlHasaneh";

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-5">
        <p className="text-sm leading-7 text-muted-foreground">{loanInputSummary(input)}</p>

        <FinancialMetric
          label={CALCULATOR_COPY.installmentAmount}
          amount={roundToman(result.installmentAmount)}
          size="lg"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FinancialMetric
            label={CALCULATOR_COPY.totalRepayment}
            amount={roundToman(result.totalRepayment)}
            size="sm"
          />
          <FinancialMetric
            label={isQarz ? CALCULATOR_COPY.totalFee : CALCULATOR_COPY.totalInterest}
            amount={roundToman(result.totalInterestOrFee)}
            size="sm"
          />
        </div>

        <WhyThisNumber label={CALCULATOR_COPY.scheduleDisclosure}>
          {isQarz ? (
            <p>
              {CALCULATOR_COPY.oneTimeFee}: {formatCalculatorToman(result.totalInterestOrFee)}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{CALCULATOR_COPY.scheduleUnitNote}</p>
          <LoanAmortizationTable schedule={result.schedule} />
        </WhyThisNumber>
      </CardContent>
    </Card>
  );
}
