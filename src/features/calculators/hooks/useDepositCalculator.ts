"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CALCULATOR_COPY } from "@/features/calculators/copy";
import { parseDecimalInput } from "@/features/calculators/parse";
import {
  HIGH_RATE_WARNING_THRESHOLD,
  depositCalculatorInputSchema,
  depositErrorsFromZod,
  type DepositCalculatorInput,
  type DepositCalculatorResult,
  type DepositFormErrors,
} from "@/features/calculators/types";
import { calculateDepositInterest } from "@/lib/finance/depositCalculations";

const emptyErrors: DepositFormErrors = {};

export function useDepositCalculator() {
  const [depositAmount, setDepositAmount] = useState<bigint | null>(null);
  const [annualRatePercent, setAnnualRatePercent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<DepositFormErrors>(emptyErrors);
  const [rateWarning, setRateWarning] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<{
    input: DepositCalculatorInput;
    result: DepositCalculatorResult;
  } | null>(null);

  const values = useMemo(
    () => ({ depositAmount, annualRatePercent }),
    [annualRatePercent, depositAmount],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors: DepositFormErrors = {};
    if (depositAmount == null) {
      nextErrors.depositAmount = CALCULATOR_COPY.missingDeposit;
    }

    const rate = parseDecimalInput(annualRatePercent);
    if (annualRatePercent.trim() === "") {
      nextErrors.annualRatePercent = CALCULATOR_COPY.missingAnnualRate;
    } else if (rate == null) {
      nextErrors.annualRatePercent = CALCULATOR_COPY.invalidNumber;
    }

    if (Object.keys(nextErrors).length > 0 || depositAmount == null) {
      setErrors(nextErrors);
      setRateWarning(null);
      setSnapshot(null);
      return;
    }

    const parsed = depositCalculatorInputSchema.safeParse({
      depositAmount: Number(depositAmount),
      annualRatePercent: rate,
    });

    if (!parsed.success) {
      setErrors(depositErrorsFromZod(parsed.error));
      setRateWarning(null);
      setSnapshot(null);
      return;
    }

    setErrors(emptyErrors);
    setRateWarning(
      parsed.data.annualRatePercent > HIGH_RATE_WARNING_THRESHOLD
        ? CALCULATOR_COPY.highRateNote
        : null,
    );
    setSnapshot({
      input: parsed.data,
      result: calculateDepositInterest(parsed.data),
    });
  }

  return {
    values,
    setDepositAmount,
    setAnnualRatePercent,
    submitted,
    errors: submitted ? errors : emptyErrors,
    rateWarning: submitted ? rateWarning : null,
    snapshot,
    submit,
  };
}
