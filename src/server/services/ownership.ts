import { prisma } from "@/lib/db/prisma";

export class OwnershipError extends Error {
  constructor() {
    super("NOT_OWNED");
    this.name = "OwnershipError";
  }
}

export async function assertAccountOwned(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) {
    throw new OwnershipError();
  }
  return account;
}

export async function assertCategoryOwned(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!category) {
    throw new OwnershipError();
  }
  return category;
}

export async function assertTransactionOwned(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!transaction) {
    throw new OwnershipError();
  }
  return transaction;
}

export async function assertRuleOwned(userId: string, ruleId: string) {
  const rule = await prisma.transactionRule.findFirst({
    where: { id: ruleId, userId },
  });
  if (!rule) {
    throw new OwnershipError();
  }
  return rule;
}

export async function assertGoalOwned(userId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
  });
  if (!goal) {
    throw new OwnershipError();
  }
  return goal;
}

export async function assertFinancialTaskOwned(userId: string, taskId: string) {
  const task = await prisma.financialTask.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) {
    throw new OwnershipError();
  }
  return task;
}

export async function assertRecurringOwned(userId: string, recurringId: string) {
  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id: recurringId, userId },
  });
  if (!recurring) {
    throw new OwnershipError();
  }
  return recurring;
}

export async function assertBudgetCategoryOwned(userId: string, budgetCategoryId: string) {
  const item = await prisma.budgetCategory.findFirst({
    where: { id: budgetCategoryId, budget: { userId } },
  });
  if (!item) {
    throw new OwnershipError();
  }
  return item;
}

export function userFacingMutationError(error: unknown, fallback: string): string {
  if (error instanceof OwnershipError) {
    return "این مورد در دسترس نیست.";
  }
  return fallback;
}
