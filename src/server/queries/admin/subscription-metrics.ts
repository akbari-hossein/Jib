import { prisma } from "@/lib/db/prisma";
import { getSubscriptionPriceToman } from "@/lib/subscription/config";
import {
  assembleAdminMetrics,
  bucketRevenueByJalaliMonth,
  currentJalaliMonthRange,
  lastSixJalaliMonthKeys,
  sixMonthLookbackStart,
  type AdminMetrics,
} from "@/lib/subscription/metrics";

export async function getAdminSubscriptionMetrics(now = new Date()): Promise<AdminMetrics> {
  const month = currentJalaliMonthRange(now);
  const lookbackStart = sixMonthLookbackStart(now);
  const monthKeys = lastSixJalaliMonthKeys(now);
  const currentPriceToman = getSubscriptionPriceToman();

  const [
    activeSubscribers,
    trialingUsers,
    pendingReview,
    expiredCount,
    rejectedCount,
    totalRevenue,
    monthRevenue,
    newSubscribersThisMonth,
    monthReceipts,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.paymentReceipt.count({ where: { status: "PENDING" } }),
    prisma.subscription.count({ where: { status: "EXPIRED" } }),
    prisma.subscription.count({ where: { status: "REJECTED" } }),
    prisma.paymentReceipt.aggregate({
      where: { status: "APPROVED" },
      _sum: { amountToman: true },
    }),
    prisma.paymentReceipt.aggregate({
      where: {
        status: "APPROVED",
        reviewedAt: { gte: month.start, lt: month.end },
      },
      _sum: { amountToman: true },
    }),
    prisma.paymentReceipt.count({
      where: {
        status: "APPROVED",
        reviewedAt: { gte: month.start, lt: month.end },
      },
    }),
    prisma.paymentReceipt.findMany({
      where: {
        status: "APPROVED",
        reviewedAt: { gte: lookbackStart },
      },
      select: { amountToman: true, reviewedAt: true },
    }),
  ]);

  return assembleAdminMetrics({
    activeSubscribers,
    trialingUsers,
    pendingReview,
    expiredOrRejected: expiredCount + rejectedCount,
    currentPriceToman,
    totalRevenueToman: totalRevenue._sum.amountToman ?? 0,
    revenueThisMonthToman: monthRevenue._sum.amountToman ?? 0,
    newSubscribersThisMonth,
    revenueByMonth: bucketRevenueByJalaliMonth(monthReceipts, monthKeys),
  });
}
