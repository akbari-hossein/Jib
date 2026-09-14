import { prisma } from "@/lib/db/prisma";
import { gregorianUtcFromJalali, getTehranJalaliDate } from "@/lib/dates/tehran";
import { calculateGoalProgress } from "@/lib/finance/goal-progress";

export async function listGoals(userId: string) {
  const today = gregorianUtcFromJalali(getTehranJalaliDate());
  const goals = await prisma.goal.findMany({
    where: { userId, isArchived: false },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });

  return goals.map((goal) => {
    const currentAmount = goal.account ? goal.account.balance : goal.currentAmount;
    return {
      id: goal.id,
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount,
      currentAmount,
      targetDate: goal.targetDate,
      accountId: goal.accountId,
      accountName: goal.account?.name ?? null,
      linked: goal.accountId != null,
      progress: calculateGoalProgress({
        currentAmount,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        today,
      }),
    };
  });
}

export type GoalListItem = Awaited<ReturnType<typeof listGoals>>[number];
