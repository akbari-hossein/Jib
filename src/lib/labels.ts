import type {
  AccountType,
  CategoryGroup,
  RecurringFrequency,
  TransactionType,
} from "@prisma/client";
import type { BudgetStatus } from "@/lib/finance/types";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CASH: "نقد",
  BANK: "حساب بانکی",
  CARD: "کارت",
  SAVINGS: "پس‌انداز",
  OTHER: "سایر",
};

export const CATEGORY_GROUP_LABEL: Record<CategoryGroup, string> = {
  ESSENTIAL: "ضروریات",
  LIVING: "زندگی",
  LIFESTYLE: "سبک زندگی",
  FINANCIAL: "مالی",
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  EXPENSE: "هزینه",
  INCOME: "درآمد",
  TRANSFER: "جابه‌جایی",
};

export const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  WEEKLY: "هفتگی",
  MONTHLY: "ماهانه",
  YEARLY: "سالانه",
};

export function budgetUsageCopy(name: string, pct: number, status: BudgetStatus): string {
  if (status === "over") {
    return `از سقف ${name} رد شدی. هنوز می‌تونی سقف را تنظیم کنی.`;
  }
  if (status === "near") {
    return `بودجه ${name} رو ${pct}٪ مصرف کردی.`;
  }
  return `${pct}٪ از سقف ${name}`;
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
