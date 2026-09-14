/**
 * Iranian bank loan math: equal installments (روش فرانسوی) and
 * qarz al-hasaneh (flat fee, no compounding).
 *
 * Pure functions only — a later prompt can feed `installmentAmount` into
 * Recurring Transactions without changing this module.
 */

export type LoanCalculationMode = "standard" | "qarzAlHasaneh";

export interface LoanCalculatorInput {
  mode: LoanCalculationMode;
  principal: number;
  annualRatePercent?: number;
  feeRatePercent?: number;
  installmentCount: number;
  installmentIntervalMonths: number;
  loanTermMonths?: number;
}

export interface AmortizationRow {
  installmentNumber: number;
  paymentAmount: number;
  interestPortion: number;
  principalPortion: number;
  remainingBalance: number;
}

export interface LoanCalculatorResult {
  installmentAmount: number;
  totalRepayment: number;
  totalInterestOrFee: number;
  schedule: AmortizationRow[];
}

const ZERO_RATE_EPSILON = 1e-12;

function assertFinitePositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

function assertFiniteNonNegative(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number`);
  }
}

export function periodicRateFromAnnual(
  annualRatePercent: number,
  installmentIntervalMonths: number,
): number {
  return (annualRatePercent * (installmentIntervalMonths / 12)) / 100;
}

export function calculateEqualInstallmentAmount(
  principal: number,
  periodicRate: number,
  installmentCount: number,
): number {
  if (Math.abs(periodicRate) < ZERO_RATE_EPSILON) {
    return principal / installmentCount;
  }
  const growth = (1 + periodicRate) ** installmentCount;
  return (principal * periodicRate * growth) / (growth - 1);
}

function buildStandardSchedule(
  principal: number,
  installmentAmount: number,
  installmentCount: number,
  periodicRate: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let remaining = principal;

  for (let installmentNumber = 1; installmentNumber <= installmentCount; installmentNumber += 1) {
    const isLast = installmentNumber === installmentCount;
    const interestPortion = remaining * periodicRate;
    const principalPortion = isLast ? remaining : installmentAmount - interestPortion;
    const paymentAmount = isLast ? principalPortion + interestPortion : installmentAmount;
    remaining = isLast ? 0 : remaining - principalPortion;

    rows.push({
      installmentNumber,
      paymentAmount,
      interestPortion,
      principalPortion,
      remainingBalance: remaining,
    });
  }

  return rows;
}

function buildQarzAlHasanehSchedule(
  totalRepayment: number,
  installmentAmount: number,
  installmentCount: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let remaining = totalRepayment;

  for (let installmentNumber = 1; installmentNumber <= installmentCount; installmentNumber += 1) {
    const isLast = installmentNumber === installmentCount;
    const principalPortion = isLast ? remaining : installmentAmount;
    remaining = isLast ? 0 : remaining - principalPortion;

    rows.push({
      installmentNumber,
      paymentAmount: principalPortion,
      interestPortion: 0,
      principalPortion,
      remainingBalance: remaining,
    });
  }

  return rows;
}

export function calculateStandardLoan(input: {
  principal: number;
  annualRatePercent: number;
  installmentCount: number;
  installmentIntervalMonths: number;
}): LoanCalculatorResult {
  assertFinitePositive("principal", input.principal);
  assertFiniteNonNegative("annualRatePercent", input.annualRatePercent);
  assertFinitePositive("installmentCount", input.installmentCount);
  assertFinitePositive("installmentIntervalMonths", input.installmentIntervalMonths);

  if (!Number.isInteger(input.installmentCount)) {
    throw new RangeError("installmentCount must be an integer");
  }

  const periodicRate = periodicRateFromAnnual(
    input.annualRatePercent,
    input.installmentIntervalMonths,
  );
  const installmentAmount = calculateEqualInstallmentAmount(
    input.principal,
    periodicRate,
    input.installmentCount,
  );
  const totalRepayment = installmentAmount * input.installmentCount;
  const totalInterestOrFee = totalRepayment - input.principal;

  return {
    installmentAmount,
    totalRepayment,
    totalInterestOrFee,
    schedule: buildStandardSchedule(
      input.principal,
      installmentAmount,
      input.installmentCount,
      periodicRate,
    ),
  };
}

export function calculateQarzAlHasanehLoan(input: {
  principal: number;
  feeRatePercent: number;
  installmentCount: number;
  loanTermMonths: number;
}): LoanCalculatorResult {
  assertFinitePositive("principal", input.principal);
  assertFiniteNonNegative("feeRatePercent", input.feeRatePercent);
  assertFinitePositive("installmentCount", input.installmentCount);
  assertFinitePositive("loanTermMonths", input.loanTermMonths);

  if (!Number.isInteger(input.installmentCount)) {
    throw new RangeError("installmentCount must be an integer");
  }

  const feeAmount = input.principal * (input.feeRatePercent / 100) * (input.loanTermMonths / 12);
  const totalRepayment = input.principal + feeAmount;
  const installmentAmount = totalRepayment / input.installmentCount;

  return {
    installmentAmount,
    totalRepayment,
    totalInterestOrFee: feeAmount,
    schedule: buildQarzAlHasanehSchedule(
      totalRepayment,
      installmentAmount,
      input.installmentCount,
    ),
  };
}

export function calculateLoan(input: LoanCalculatorInput): LoanCalculatorResult {
  if (input.mode === "qarzAlHasaneh") {
    if (input.feeRatePercent == null || input.loanTermMonths == null) {
      throw new RangeError("qarz al-hasaneh requires feeRatePercent and loanTermMonths");
    }
    return calculateQarzAlHasanehLoan({
      principal: input.principal,
      feeRatePercent: input.feeRatePercent,
      installmentCount: input.installmentCount,
      loanTermMonths: input.loanTermMonths,
    });
  }

  if (input.annualRatePercent == null) {
    throw new RangeError("standard loan requires annualRatePercent");
  }

  return calculateStandardLoan({
    principal: input.principal,
    annualRatePercent: input.annualRatePercent,
    installmentCount: input.installmentCount,
    installmentIntervalMonths: input.installmentIntervalMonths,
  });
}
