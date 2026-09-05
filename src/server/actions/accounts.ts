"use server";

import { AccountType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  isAccountColor,
  isAccountIcon,
  parseOptionalAppearance,
} from "@/lib/accounts/appearance";
import { accountDeletionCopy, canPermanentlyDeleteAccount } from "@/lib/accounts/deletion";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isReferenceAssetType, type ReferenceAssetType } from "@/lib/finance/purchasing-power";
import { decimalStringFromScaled, parseQuantityToScaled } from "@/lib/finance/quantity";
import { parseTomanInput } from "@/lib/validation/money";
import { getLatestRate } from "@/lib/finance/referenceRates";
import { assertAccountOwned, userFacingMutationError } from "@/server/services/ownership";
import { persistTransaction } from "@/server/services/transactions";

export type AccountActionState = {
  ok: boolean;
  error?: string;
  blocked?: boolean;
  dependents?: {
    transactionCount: number;
    recurringCount: number;
    goalCount: number;
  };
};

const accountTypeSchema = z.enum(["CASH", "BANK", "CARD", "SAVINGS", "ASSET_HOLDING", "OTHER"]);

function includeInAvailableFor(type: AccountType): boolean {
  return type !== "SAVINGS" && type !== "ASSET_HOLDING";
}

function revalidateAccounts() {
  revalidatePath("/accounts");
  revalidatePath("/home");
  revalidatePath("/transactions");
  revalidatePath("/goals");
  revalidatePath("/reports");
  revalidatePath("/budgets");
  revalidatePath("/recurring");
}

function parseAppearance(formData: FormData): { color: string | null; icon: string | null } | { error: string } {
  const colorRaw = parseOptionalAppearance(String(formData.get("color") ?? ""));
  const iconRaw = parseOptionalAppearance(String(formData.get("icon") ?? ""));

  if (colorRaw && !isAccountColor(colorRaw)) {
    return { error: "رنگ حساب معتبر نیست." };
  }
  if (iconRaw && !isAccountIcon(iconRaw)) {
    return { error: "آیکون حساب معتبر نیست." };
  }

  return {
    color: colorRaw ?? null,
    icon: iconRaw ?? null,
  };
}

async function countAccountDependents(accountId: string, userId: string) {
  const [outgoing, incoming, recurringCount, goalCount, fundingCount] = await Promise.all([
    prisma.transaction.count({ where: { userId, accountId } }),
    prisma.transaction.count({ where: { userId, toAccountId: accountId } }),
    prisma.recurringTransaction.count({ where: { userId, accountId } }),
    prisma.goal.count({ where: { userId, accountId, isArchived: false } }),
    prisma.goalFunding.count({ where: { accountId } }),
  ]);

  return {
    transactionCount: outgoing + incoming,
    recurringCount,
    goalCount: goalCount + fundingCount,
  };
}

export async function createAccount(
  _previous: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const typeResult = accountTypeSchema.safeParse(formData.get("type"));
  const isAsset = typeResult.success && typeResult.data === "ASSET_HOLDING";
  const assetRaw = String(formData.get("assetType") ?? "");
  const quantityScaled = parseQuantityToScaled(String(formData.get("quantity") ?? "0"));
  const balance = isAsset
    ? 0n
    : parseTomanInput(String(formData.get("balance") ?? "0"), {
        allowZero: true,
        allowNegative: true,
      });
  const appearance = parseAppearance(formData);

  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "نام حساب را وارد کن." };
  }
  if (!typeResult.success) {
    return { ok: false, error: "نوع حساب معتبر نیست." };
  }
  if (isAsset && !isReferenceAssetType(assetRaw)) {
    return { ok: false, error: "نوع دارایی را انتخاب کن." };
  }
  if (isAsset && quantityScaled == null) {
    return { ok: false, error: "مقدار دارایی معتبر نیست." };
  }
  if (!isAsset && balance === null) {
    return { ok: false, error: "موجودی معتبر نیست." };
  }
  if ("error" in appearance) {
    return { ok: false, error: appearance.error };
  }

  try {
    const count = await prisma.account.count({ where: { userId: user.id } });
    const created = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type: typeResult.data,
        balance: isAsset ? 0n : (balance ?? 0n),
        quantity: new Prisma.Decimal("0"),
        assetType: isAsset && isReferenceAssetType(assetRaw) ? assetRaw : null,
        color: appearance.color,
        icon: appearance.icon,
        includeInAvailable: includeInAvailableFor(typeResult.data),
        sortOrder: count,
      },
    });
    if (isAsset && isReferenceAssetType(assetRaw) && quantityScaled && quantityScaled > 0n) {
      const rate = await getLatestRate(assetRaw);
      await prisma.$transaction(async (db) => {
        await persistTransaction(db, {
          userId: user.id,
          type: "ASSET_ADD",
          amount: 0n,
          accountId: created.id,
          occurredAt: new Date(),
          quantityDelta: quantityScaled,
          rateToTomanSnapshot: rate?.rateToToman ?? null,
        });
      });
    }
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidateAccounts();
  return { ok: true };
}

