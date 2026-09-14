import { toPersianDigits } from "@/lib/currency/format";
import type { DepositCalculatorInput } from "@/lib/finance/depositCalculations";
import type { LoanCalculatorInput } from "@/lib/finance/loanCalculations";
import { formatCalculatorToman, formatPercent } from "@/features/calculators/format";

export const CALCULATOR_COPY = {
  title: "محاسبه‌گر مالی",
  description: "اقساط وام و سود سپرده را با همان فرمول بانک حساب کن.",
  loanTab: "اقساط وام",
  depositTab: "سود سپرده",
  loanModeLabel: "نوع وام",
  standardMode: "معمولی (با سود)",
  qarzMode: "قرض‌الحسنه",
  principal: "مبلغ وام",
  depositAmount: "مبلغ سپرده",
  annualRate: "نرخ سود سالانه (٪)",
  installmentCount: "تعداد اقساط",
  installmentInterval: "فاصله زمانی اقساط (ماه)",
  feeRate: "نرخ کارمزد (٪)",
  loanTerm: "مدت وام (ماه)",
  submit: "محاسبه",
  installmentAmount: "مبلغ هر قسط",
  totalRepayment: "مجموع بازپرداخت",
  totalInterest: "مجموع سود پرداختی",
  totalFee: "مجموع کارمزد",
  oneTimeFee: "کارمزد یک‌باره",
  scheduleDisclosure: "مشاهده جدول اقساط",
  dailyInterest: "سود روزانه",
  monthlyInterest: "سود ماهانه",
  yearlyInterest: "سود سالانه",
  feeDisclaimer: "نرخ کارمزد توسط شما وارد می‌شود و ممکن است با نرخ بانک شما متفاوت باشد.",
  generalDisclaimer: "این محاسبات تخمینی هستند و ممکن است با اعلام رسمی بانک شما اندکی متفاوت باشند.",
  highRateNote: "نرخ واردشده بالاتر از نرخ‌های رایج بانکی است.",
  scheduleNumber: "شماره",
  schedulePayment: "قسط",
  scheduleInterest: "سود",
  schedulePrincipal: "اصل",
  scheduleBalance: "مانده",
  scheduleUnitNote: "مبالغ جدول به تومان است.",
  missingPrincipal: "مبلغ وام را وارد کن.",
  missingDeposit: "مبلغ سپرده را وارد کن.",
  missingAnnualRate: "نرخ سود سالانه را وارد کن.",
  missingFeeRate: "نرخ کارمزد را وارد کن.",
  missingInstallmentCount: "تعداد اقساط را وارد کن.",
  missingInterval: "فاصله زمانی اقساط را وارد کن.",
  missingTerm: "مدت وام را وارد کن.",
  invalidNumber: "این مقدار معتبر نیست.",
} as const;

export function loanInputSummary(input: LoanCalculatorInput): string {
  const amount = formatCalculatorToman(input.principal);
  const count = toPersianDigits(input.installmentCount);

  if (input.mode === "qarzAlHasaneh") {
    const fee = formatPercent(input.feeRatePercent ?? 0);
    const term = toPersianDigits(input.loanTermMonths ?? 0);
    return `بر اساس مبلغ ${amount} با نرخ کارمزد ${fee} در مدت ${term} ماه و ${count} قسط`;
  }

  const rate = formatPercent(input.annualRatePercent ?? 0);
  if (input.installmentIntervalMonths === 1) {
    return `بر اساس مبلغ ${amount} با نرخ سود ${rate} در ${count} قسط`;
  }

  const interval = toPersianDigits(input.installmentIntervalMonths);
  return `بر اساس مبلغ ${amount} با نرخ سود ${rate}، ${count} قسط هر ${interval} ماه`;
}

export function depositInputSummary(input: DepositCalculatorInput): string {
  return `بر اساس مبلغ ${formatCalculatorToman(input.depositAmount)} با نرخ سود سالانه ${formatPercent(input.annualRatePercent)}`;
}
