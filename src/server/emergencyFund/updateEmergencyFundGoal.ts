import { prisma } from "@/lib/db/prisma";
import { EMERGENCY_FUND_MAX_TARGET_MONTHS, assembleEmergencyFund } from "@/lib/finance/emergencyFund";
import {
  EMERGENCY_FUND_GOAL_NAME,
  getEmergencyFundData,
} from "@/server/emergencyFund/getEmergencyFundData";

export type UpdateEmergencyFundInput = {
  userId: string;
  targetMonths: number;
  essentialCategoryIds: string[];
  currentAmount: bigint;
  estimatedMonthlyEssential: bigint | null;
};

export class EmergencyFundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmergencyFundError";
  }
}

function assertTargetMonths(targetMonths: number) {
  if (
    !Number.isInteger(targetMonths) ||
    targetMonths < 1 ||
    targetMonths > EMERGENCY_FUND_MAX_TARGET_MONTHS
  ) {
    throw new EmergencyFundError("تعداد ماه پوشش را بین ۱ تا ۲۴ انتخاب کن.");
  }
}

export async function updateEmergencyFundGoal(input: UpdateEmergencyFundInput) {
  assertTargetMonths(input.targetMonths);
  if (input.essentialCategoryIds.length === 0) {
    throw new EmergencyFundError("حداقل یک دسته ضروری انتخاب کن.");
  }

  const uniqueIds = [...new Set(input.essentialCategoryIds)];
  const owned = await prisma.category.findMany({
    where: {
      userId: input.userId,
      id: { in: uniqueIds },
      kind: { in: ["EXPENSE", "BOTH"] },
    },
    select: { id: true },
  });
  if (owned.length !== uniqueIds.length) {
    throw new EmergencyFundError("یکی از دسته‌ها معتبر نیست.");
  }

  const existing = await prisma.goal.findFirst({
    where: { userId: input.userId, type: "EMERGENCY_FUND", isArchived: false },
    select: { id: true },
  });

  const data = await getEmergencyFundData(input.userId);
  const snapshot = assembleEmergencyFund({
    currentAmount: Number(input.currentAmount),
    targetMonths: input.targetMonths,
    essentialCategoryIds: uniqueIds,
    estimatedMonthlyEssential:
      input.estimatedMonthlyEssential == null ? null : Number(input.estimatedMonthlyEssential),
    categoryMonthTotals: data.categoryMonthTotals,
    windowMonths: data.windowMonths,
    monthlyFlows: data.monthlyFlows,
  });

  const record = {
    name: EMERGENCY_FUND_GOAL_NAME,
    type: "EMERGENCY_FUND" as const,
    targetMonths: input.targetMonths,
    essentialCategoryIds: uniqueIds,
    currentAmount: input.currentAmount,
    targetAmount: BigInt(snapshot.targetAmount),
    estimatedMonthlyEssential: snapshot.sufficientData ? null : input.estimatedMonthlyEssential,
    accountId: null,
    targetDate: null,
    isArchived: false,
  };

  if (existing) {
    return prisma.goal.update({
      where: { id: existing.id },
      data: record,
    });
  }

  return prisma.goal.create({
    data: {
      userId: input.userId,
      ...record,
    },
  });
}
