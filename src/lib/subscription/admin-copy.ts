import type { SubscriptionStatus } from "@prisma/client";
import type { AdminMetrics } from "@/lib/subscription/metrics";
import { JALALI_MONTHS } from "@/lib/labels";
import { toPersianDigits } from "@/lib/currency/format";

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: "دوره آزمایشی",
  PENDING_REVIEW: "در حال بررسی",
  ACTIVE: "فعال",
  EXPIRED: "نیاز به فعال‌سازی",
  REJECTED: "نیاز به ارسال دوباره",
};

export const ADMIN_METRICS_LABEL: Record<
  Exclude<keyof AdminMetrics, "revenueByMonth">,
  string
> = {
  activeSubscribers: "اشتراک فعال",
  trialingUsers: "در حال آزمایش رایگان",
  pendingReview: "در انتظار بررسی",
  expiredOrRejected: "منقضی / رد شده",
  mrr: "درآمد ماهانهٔ تخمینی (MRR)",
  totalRevenueToman: "مجموع درآمد",
  revenueThisMonthToman: "درآمد این ماه",
  newSubscribersThisMonth: "مشترک جدید این ماه",
};

export const ADMIN_USER_STATUS_FILTER_LABEL = {
  ALL: "همه",
  ...SUBSCRIPTION_STATUS_LABEL,
} as const;

export function formatJalaliMonthKey(key: string): string {
  const [yearRaw, monthRaw] = key.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const name = JALALI_MONTHS[month - 1] ?? key;
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return key;
  }
  return `${name} ${toPersianDigits(year)}`;
}
