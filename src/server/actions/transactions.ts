"use server";

import { TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import {
  assertAccountOwned,
  assertCategoryOwned,
  assertTransactionOwned,
  userFacingMutationError,
} from "@/server/services/ownership";
import { persistTransaction, reverseTransaction } from "@/server/services/transactions";

export type TransactionActionState = {
  ok: boolean;
  error?: string;
};

const typeSchema = z.enum(["EXPENSE", "INCOME", "TRANSFER"]);

function revalidateFinance() {
  revalidatePath("/home");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
  revalidatePath("/goals");
  revalidatePath("/recurring");
  revalidatePath("/reports");
}

export async function createQuickTransaction(input: {
  type: TransactionType;
  amount: string;
  accountId: string;
  categoryId?: string;
  toAccountId?: string;
  merchant?: string;
}): Promise<TransactionActionState> {
  const user = await requireUser();
  const typeResult = typeSchema.safeParse(input.type);
  const amount = parseTomanInput(input.amount);

  if (!typeResult.success) {
    return { ok: false, error: "نوع تراکنش معتبر نیست." };
  }
  if (amount === null) {
    return { ok: false, error: "مبلغ را وارد کن." };
  }
  if (!input.accountId) {
    return { ok: false, error: "حساب را انتخاب کن." };
  }

  const type = typeResult.data;
  const merchant = input.merchant?.trim() || null;

  try {
    const account = await assertAccountOwned(user.id, input.accountId);
    if (!account.isActive) {
      return { ok: false, error: "این حساب فعال نیست." };
    }

    if (type === "TRANSFER") {
      if (!input.toAccountId) {
        return { ok: false, error: "حساب مقصد را انتخاب کن." };
      }
      const destination = await assertAccountOwned(user.id, input.toAccountId);
      if (!destination.isActive) {
        return { ok: false, error: "حساب مقصد فعال نیست." };
      }
      if (destination.id === account.id) {
        return { ok: false, error: "حساب مبدأ و مقصد یکی است." };
      }
    } else {
      if (!input.categoryId) {
        return { ok: false, error: "دسته‌بندی را انتخاب کن." };
      }
      await assertCategoryOwned(user.id, input.categoryId);
    }

    await prisma.$transaction(async (db) => {
      await persistTransaction(db, {
        userId: user.id,
        type,
        amount,
        accountId: input.accountId,
        toAccountId: type === "TRANSFER" ? input.toAccountId : null,
        categoryId: type === "TRANSFER" ? null : input.categoryId,
        merchant: type === "TRANSFER" ? null : merchant,
        occurredAt: new Date(),
      });
    });
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره تراکنش انجام نشد. دوباره تلاش کن."),
    };
  }

  revalidateFinance();
  return { ok: true };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const transaction = await assertTransactionOwned(user.id, id);
  await prisma.$transaction(async (db) => {
    await reverseTransaction(db, transaction);
  });
  revalidateFinance();
}
