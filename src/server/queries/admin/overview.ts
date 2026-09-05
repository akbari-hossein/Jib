import {
  addJalaliDays,
  addJalaliMonths,
  getTehranJalaliDate,
  jalaliWeekStart,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import { fillTehranDailyCounts } from "@/lib/admin/chart-days";
import { countTrend } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAdminOverview(now = new Date()) {
  const today = getTehranJalaliDate(now);
  const todayStart = tehranMidnightUtc(today);
  const yesterdayStart = tehranMidnightUtc(addJalaliDays(today, -1));
  const weekStart = tehranMidnightUtc(jalaliWeekStart(today));
  const previousWeekStart = tehranMidnightUtc(addJalaliDays(jalaliWeekStart(today), -7));
  const monthStart = tehranMidnightUtc({ year: today.year, month: today.month, day: 1 });
  const previousMonthStart = tehranMidnightUtc(
    addJalaliMonths({ year: today.year, month: today.month, day: 1 }, -1),
  );
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS);
  const previousActiveSince = new Date(now.getTime() - ACTIVE_WINDOW_MS * 2);
  const chartFrom = tehranMidnightUtc(addJalaliDays(today, -29));

  const [
    totalUsers,
    usersToday,
    usersYesterday,
    usersThisWeek,
    usersPrevWeek,
    usersThisMonth,
    usersPrevMonth,
    activeUsers,
    previouslyActiveUsers,
    onboardedUsers,
    usersWithAccounts,
    usersWithTransactions,
    totalTransactions,
    totalAccounts,
    totalGoals,
    totalBudgets,
    disabledUsers,
    signupsByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({
      where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({
      where: { createdAt: { gte: previousWeekStart, lt: weekStart } },
    }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({
      where: { createdAt: { gte: previousMonthStart, lt: monthStart } },
    }),
    prisma.user.count({
      where: { status: "ACTIVE", lastActiveAt: { gte: activeSince } },
    }),
    prisma.user.count({
      where: {
        status: "ACTIVE",
        lastActiveAt: { gte: previousActiveSince, lt: activeSince },
      },
    }),
    prisma.user.count({ where: { onboardingCompletedAt: { not: null } } }),
    prisma.user.count({ where: { accounts: { some: {} } } }),
    prisma.user.count({ where: { transactions: { some: {} } } }),
    prisma.transaction.count(),
    prisma.account.count(),
    prisma.goal.count(),
    prisma.budget.count(),
    prisma.user.count({ where: { status: "DISABLED" } }),
    prisma.$queryRaw<Array<{ day: string; count: number }>>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Tehran'), 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${chartFrom}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  return {
    totalUsers,
    usersToday,
    usersTodayTrend: countTrend(usersToday, usersYesterday),
    usersThisWeek,
    usersWeekTrend: countTrend(usersThisWeek, usersPrevWeek),
    usersThisMonth,
    usersMonthTrend: countTrend(usersThisMonth, usersPrevMonth),
    totalUsersTrend: countTrend(usersThisMonth, usersPrevMonth),
    activeUsers,
    activeUsersTrend: countTrend(activeUsers, previouslyActiveUsers),
    onboardedUsers,
    usersWithAccounts,
    usersWithTransactions,
    totalTransactions,
    totalAccounts,
    totalGoals,
    totalBudgets,
    disabledUsers,
    signupsByDay: fillTehranDailyCounts(signupsByDay, chartFrom, todayStart),
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;
