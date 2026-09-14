import { z } from "zod";
import type {
  DepositCalculatorInput,
  DepositCalculatorResult,
} from "@/lib/finance/depositCalculations";
import type {
  AmortizationRow,
  LoanCalculationMode,
  LoanCalculatorInput,
  LoanCalculatorResult,
} from "@/lib/finance/loanCalculations";

export type {
  AmortizationRow,
  DepositCalculatorInput,
  DepositCalculatorResult,
  LoanCalculationMode,
  LoanCalculatorInput,
  LoanCalculatorResult,
};

export type CalculatorKind = "loan" | "deposit";

export const HIGH_RATE_WARNING_THRESHOLD = 60;
export const MAX_INSTALLMENT_COUNT = 360;
export const MAX_LOAN_TERM_MONTHS = 360;
export const MAX_INSTALLMENT_INTERVAL_MONTHS = 12;
export const DEFAULT_FEE_RATE_PERCENT = 4;
export const DEFAULT_INSTALLMENT_INTERVAL_MONTHS = 1;

const principalSchema = z
  .number({ error: "مبلغ باید یک عدد باشد." })
  .finite("مبلغ معتبر نیست.")
  .positive("مبلغ باید بیشتر از صفر باشد.");

const rateSchema = z
  .number({ error: "نرخ باید یک عدد باشد." })
  .finite("نرخ معتبر نیست.")
  .min(0, "نرخ نمی‌تواند منفی باشد.")
  .max(100, "نرخ نمی‌تواند بیشتر از ۱۰۰٪ باشد.");

const installmentCountSchema = z
  .number({ error: "تعداد اقساط را وارد کن." })
  .finite("تعداد اقساط معتبر نیست.")
  .int("تعداد اقساط باید عدد صحیح باشد.")
  .positive("تعداد اقساط باید بیشتر از صفر باشد.")
  .max(MAX_INSTALLMENT_COUNT, "تعداد اقساط حداکثر ۳۶۰ است.");

const installmentIntervalSchema = z
  .number({ error: "فاصله زمانی اقساط را وارد کن." })
  .finite("فاصله زمانی اقساط معتبر نیست.")
  .int("فاصله زمانی اقساط باید عدد صحیح باشد.")
  .positive("فاصله زمانی اقساط باید بیشتر از صفر باشد.")
  .max(MAX_INSTALLMENT_INTERVAL_MONTHS, "فاصله زمانی اقساط حداکثر ۱۲ ماه است.");

const loanTermMonthsSchema = z
  .number({ error: "مدت وام را وارد کن." })
  .finite("مدت وام معتبر نیست.")
  .int("مدت وام باید عدد صحیح باشد.")
  .positive("مدت وام باید بیشتر از صفر باشد.")
  .max(MAX_LOAN_TERM_MONTHS, "مدت وام حداکثر ۳۶۰ ماه است.");

export const loanCalculatorInputSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("standard"),
    principal: principalSchema,
    annualRatePercent: rateSchema,
    installmentCount: installmentCountSchema,
    installmentIntervalMonths: installmentIntervalSchema,
  }),
  z.object({
    mode: z.literal("qarzAlHasaneh"),
    principal: principalSchema,
    feeRatePercent: rateSchema,
    installmentCount: installmentCountSchema,
    installmentIntervalMonths: installmentIntervalSchema,
    loanTermMonths: loanTermMonthsSchema,
  }),
]);

export const depositCalculatorInputSchema = z.object({
  depositAmount: principalSchema,
  annualRatePercent: rateSchema,
});

export type LoanFormErrors = Partial<{
  principal: string;
  annualRatePercent: string;
  feeRatePercent: string;
  installmentCount: string;
  installmentIntervalMonths: string;
  loanTermMonths: string;
  form: string;
}>;

export type DepositFormErrors = Partial<{
  depositAmount: string;
  annualRatePercent: string;
  form: string;
}>;

export function firstIssueMessage(error: z.ZodError, path: string): string | undefined {
  return error.issues.find((issue) => issue.path[0] === path)?.message;
}

export function loanErrorsFromZod(error: z.ZodError): LoanFormErrors {
  return {
    principal: firstIssueMessage(error, "principal"),
    annualRatePercent: firstIssueMessage(error, "annualRatePercent"),
    feeRatePercent: firstIssueMessage(error, "feeRatePercent"),
    installmentCount: firstIssueMessage(error, "installmentCount"),
    installmentIntervalMonths: firstIssueMessage(error, "installmentIntervalMonths"),
    loanTermMonths: firstIssueMessage(error, "loanTermMonths"),
  };
}

export function depositErrorsFromZod(error: z.ZodError): DepositFormErrors {
  return {
    depositAmount: firstIssueMessage(error, "depositAmount"),
    annualRatePercent: firstIssueMessage(error, "annualRatePercent"),
  };
}

export type ParsedLoanInput = z.infer<typeof loanCalculatorInputSchema>;
export type ParsedDepositInput = z.infer<typeof depositCalculatorInputSchema>;
