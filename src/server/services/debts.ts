import type { DebtType, Prisma } from "@prisma/client";
import { contactColorForIndex } from "@/lib/contacts/appearance";
import {
  applySettlement,
  planSettlementAllocation,
} from "@/lib/finance/debts";
import { persistTransaction, reverseTransaction } from "@/server/services/transactions";

export type ResolvedParticipant = {
  contactId: string;
  name: string;
  share: bigint;
};

async function optionalAccount(
  db: Prisma.TransactionClient,
  userId: string,
  accountId: string | null,
) {
  if (!accountId) {
    return null;
  }
  const account = await db.account.findFirst({
    where: { id: accountId, userId, isActive: true },
  });
  return account;
}

export async function resolveOrCreateContact(
  db: Prisma.TransactionClient,
  userId: string,
  input: { contactId?: string | null; name?: string | null },
) {
  if (input.contactId) {
    const existing = await db.contact.findFirst({
      where: { id: input.contactId, userId },
    });
    if (!existing) {
      throw new Error("NOT_OWNED");
    }
    return existing;
  }

  const name = input.name?.trim() ?? "";
  if (!name) {
    throw new Error("CONTACT_REQUIRED");
  }

  const sameName = await db.contact.findFirst({
    where: { userId, name },
    orderBy: { createdAt: "asc" },
  });
  if (sameName) {
    return sameName;
  }

  const count = await db.contact.count({ where: { userId } });
  return db.contact.create({
    data: {
      userId,
      name,
      color: contactColorForIndex(count),
    },
  });
}

async function linkLoanTransaction(
  db: Prisma.TransactionClient,
  input: {
    userId: string;
    type: DebtType;
    amount: bigint;
    accountId: string;
    occurredAt: Date;
    note: string | null;
  },
) {
  return persistTransaction(db, {
    userId: input.userId,
    type: input.type === "OWED_TO_ME" ? "LOAN_GIVEN" : "LOAN_RECEIVED",
    amount: input.amount,
    accountId: input.accountId,
    occurredAt: input.occurredAt,
    note: input.note,
  });
}

export async function createDebtRecord(
  db: Prisma.TransactionClient,
  input: {
    userId: string;
    contactId: string;
    type: DebtType;
    amount: bigint;
    reason: string | null;
    date: Date;
    accountId: string | null;
    splitBillId?: string | null;
  },
) {
  const account = await optionalAccount(db, input.userId, input.accountId);
  const transaction = account
    ? await linkLoanTransaction(db, {
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        accountId: account.id,
        occurredAt: input.date,
        note: input.reason,
      })
    : null;

  return db.debtRecord.create({
    data: {
      userId: input.userId,
      contactId: input.contactId,
      type: input.type,
      originalAmount: input.amount,
      remainingAmount: input.amount,
      reason: input.reason,
      date: input.date,
      accountId: account?.id ?? null,
      splitBillId: input.splitBillId ?? null,
      transactionId: transaction?.id ?? null,
    },
  });
}

export async function createSplitBillWithDebts(
  db: Prisma.TransactionClient,
  input: {
    userId: string;
    title: string;
    totalAmount: bigint;
    date: Date;
    paidByMe: boolean;
    accountId: string | null;
    myShare: bigint;
    others: ResolvedParticipant[];
    payerContactId: string | null;
  },
) {
  const othersTotal = input.others.reduce((sum, item) => sum + item.share, 0n);
  if (input.myShare + othersTotal !== input.totalAmount) {
    throw new Error("SPLIT_MISMATCH");
  }

  const account = input.paidByMe ? await optionalAccount(db, input.userId, input.accountId) : null;
  const loanTransaction =
    account && othersTotal > 0n
      ? await persistTransaction(db, {
          userId: input.userId,
          type: "LOAN_GIVEN",
          amount: othersTotal,
          accountId: account.id,
          occurredAt: input.date,
          note: input.title,
        })
      : null;

  const split = await db.splitBill.create({
    data: {
      userId: input.userId,
      title: input.title,
      totalAmount: input.totalAmount,
      date: input.date,
      paidByMe: input.paidByMe,
      accountId: account?.id ?? null,
      transactionId: loanTransaction?.id ?? null,
    },
  });

  if (input.paidByMe) {
    for (const participant of input.others) {
      if (participant.share <= 0n) {
        continue;
      }
      await db.debtRecord.create({
        data: {
          userId: input.userId,
          contactId: participant.contactId,
          type: "OWED_TO_ME",
          originalAmount: participant.share,
          remainingAmount: participant.share,
          reason: input.title,
          date: input.date,
          splitBillId: split.id,
        },
      });
    }
    return split;
  }

  const payerId = input.payerContactId ?? input.others[0]?.contactId;
  if (!payerId || input.myShare <= 0n) {
    return split;
  }

  await db.debtRecord.create({
    data: {
      userId: input.userId,
      contactId: payerId,
      type: "I_OWE",
      originalAmount: input.myShare,
      remainingAmount: input.myShare,
      reason: input.title,
      date: input.date,
      splitBillId: split.id,
    },
  });

  return split;
}

