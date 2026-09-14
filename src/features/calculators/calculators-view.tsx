"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CalculatorTypeTabs } from "@/features/calculators/components/CalculatorTypeTabs";
import { DepositCalculatorForm } from "@/features/calculators/components/DepositCalculatorForm";
import { DepositCalculatorResult } from "@/features/calculators/components/DepositCalculatorResult";
import { LoanCalculatorForm } from "@/features/calculators/components/LoanCalculatorForm";
import { LoanCalculatorResult } from "@/features/calculators/components/LoanCalculatorResult";
import { CALCULATOR_COPY } from "@/features/calculators/copy";
import { useDepositCalculator } from "@/features/calculators/hooks/useDepositCalculator";
import { useLoanCalculator } from "@/features/calculators/hooks/useLoanCalculator";
import type { CalculatorKind } from "@/features/calculators/types";

export function CalculatorsView() {
  const [kind, setKind] = useState<CalculatorKind>("loan");
  const loan = useLoanCalculator();
  const deposit = useDepositCalculator();

  return (
    <main className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <PageHeader title={CALCULATOR_COPY.title} description={CALCULATOR_COPY.description} />
      <CalculatorTypeTabs value={kind} onChange={setKind} />

      {kind === "loan" ? (
        <div
          role="tabpanel"
          id="calculator-panel-loan"
          aria-labelledby="calculator-tab-loan"
          className="flex flex-col gap-5"
        >
          <Card>
            <CardContent className="py-5">
              <LoanCalculatorForm calculator={loan} />
            </CardContent>
          </Card>
          {loan.snapshot ? (
            <div aria-live="polite">
              <LoanCalculatorResult input={loan.snapshot.input} result={loan.snapshot.result} />
            </div>
          ) : null}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="calculator-panel-deposit"
          aria-labelledby="calculator-tab-deposit"
          className="flex flex-col gap-5"
        >
          <Card>
            <CardContent className="py-5">
              <DepositCalculatorForm calculator={deposit} />
            </CardContent>
          </Card>
          {deposit.snapshot ? (
            <div aria-live="polite">
              <DepositCalculatorResult
                input={deposit.snapshot.input}
                result={deposit.snapshot.result}
              />
            </div>
          ) : null}
        </div>
      )}

      <p className="text-xs leading-6 text-muted-foreground">{CALCULATOR_COPY.generalDisclaimer}</p>
    </main>
  );
}
