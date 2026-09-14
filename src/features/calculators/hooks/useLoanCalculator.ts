"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CALCULATOR_COPY } from "@/features/calculators/copy";
import { parseDecimalInput, parseIntegerInput } from "@/features/calculators/parse";
import {
  DEFAULT_FEE_RATE_PERCENT,
  DEFAULT_INSTALLMENT_INTERVAL_MONTHS,
  HIGH_RATE_WARNING_THRESHOLD,
  loanCalculatorInputSchema,
  loanErrorsFromZod,
  type LoanCalculationMode,
  type LoanCalculatorInput,
  type LoanCalculatorResult,
  type LoanFormErrors,
} from "@/features/calculators/types";
import { calculateLoan } from "@/lib/finance/loanCalculations";

export type LoanFormValues = {
  mode: LoanCalculationMode;
  principal: bigint | null;
  annualRatePercent: string;
  feeRatePercent: string;
  installmentCount: string;
  installmentIntervalMonths: string;
  loanTermMonths: string;
};

const emptyErrors: LoanFormErrors = {};

function missingMessage(field: keyof LoanFormErrors): string {
  switch (field) {
    case "principal":
      return CALCULATOR_COPY.missingPrincipal;
    case "annualRatePercent":
      return CALCULATOR_COPY.missingAnnualRate;
    case "feeRatePercent":
      return CALCULATOR_COPY.missingFeeRate;
    case "installmentCount":
      return CALCULATOR_COPY.missingInstallmentCount;
    case "installmentIntervalMonths":
      return CALCULATOR_COPY.missingInterval;
    case "loanTermMonths":
      return CALCULATOR_COPY.missingTerm;
    default:
      return CALCULATOR_COPY.invalidNumber;
  }
}

function parseLoanValues(values: LoanFormValues): {
  input?: LoanCalculatorInput;
  errors: LoanFormErrors;
  rateWarning: string | null;
} {
  const errors: LoanFormErrors = {};

  if (values.principal == null) {
    errors.principal = missingMessage("principal");
  }

  const installmentCount = parseIntegerInput(values.installmentCount);
  if (values.installmentCount.trim() === "") {
    errors.installmentCount = missingMessage("installmentCount");
  } else if (installmentCount == null) {
    errors.installmentCount = CALCULATOR_COPY.invalidNumber;
  }

  const installmentIntervalMonths = parseIntegerInput(values.installmentIntervalMonths);
  if (values.installmentIntervalMonths.trim() === "") {
    errors.installmentIntervalMonths = missingMessage("installmentIntervalMonths");
  } else if (installmentIntervalMonths == null) {
    errors.installmentIntervalMonths = CALCULATOR_COPY.invalidNumber;
  }

  if (values.mode === "standard") {
    const annualRatePercent = parseDecimalInput(values.annualRatePercent);
    if (values.annualRatePercent.trim() === "") {
      errors.annualRatePercent = missingMessage("annualRatePercent");
    } else if (annualRatePercent == null) {
      errors.annualRatePercent = CALCULATOR_COPY.invalidNumber;
    }

    if (Object.keys(errors).length > 0 || values.principal == null) {
      return { errors, rateWarning: null };
    }

    const parsed = loanCalculatorInputSchema.safeParse({
      mode: "standard",
      principal: Number(values.principal),
      annualRatePercent,
      installmentCount,
      installmentIntervalMonths,
    });

    if (!parsed.success) {
      return { errors: loanErrorsFromZod(parsed.error), rateWarning: null };
    }

    const rateWarning =
      parsed.data.mode === "standard" &&
      parsed.data.annualRatePercent > HIGH_RATE_WARNING_THRESHOLD
        ? CALCULATOR_COPY.highRateNote
        : null;

    return { input: parsed.data, errors: emptyErrors, rateWarning };
  }

  const feeRatePercent = parseDecimalInput(values.feeRatePercent);
  if (values.feeRatePercent.trim() === "") {
    errors.feeRatePercent = missingMessage("feeRatePercent");
  } else if (feeRatePercent == null) {
    errors.feeRatePercent = CALCULATOR_COPY.invalidNumber;
  }

  const loanTermMonths = parseIntegerInput(values.loanTermMonths);
  if (values.loanTermMonths.trim() === "") {
    errors.loanTermMonths = missingMessage("loanTermMonths");
  } else if (loanTermMonths == null) {
    errors.loanTermMonths = CALCULATOR_COPY.invalidNumber;
  }

  if (Object.keys(errors).length > 0 || values.principal == null) {
    return { errors, rateWarning: null };
  }

  const parsed = loanCalculatorInputSchema.safeParse({
    mode: "qarzAlHasaneh",
    principal: Number(values.principal),
    feeRatePercent,
    installmentCount,
    installmentIntervalMonths,
    loanTermMonths,
  });

  if (!parsed.success) {
    return { errors: loanErrorsFromZod(parsed.error), rateWarning: null };
  }

  return { input: parsed.data, errors: emptyErrors, rateWarning: null };
}

