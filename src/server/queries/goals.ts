import { prisma } from "@/lib/db/prisma";
import { gregorianUtcFromJalali, getTehranJalaliDate } from "@/lib/dates/tehran";
import { calculateAssetHoldingValue } from "@/lib/finance/assetHoldings";
import { calculateGoalProgress } from "@/lib/finance/goal-progress";
import { isReferenceAssetType } from "@/lib/finance/purchasing-power";
import { parseQuantityToScaled } from "@/lib/finance/quantity";
import { getLatestRates } from "@/lib/finance/referenceRates";

export async function listGoals(userId: string) {
  const today = gregorianUtcFromJalali(getTehranJalaliDate());
  const [goals, rates] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, isArchived: false },
      include: {
        account: true,
        fundings: { include: { account: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getLatestRates(),
  ]);

  return goals.map((goal) => {
    const fundedAccounts =
      goal.fundings.length > 0
        ? goal.fundings.map((funding) => funding.account)
        : goal.account
          ? [goal.account]
          : [];
    const usesLiveAssetRate = fundedAccounts.some((account) => account.type === "ASSET_HOLDING");
    let excludedUnpriced = 0;
    const currentAmount =
      fundedAccounts.length > 0
        ? fundedAccounts.reduce((sum, account) => {
            if (account.type === "ASSET_HOLDING" && account.assetType && isReferenceAssetType(account.assetType)) {
              const value = calculateAssetHoldingValue(
                parseQuantityToScaled(account.quantity.toString()) ?? 0n,
                rates.get(account.assetType)?.rate ?? null,
              );
              if (value == null && (parseQuantityToScaled(account.quantity.toString()) ?? 0n) > 0n) {
                excludedUnpriced += 1;
                return sum;
              }
              return sum + (value ?? 0n);
            }
            return sum + account.balance;
          }, 0n)
        : goal.currentAmount;

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount,
      targetDate: goal.targetDate,
      accountId: goal.accountId,
      accountName: fundedAccounts.map((account) => account.name).join("، ") || null,
      linked: fundedAccounts.length > 0,
      usesLiveAssetRate,
      figurePartial: excludedUnpriced > 0,
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
