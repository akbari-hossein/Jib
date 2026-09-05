import { Prisma } from "@prisma/client";
import { fillTehranDailyCounts } from "@/lib/admin/chart-days";
import {
  addJalaliDays,
  getTehranJalaliDate,
  jalaliWeekStart,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";

export async function getAdminAnalytics(now = new Date()) {
  const today = getTehranJalaliDate(now);
  const todayStart = tehranMidnightUtc(today);
  const weekStart = tehranMidnightUtc(jalaliWeekStart(today));
  const monthStart = tehranMidnightUtc({ year: today.year, month: today.month, day: 1 });
  const thirtyDaysAgo = tehranMidnightUtc(addJalaliDays(today, -29));
  const activeSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    onboardedUsers,
    usersWithAccounts,
    usersWithTransactions,
    returningUsers,
    activeUsers,
    transactionCount,
    signupsByDay,
    usersThisWeek,
    usersThisMonth,
    usersToday,
    day1,
    day7,
    day30,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingCompletedAt: { not: null } } }),
    prisma.user.count({ where: { accounts: { some: {} } } }),
    prisma.user.count({ where: { transactions: { some: {} } } }),
    prisma.user.count({
      where: {
        lastActiveAt: { not: null },
        createdAt: { lt: weekStart },
      },
    }),
    prisma.user.count({
      where: { status: "ACTIVE", lastActiveAt: { gte: activeSince } },
    }),
    prisma.transaction.count({
      where: { occurredAt: { gte: thirtyDaysAgo } },
    }),
    prisma.$queryRaw<Array<{ day: string; count: number }>>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Tehran'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    retentionWindow(1, 8, now),
    retentionWindow(7, 14, now),
    retentionWindow(30, 37, now),
  ]);

  return {
    totalUsers,
    usersToday,
    usersThisWeek,
    usersThisMonth,
    onboardedUsers,
    usersWithAccounts,
    usersWithTransactions,
    returningUsers,
    activeUsers,
    transactionsPerActiveUser:
      activeUsers > 0 ? Math.round((transactionCount / activeUsers) * 10) / 10 : 0,
    signupsByDay: fillTehranDailyCounts(signupsByDay, thirtyDaysAgo, todayStart),
    retention: { day1, day7, day30 },
  };
}

export type AdminAnalytics = Awaited<ReturnType<typeof getAdminAnalytics>>;

async function retentionWindow(days: number, lookbackStart: number, now: Date) {
  const signupTo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const signupFrom = new Date(now.getTime() - lookbackStart * 24 * 60 * 60 * 1000);
  const interval = Prisma.raw(`'${Number(days)} days'::interval`);

  const rows = await prisma.$queryRaw<Array<{ cohort: number; retained: number }>>`
    SELECT
      COUNT(*)::int AS cohort,
      COUNT(*) FILTER (
        WHERE "lastActiveAt" IS NOT NULL
          AND "lastActiveAt" >= "createdAt" + ${interval}
      )::int AS retained
    FROM "User"
    WHERE "createdAt" >= ${signupFrom}
      AND "createdAt" < ${signupTo}
  `;

  const cohort = rows[0]?.cohort ?? 0;
  const retained = rows[0]?.retained ?? 0;
  return {
    days,
    cohort,
    retained,
    rate: cohort > 0 ? Math.round((retained / cohort) * 1000) / 10 : null,
  };
}
