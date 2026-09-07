import type {
  AccountType,
  CategoryGroup,
  RecurringFrequency,
  TransactionType,
} from "@prisma/client";
import { toPersianDigits } from "@/lib/currency/format";
import type { MonthlyChange } from "@/lib/finance/monthly-change";
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

export const CHECK_IN_MOOD_LABEL = {
  GOOD: "خوب",
  NEUTRAL: "معمولی",
  STRESSED: "پراسترس",
} as const;

export function periodChangeCopy(
  change: MonthlyChange,
  unit: "month" | "week",
): string {
  const previous = unit === "week" ? "هفته قبل" : "ماه قبل";
  if (change.direction === "new") {
    return unit === "week" ? "هفته اولته." : "ماه اولته.";
  }
  if (change.direction === "flat") {
    return `مثل ${previous}.`;
  }
  if (change.pct == null) {
    return "";
  }
  if (change.direction === "up") {
    return `${toPersianDigits(change.pct)}٪ بیشتر از ${previous}`;
  }
  return `${toPersianDigits(change.pct)}٪ کمتر از ${previous}`;
}

export function budgetUsageCopy(name: string, pct: number, status: BudgetStatus): string {
  if (status === "over") {
    return `از سقف ${name} رد شدی. هنوز می‌تونی سقف رو تنظیم کنی.`;
  }
  if (status === "near") {
    return `بودجه ${name} رو ${pct}٪ مصرف کردی.`;
  }
  return `${pct}٪ از سقف ${name}`;
}

export const RECAP_FIELD_LABEL = {
  income: "درآمد",
  expenses: "هزینه",
  saved: "پس‌انداز",
  savingsRate: "نرخ پس‌انداز",
  topCategory: "بزرگ‌ترین دسته",
  vsPreviousMonth: "مقایسه با ماه قبل",
  goalProgress: "پیشرفت هدف",
  daysLogged: "روزهای ثبت",
  budgetsUnder: "بودجه زیر سقف",
} as const;

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