export function useLoanCalculator() {
  const [mode, setMode] = useState<LoanCalculationMode>("standard");
  const [principal, setPrincipal] = useState<bigint | null>(null);
  const [annualRatePercent, setAnnualRatePercent] = useState("");
  const [feeRatePercent, setFeeRatePercent] = useState(String(DEFAULT_FEE_RATE_PERCENT));
  const [installmentCount, setInstallmentCount] = useState("");
  const [installmentIntervalMonths, setInstallmentIntervalMonths] = useState(
    String(DEFAULT_INSTALLMENT_INTERVAL_MONTHS),
  );
  const [loanTermMonths, setLoanTermMonths] = useState("");
  const [termTouched, setTermTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<LoanFormErrors>(emptyErrors);
  const [rateWarning, setRateWarning] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<{
    input: LoanCalculatorInput;
    result: LoanCalculatorResult;
  } | null>(null);

  const values: LoanFormValues = useMemo(
    () => ({
      mode,
      principal,
      annualRatePercent,
      feeRatePercent,
      installmentCount,
      installmentIntervalMonths,
      loanTermMonths,
    }),
    [
      annualRatePercent,
      feeRatePercent,
      installmentCount,
      installmentIntervalMonths,
      loanTermMonths,
      mode,
      principal,
    ],
  );

  function applyMode(next: LoanCalculationMode) {
    setMode(next);
    if (next === "qarzAlHasaneh" && !termTouched) {
      const count = parseIntegerInput(installmentCount);
      const interval = parseIntegerInput(installmentIntervalMonths);
      if (count != null && interval != null && count > 0 && interval > 0) {
        setLoanTermMonths(String(count * interval));
      }
    }
  }

  function applyInstallmentCount(next: string) {
    setInstallmentCount(next);
    if (mode === "qarzAlHasaneh" && !termTouched) {
      const count = parseIntegerInput(next);
      const interval = parseIntegerInput(installmentIntervalMonths);
      if (count != null && interval != null && count > 0 && interval > 0) {
        setLoanTermMonths(String(count * interval));
      }
    }
  }

  function applyInterval(next: string) {
    setInstallmentIntervalMonths(next);
    if (mode === "qarzAlHasaneh" && !termTouched) {
      const count = parseIntegerInput(installmentCount);
      const interval = parseIntegerInput(next);
      if (count != null && interval != null && count > 0 && interval > 0) {
        setLoanTermMonths(String(count * interval));
      }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const parsed = parseLoanValues(values);
    setErrors(parsed.errors);
    setRateWarning(parsed.rateWarning);

    if (!parsed.input) {
      setSnapshot(null);
      return;
    }

    setSnapshot({
      input: parsed.input,
      result: calculateLoan(parsed.input),
    });
  }

  return {
    values,
    setPrincipal,
    setAnnualRatePercent,
    setFeeRatePercent,
    setLoanTermMonths: (next: string) => {
      setTermTouched(true);
      setLoanTermMonths(next);
    },
    applyMode,
    applyInstallmentCount,
    applyInterval,
    submitted,
    errors: submitted ? errors : emptyErrors,
    rateWarning: submitted ? rateWarning : null,
    snapshot,
    submit,
  };
}
