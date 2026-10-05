import { prisma } from "@/lib/db/prisma";
import { WriteAccessBlockedError } from "@/lib/subscription/access";
import { SUBSCRIPTION_COPY } from "@/lib/subscription/copy";

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

export async function assertCalendarEventOwned(userId: string, eventId: string) {
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, userId },
  });
  if (!event) {
    throw new OwnershipError();
  }
  return event;
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

export async function assertContactOwned(userId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
  });
  if (!contact) {
    throw new OwnershipError();
  }
  return contact;
}

export async function assertDebtRecordOwned(userId: string, debtRecordId: string) {
  const debt = await prisma.debtRecord.findFirst({
    where: { id: debtRecordId, userId },
  });
  if (!debt) {
    throw new OwnershipError();
  }
  return debt;
}

export async function assertSplitBillOwned(userId: string, splitBillId: string) {
  const split = await prisma.splitBill.findFirst({
    where: { id: splitBillId, userId },
  });
  if (!split) {
    throw new OwnershipError();
  }
  return split;
}

export function userFacingMutationError(error: unknown, fallback: string): string {
  if (error instanceof OwnershipError) {
    return "این مورد در دسترس نیست.";
  }
  if (error instanceof WriteAccessBlockedError) {
    return SUBSCRIPTION_COPY.readOnly;
  }
  return fallback;
}
