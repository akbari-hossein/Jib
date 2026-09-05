import { Prisma, type AssetMovementReason, type TransactionType } from "@prisma/client";
import { calculateAssetHoldingValue } from "@/lib/finance/assetHoldings";
import { isReferenceAssetType } from "@/lib/finance/purchasing-power";
import { decimalStringFromScaled, parseQuantityToScaled } from "@/lib/finance/quantity";

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
  quantityDelta?: bigint;
  rateToTomanSnapshot?: bigint | null;
  referenceRateId?: string | null;
  movementReason?: AssetMovementReason;
  convertToAccountId?: string | null;
};

function scaledQuantity(value: { toString(): string }): bigint {
  return parseQuantityToScaled(value.toString()) ?? 0n;
}

export async function persistTransaction(
  db: Prisma.TransactionClient,
  input: CreateInput,
) {
  if (input.type === "ASSET_ADD" || input.type === "ASSET_REMOVE") {
    await persistAssetMovement(db, input);
    return;
  }

  if (input.type === "TRANSFER") {
    if (!input.toAccountId || input.toAccountId === input.accountId) {
      throw new Error("INVALID_TRANSFER");
    }

    const [from, to] = await Promise.all([
      db.account.findFirstOrThrow({ where: { id: input.accountId } }),
      db.account.findFirstOrThrow({ where: { id: input.toAccountId } }),
    ]);
    if (from.type === "ASSET_HOLDING" || to.type === "ASSET_HOLDING") {
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

  const account = await db.account.findFirstOrThrow({ where: { id: input.accountId } });
  if (account.type === "ASSET_HOLDING") {
    throw new Error("INVALID_ACCOUNT");
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

async function persistAssetMovement(
  db: Prisma.TransactionClient,
  input: CreateInput,
) {
  const account = await db.account.findFirstOrThrow({ where: { id: input.accountId } });
  if (account.type !== "ASSET_HOLDING" || !account.assetType || !isReferenceAssetType(account.assetType)) {
    throw new Error("INVALID_ACCOUNT");
  }

  const delta = input.quantityDelta ?? 0n;
  if (delta <= 0n) {
    throw new Error("INVALID_QUANTITY");
  }

  const current = scaledQuantity(account.quantity);
  const next = input.type === "ASSET_ADD" ? current + delta : current - delta;
  if (next < 0n) {
    throw new Error("INSUFFICIENT_QUANTITY");
  }

  const snapshotRate =
    input.rateToTomanSnapshot != null && input.rateToTomanSnapshot > 0n
      ? {
          id: input.referenceRateId ?? "snapshot",
          assetType: account.assetType,
          rateToToman: input.rateToTomanSnapshot,
          source: "snapshot",
          effectiveAt: input.occurredAt,
          createdAt: input.occurredAt,
        }
      : null;
  const amount = calculateAssetHoldingValue(delta, snapshotRate) ?? 0n;
  const signedDelta = input.type === "ASSET_ADD" ? delta : -delta;
  const movementReason =
    input.movementReason ?? (input.type === "ASSET_ADD" ? "PURCHASE" : "SALE");
  if (input.type === "ASSET_ADD" && (movementReason === "SALE")) {
    throw new Error("INVALID_QUANTITY");
  }
  if (input.type === "ASSET_REMOVE" && (movementReason === "PURCHASE" || movementReason === "OPENING")) {
    throw new Error("INVALID_QUANTITY");
  }

  let linkedCashTransactionId: string | null = null;
  if (input.type === "ASSET_REMOVE" && input.convertToAccountId) {
    const cash = await db.account.findFirstOrThrow({ where: { id: input.convertToAccountId } });
    if (cash.type === "ASSET_HOLDING") {
      throw new Error("INVALID_ACCOUNT");
    }
    const income = await db.transaction.create({
      data: {
        userId: input.userId,
        type: "INCOME",
        amount,
        accountId: cash.id,
        occurredAt: input.occurredAt,
        note: input.note,
      },
    });
    await db.account.update({
      where: { id: cash.id },
      data: { balance: { increment: amount } },
    });
    linkedCashTransactionId = income.id;
  }

  await db.transaction.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount,
      accountId: input.accountId,
      occurredAt: input.occurredAt,
      note: input.note,
      quantityDelta: new Prisma.Decimal(decimalStringFromScaled(signedDelta)),
      rateToTomanSnapshot: snapshotRate?.rateToToman ?? null,
      referenceRateId: input.referenceRateId && input.referenceRateId !== "snapshot" ? input.referenceRateId : null,
      movementReason,
      linkedCashTransactionId,
    },
  });

  await db.account.update({
    where: { id: account.id },
    data: { quantity: new Prisma.Decimal(decimalStringFromScaled(next)) },
  });
}

export async function reverseTransaction(
  db: Prisma.TransactionClient,
  transaction: {
    id: string;
    type: TransactionType;
    amount: bigint;
    accountId: string;
    toAccountId: string | null;
    quantityDelta: { toString(): string } | null;
    linkedCashTransactionId: string | null;
  },
) {
  if (transaction.type === "ASSET_ADD" || transaction.type === "ASSET_REMOVE") {
    const account = await db.account.findFirstOrThrow({ where: { id: transaction.accountId } });
    const current = scaledQuantity(account.quantity);
    const delta = transaction.quantityDelta
      ? parseQuantityToScaled(transaction.quantityDelta.toString()) ?? 0n
      : 0n;
    const next = current - delta;
    if (next < 0n) {
      throw new Error("INSUFFICIENT_QUANTITY");
    }
    await db.account.update({
      where: { id: account.id },
      data: { quantity: new Prisma.Decimal(decimalStringFromScaled(next)) },
    });
    if (transaction.linkedCashTransactionId) {
      const cashTx = await db.transaction.findFirst({
        where: { id: transaction.linkedCashTransactionId },
      });
      if (cashTx) {
        await db.account.update({
          where: { id: cashTx.accountId },
          data: { balance: { decrement: cashTx.amount } },
        });
        await db.transaction.delete({ where: { id: cashTx.id } });
      }
    }
    await db.transaction.delete({ where: { id: transaction.id } });
    return;
  }

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
    const origin = await db.transaction.findFirst({
      where: { linkedCashTransactionId: transaction.id },
    });
    if (origin) {
      await reverseTransaction(db, origin);
      return;
    }
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
