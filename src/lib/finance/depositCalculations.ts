/**
 * Bank deposit interest: daily / monthly / yearly from principal and annual rate.
 * Monthly interest follows a 30-day month (daily × 30), matching bahesab.ir/calc/sood.
 */

export interface DepositCalculatorInput {
  depositAmount: number;
  annualRatePercent: number;
}

export interface DepositCalculatorResult {
  dailyInterest: number;
  monthlyInterest: number;
  yearlyInterest: number;
}

export function calculateDepositInterest(input: DepositCalculatorInput): DepositCalculatorResult {
  if (!Number.isFinite(input.depositAmount) || input.depositAmount <= 0) {
    throw new RangeError("depositAmount must be a positive finite number");
  }
  if (!Number.isFinite(input.annualRatePercent) || input.annualRatePercent < 0) {
    throw new RangeError("annualRatePercent must be a non-negative finite number");
  }

  const yearlyInterest = (input.depositAmount * input.annualRatePercent) / 100;
  const dailyInterest = yearlyInterest / 365;
  const monthlyInterest = dailyInterest * 30;

  return { dailyInterest, monthlyInterest, yearlyInterest };
}
