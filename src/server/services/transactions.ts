import type { Prisma, TransactionType } from "@prisma/client";

type CreateInput = {
  userId: string;
  type: TransactionType;
  amount: bigint;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  merchant?: string | null;
  note?: string | null;
  occurredAt: Date;
  recurringTransactionId?: string | null;
};

export async function persistTransaction(
  db: Prisma.TransactionClient,
  input: CreateInput,
) {
  if (input.type === "TRANSFER") {
    if (!input.toAccountId || input.toAccountId === input.accountId) {
      throw new Error("INVALID_TRANSFER");
    }

    await db.transaction.create({
      data: {
        userId: input.userId,
        type: "TRANSFER",
        amount: input.amount,
        accountId: input.accountId,
        toAccountId: input.toAccountId,
        occurredAt: input.occurredAt,
        note: input.note,
      },
    });
    await db.account.update({
      where: { id: input.accountId },
      data: { balance: { decrement: input.amount } },
    });
    await db.account.update({
      where: { id: input.toAccountId },
      data: { balance: { increment: input.amount } },
    });
    return;
  }

  await db.transaction.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      accountId: input.accountId,
      categoryId: input.categoryId,
      merchant: input.merchant,
      note: input.note,
      occurredAt: input.occurredAt,
      recurringTransactionId: input.recurringTransactionId,
    },
  });

  await db.account.update({
    where: { id: input.accountId },
    data: {
      balance:
        input.type === "EXPENSE"
          ? { decrement: input.amount }
          : { increment: input.amount },
    },
  });

  const merchant = input.merchant?.trim();
  if (merchant && input.categoryId) {
    await rememberMerchantRule(db, {
      userId: input.userId,
      merchant,
      categoryId: input.categoryId,
      accountId: input.accountId,
    });
  }
}

export async function reverseTransaction(
  db: Prisma.TransactionClient,
  transaction: {
    id: string;
    type: TransactionType;
    amount: bigint;
    accountId: string;
    toAccountId: string | null;
  },
) {
  if (transaction.type === "TRANSFER" && transaction.toAccountId) {
    await db.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: transaction.amount } },
    });
    await db.account.update({
      where: { id: transaction.toAccountId },
      data: { balance: { decrement: transaction.amount } },
    });
  } else if (transaction.type === "EXPENSE") {
    await db.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: transaction.amount } },
    });
  } else if (transaction.type === "INCOME") {
    await db.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: transaction.amount } },
    });
  }

  await db.transaction.delete({ where: { id: transaction.id } });
}

async function rememberMerchantRule(
  db: Prisma.TransactionClient,
  input: { userId: string; merchant: string; categoryId: string; accountId: string },
) {
  const existing = await db.transactionRule.findFirst({
    where: {
      userId: input.userId,
      matchField: "MERCHANT",
      matchType: "EXACT",
      matchValue: input.merchant,
    },
  });

  if (existing) {
    await db.transactionRule.update({
      where: { id: existing.id },
      data: {
        categoryId: input.categoryId,
        accountId: input.accountId,
        isActive: true,
      },
    });
    return;
  }

  await db.transactionRule.create({
    data: {
      userId: input.userId,
      matchField: "MERCHANT",
      matchType: "EXACT",
      matchValue: input.merchant,
      categoryId: input.categoryId,
      accountId: input.accountId,
      priority: 0,
    },
  });
}
