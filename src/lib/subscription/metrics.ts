import {
  addJalaliMonths,
  getTehranJalaliDate,
  jalaliFromInstant,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";

export type AdminMetrics = {
  activeSubscribers: number;
  trialingUsers: number;
  pendingReview: number;
  expiredOrRejected: number;
  mrr: number;
  totalRevenueToman: number;
  revenueThisMonthToman: number;
  newSubscribersThisMonth: number;
  revenueByMonth: Array<{ jalaliMonth: string; totalToman: number }>;
};

export type ApprovedReceiptSnapshot = {
  amountToman: number | null;
  reviewedAt: Date | null;
};

export function snapshotApprovalAmount(subscriptionPriceToman: number): number {
  return subscriptionPriceToman;
}

export function jalaliMonthKey(date: Date): string {
  const { year, month } = jalaliFromInstant(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function lastSixJalaliMonthKeys(now: Date): string[] {
  const today = getTehranJalaliDate(now);
  const keys: string[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const month = addJalaliMonths({ year: today.year, month: today.month, day: 1 }, -offset);
    keys.push(`${month.year}-${String(month.month).padStart(2, "0")}`);
  }
  return keys;
}

export function currentJalaliMonthRange(now: Date): { start: Date; end: Date } {
  const today = getTehranJalaliDate(now);
  const start = tehranMidnightUtc({ year: today.year, month: today.month, day: 1 });
  const end = tehranMidnightUtc(addJalaliMonths({ year: today.year, month: today.month, day: 1 }, 1));
  return { start, end };
}

export function sixMonthLookbackStart(now: Date): Date {
  const today = getTehranJalaliDate(now);
  return tehranMidnightUtc(addJalaliMonths({ year: today.year, month: today.month, day: 1 }, -5));
}

export function sumApprovedRevenue(receipts: Array<{ amountToman: number | null }>): number {
  return receipts.reduce((sum, receipt) => sum + (receipt.amountToman ?? 0), 0);
}

export function bucketRevenueByJalaliMonth(
  receipts: ApprovedReceiptSnapshot[],
  monthKeys: string[],
): Array<{ jalaliMonth: string; totalToman: number }> {
  const totals = new Map(monthKeys.map((key) => [key, 0]));
  for (const receipt of receipts) {
    if (!receipt.reviewedAt) {
      continue;
    }
    const key = jalaliMonthKey(receipt.reviewedAt);
    if (!totals.has(key)) {
      continue;
    }
    totals.set(key, (totals.get(key) ?? 0) + (receipt.amountToman ?? 0));
  }
  return monthKeys.map((jalaliMonth) => ({
    jalaliMonth,
    totalToman: totals.get(jalaliMonth) ?? 0,
  }));
}

export function computeMrr(activeSubscribers: number, currentPriceToman: number): number {
  return activeSubscribers * currentPriceToman;
}

export function assembleAdminMetrics(input: {
  activeSubscribers: number;
  trialingUsers: number;
  pendingReview: number;
  expiredOrRejected: number;
  currentPriceToman: number;
  totalRevenueToman: number;
  revenueThisMonthToman: number;
  newSubscribersThisMonth: number;
  revenueByMonth: Array<{ jalaliMonth: string; totalToman: number }>;
}): AdminMetrics {
  return {
    activeSubscribers: input.activeSubscribers,
    trialingUsers: input.trialingUsers,
    pendingReview: input.pendingReview,
    expiredOrRejected: input.expiredOrRejected,
    mrr: computeMrr(input.activeSubscribers, input.currentPriceToman),
    totalRevenueToman: input.totalRevenueToman,
    revenueThisMonthToman: input.revenueThisMonthToman,
    newSubscribersThisMonth: input.newSubscribersThisMonth,
    revenueByMonth: input.revenueByMonth,
  };
}
