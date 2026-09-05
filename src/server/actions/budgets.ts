"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import {
  assertBudgetCategoryOwned,
  assertCategoryOwned,
  userFacingMutationError,
} from "@/server/services/ownership";

export type BudgetActionState = {
  ok: boolean;
  error?: string;
};

async function currentBudgetId(userId: string) {
  const today = getTehranJalaliDate();
  const budget = await prisma.budget.upsert({
    where: {
      userId_jalaliYear_jalaliMonth: {
        userId,
        jalaliYear: today.year,
        jalaliMonth: today.month,
      },
    },
    update: {},
    create: {
      userId,
      jalaliYear: today.year,
      jalaliMonth: today.month,
    },
  });
  return budget.id;
}

function revalidateBudgets() {
  revalidatePath("/budgets");
  revalidatePath("/home");
  revalidatePath("/reports");
}

export async function upsertBudgetCategory(
  _previous: BudgetActionState | undefined,
  formData: FormData,
): Promise<BudgetActionState> {
  const user = await requireUser();
  const categoryId = String(formData.get("categoryId") ?? "");
  const limit = parseTomanInput(String(formData.get("limit") ?? ""));

  if (!categoryId) {
    return { ok: false, error: "دسته‌بندی را انتخاب کن." };
  }
  if (limit === null) {
    return { ok: false, error: "سقف را وارد کن." };
  }

  try {
    const category = await assertCategoryOwned(user.id, categoryId);
    if (category.kind === "INCOME") {
      return { ok: false, error: "برای درآمد نمی‌شود سقف گذاشت." };
    }
    const budgetId = await currentBudgetId(user.id);
    await prisma.budgetCategory.upsert({
      where: { budgetId_categoryId: { budgetId, categoryId } },
      update: { limit },
      create: { budgetId, categoryId, limit },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره بودجه انجام نشد. دوباره تلاش کن.") };
  }

  revalidateBudgets();
  return { ok: true };
}

export async function updateOverallLimit(
  _previous: BudgetActionState | undefined,
  formData: FormData,
): Promise<BudgetActionState> {
  const user = await requireUser();
  const raw = String(formData.get("overallLimit") ?? "").trim();
  const limit = raw === "" ? null : parseTomanInput(raw);

  if (raw !== "" && limit === null) {
    return { ok: false, error: "سقف کل معتبر نیست." };
  }

  try {
    const budgetId = await currentBudgetId(user.id);
    await prisma.budget.update({
      where: { id: budgetId },
      data: { overallLimit: limit },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره سقف کل انجام نشد. دوباره تلاش کن.") };
  }

  revalidateBudgets();
  return { ok: true };
}

export async function deleteBudgetCategory(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await assertBudgetCategoryOwned(user.id, id);
  await prisma.budgetCategory.delete({ where: { id } });
  revalidateBudgets();
}
