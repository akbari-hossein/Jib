import type { Plan } from "@prisma/client";
import {
  canCreate,
  featureCopy,
  hasFeature,
  limitCopy,
  type LimitedResource,
  type ProFeature,
} from "@/lib/billing/plan";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";

export class PlanLimitError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string) {
    super("PLAN_LIMIT");
    this.name = "PlanLimitError";
    this.userMessage = userMessage;
  }
}

async function countResource(userId: string, resource: LimitedResource): Promise<number> {
  if (resource === "accounts") {
    return prisma.account.count({ where: { userId, isActive: true } });
  }
  if (resource === "goals") {
    return prisma.goal.count({ where: { userId, isArchived: false } });
  }

  const today = getTehranJalaliDate();
  return prisma.budgetCategory.count({
    where: {
      budget: { userId, jalaliYear: today.year, jalaliMonth: today.month },
    },
  });
}

export async function assertCanCreate(
  userId: string,
  plan: Plan,
  resource: LimitedResource,
) {
  const count = await countResource(userId, resource);
  if (!canCreate(plan, resource, count)) {
    throw new PlanLimitError(limitCopy(resource));
  }
}

export function assertHasFeature(plan: Plan, feature: ProFeature) {
  if (!hasFeature(plan, feature)) {
    throw new PlanLimitError(featureCopy(feature));
  }
}