export async function updateAccount(
  _previous: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const typeResult = accountTypeSchema.safeParse(formData.get("type"));
  const includeRaw = formData.get("includeInAvailable");
  const balanceRaw = formData.get("balance");
  const quantityRaw = formData.get("quantity");
  const assetRaw = String(formData.get("assetType") ?? "");
  const appearance = parseAppearance(formData);

  if (!id) {
    return { ok: false, error: "حساب پیدا نشد." };
  }
  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "نام حساب را وارد کن." };
  }
  if (!typeResult.success) {
    return { ok: false, error: "نوع حساب معتبر نیست." };
  }
  if ("error" in appearance) {
    return { ok: false, error: appearance.error };
  }

  let balance: bigint | undefined;
  let quantity: Prisma.Decimal | undefined;
  let assetType: ReferenceAssetType | null | undefined;
  const isAsset = typeResult.success && typeResult.data === "ASSET_HOLDING";
  if (isAsset) {
    if (!isReferenceAssetType(assetRaw)) {
      return { ok: false, error: "نوع دارایی را انتخاب کن." };
    }
    assetType = assetRaw;
    balance = 0n;
    if (quantityRaw != null) {
      const parsed = parseQuantityToScaled(String(quantityRaw));
      if (parsed == null) {
        return { ok: false, error: "مقدار دارایی معتبر نیست." };
      }
      quantity = new Prisma.Decimal(decimalStringFromScaled(parsed));
    }
  } else if (balanceRaw != null) {
    const parsed = parseTomanInput(String(balanceRaw), { allowZero: true, allowNegative: true });
    if (parsed === null) {
      return { ok: false, error: "موجودی معتبر نیست." };
    }
    balance = parsed;
    assetType = null;
  }

  try {
    await assertAccountOwned(user.id, id);
    await prisma.account.update({
      where: { id, userId: user.id },
      data: {
        name,
        type: typeResult.data,
        includeInAvailable: includeRaw === "on" || includeRaw === "true",
        color: appearance.color,
        icon: appearance.icon,
        ...(balance !== undefined ? { balance } : {}),
        ...(quantity !== undefined ? { quantity } : {}),
        ...(assetType !== undefined ? { assetType } : {}),
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidateAccounts();
  return { ok: true };
}

export async function archiveAccount(
  _previous: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, error: "حساب پیدا نشد." };
  }

  try {
    await assertAccountOwned(user.id, id);
    await prisma.account.update({
      where: { id, userId: user.id },
      data: { isActive: false, includeInAvailable: false },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "بایگانی حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidateAccounts();
  return { ok: true };
}

export async function restoreAccount(
  _previous: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, error: "حساب پیدا نشد." };
  }

  try {
    const account = await assertAccountOwned(user.id, id);
    if (account.isActive) {
      return { ok: true };
    }
    await prisma.account.update({
      where: { id, userId: user.id },
      data: {
        isActive: true,
        includeInAvailable: includeInAvailableFor(account.type),
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "بازگردانی حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidateAccounts();
  return { ok: true };
}

export async function deleteAccount(
  _previous: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, error: "حساب پیدا نشد." };
  }

  try {
    await assertAccountOwned(user.id, id);
    const dependents = await countAccountDependents(id, user.id);

    if (!canPermanentlyDeleteAccount(dependents)) {
      return {
        ok: false,
        blocked: true,
        dependents,
        error: accountDeletionCopy(dependents).description,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.transactionRule.updateMany({
        where: { userId: user.id, accountId: id },
        data: { accountId: null },
      });
      await tx.account.delete({
        where: { id, userId: user.id },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        ok: false,
        blocked: true,
        error: "این حساب به تراکنش یا مورد تکراری وصل است و حذف نمی‌شود.",
      };
    }
    return { ok: false, error: userFacingMutationError(error, "حذف حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidateAccounts();
  return { ok: true };
}

export async function getAccountDependents(accountId: string): Promise<AccountActionState> {
  const user = await requireUser();
  if (!accountId) {
    return { ok: false, error: "حساب پیدا نشد." };
  }

  try {
    await assertAccountOwned(user.id, accountId);
    const dependents = await countAccountDependents(accountId, user.id);
    return { ok: true, dependents };
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "وضعیت حساب خوانده نشد.") };
  }
}
