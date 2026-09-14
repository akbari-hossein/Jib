import { Card, CardContent } from "@/components/ui/card";
import { FinancialMetric } from "@/components/finance/financial-metric";
import { CALCULATOR_COPY, depositInputSummary } from "@/features/calculators/copy";
import { roundToman } from "@/features/calculators/format";
import type { DepositCalculatorInput, DepositCalculatorResult } from "@/features/calculators/types";

export function DepositCalculatorResult({
  input,
  result,
}: {
  input: DepositCalculatorInput;
  result: DepositCalculatorResult;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-5">
        <p className="text-sm leading-7 text-muted-foreground">{depositInputSummary(input)}</p>
        <FinancialMetric
          label={CALCULATOR_COPY.dailyInterest}
          amount={roundToman(result.dailyInterest)}
          size="md"
        />
        <FinancialMetric
          label={CALCULATOR_COPY.monthlyInterest}
          amount={roundToman(result.monthlyInterest)}
          size="md"
        />
        <FinancialMetric
          label={CALCULATOR_COPY.yearlyInterest}
          amount={roundToman(result.yearlyInterest)}
          size="md"
        />
      </CardContent>
    </Card>
  );
}