export async function settleDebtRecord(
  db: Prisma.TransactionClient,
  input: {
    userId: string;
    debt: {
      id: string;
      type: DebtType;
      remainingAmount: bigint;
      reason: string | null;
    };
    amount: bigint;
    date: Date;
    accountId: string | null;
    note: string | null;
  },
) {
  const next = applySettlement(input.debt.remainingAmount, input.amount);
  const account = await optionalAccount(db, input.userId, input.accountId);
  const transaction = account
    ? await persistTransaction(db, {
        userId: input.userId,
        type: input.debt.type === "OWED_TO_ME" ? "LOAN_RECEIVED" : "LOAN_GIVEN",
        amount: input.amount,
        accountId: account.id,
        occurredAt: input.date,
        note: input.note ?? input.debt.reason,
      })
    : null;

  await db.settlementPayment.create({
    data: {
      debtRecordId: input.debt.id,
      amount: input.amount,
      date: input.date,
      accountId: account?.id ?? null,
      note: input.note,
      transactionId: transaction?.id ?? null,
    },
  });

  await db.debtRecord.update({
    where: { id: input.debt.id },
    data: {
      remainingAmount: next.remainingAmount,
      status: next.status,
    },
  });
}

export async function settleDebtsInOrder(
  db: Prisma.TransactionClient,
  input: {
    userId: string;
    debts: Array<{
      id: string;
      type: DebtType;
      remainingAmount: bigint;
      reason: string | null;
    }>;
    amount: bigint;
    date: Date;
    accountId: string | null;
    note: string | null;
  },
) {
  const allocations = planSettlementAllocation(input.debts, input.amount);
  const byId = new Map(input.debts.map((debt) => [debt.id, debt]));
  for (const allocation of allocations) {
    const debt = byId.get(allocation.id);
    if (!debt) {
      continue;
    }
    await settleDebtRecord(db, {
      userId: input.userId,
      debt,
      amount: allocation.amount,
      date: input.date,
      accountId: input.accountId,
      note: input.note,
    });
  }
}

export async function deleteOpenDebtRecord(
  db: Prisma.TransactionClient,
  debt: {
    id: string;
    transactionId: string | null;
    settlements: Array<{
      id: string;
      transaction: {
        id: string;
        type: "EXPENSE" | "INCOME" | "TRANSFER" | "LOAN_GIVEN" | "LOAN_RECEIVED";
        amount: bigint;
        accountId: string;
        toAccountId: string | null;
      } | null;
    }>;
    transaction: {
      id: string;
      type: "EXPENSE" | "INCOME" | "TRANSFER" | "LOAN_GIVEN" | "LOAN_RECEIVED";
      amount: bigint;
      accountId: string;
      toAccountId: string | null;
    } | null;
  },
) {
  if (debt.settlements.length > 0) {
    throw new Error("HAS_SETTLEMENTS");
  }

  if (debt.transaction) {
    await reverseTransaction(db, debt.transaction);
  }

  await db.debtRecord.delete({ where: { id: debt.id } });
}
