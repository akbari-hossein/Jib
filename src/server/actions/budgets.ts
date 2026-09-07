"use server";

import { revalidatePath } from "next/cache";
import {
  categoryBudgetOverCopy,
  overallBelowAllocatedCopy,
} from "@/lib/finance/budget-allocation-copy";
import {
  isCategoryLimitAllowed,
  isOverallLimitAllowed,
  remainingAllocatable,
  sumBudgetLimits,
} from "@/lib/finance/budget-allocation";
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

class BudgetAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetAllocationError";
  }
}

function revalidateBudgets() {
  revalidatePath("/budgets");
  revalidatePath("/home");
  revalidatePath("/reports");
}

async function ensureCurrentBudget(userId: string) {
  const today = getTehranJalaliDate();
  return prisma.budget.upsert({
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
}

function allocationError(error: unknown, fallback: string): string {
  if (error instanceof BudgetAllocationError) {
    return error.message;
  }
  return userFacingMutationError(error, fallback);
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

    const budget = await ensureCurrentBudget(user.id);
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string; overallLimit: bigint | null }>>`
        SELECT id, "overallLimit" FROM "Budget" WHERE id = ${budget.id} FOR UPDATE
      `;
      const current = locked[0];
      if (!current) {
        throw new BudgetAllocationError("بودجه این ماه پیدا نشد.");
      }

      const items = await tx.budgetCategory.findMany({
        where: { budgetId: current.id },
        select: { categoryId: true, limit: true },
      });
      const otherLimits = items
        .filter((item) => item.categoryId !== categoryId)
        .map((item) => item.limit);

      if (!isCategoryLimitAllowed(current.overallLimit, limit, otherLimits)) {
        const remaining = remainingAllocatable(current.overallLimit, otherLimits) ?? 0n;
        throw new BudgetAllocationError(categoryBudgetOverCopy(remaining));
      }

      await tx.budgetCategory.upsert({
        where: { budgetId_categoryId: { budgetId: current.id, categoryId } },
        update: { limit },
        create: { budgetId: current.id, categoryId, limit },
      });
    });
  } catch (error) {
    return { ok: false, error: allocationError(error, "ذخیره بودجه انجام نشد. دوباره تلاش کن.") };
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
    const budget = await ensureCurrentBudget(user.id);
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Budget" WHERE id = ${budget.id} FOR UPDATE
      `;
      if (!locked[0]) {
        throw new BudgetAllocationError("بودجه این ماه پیدا نشد.");
      }

      const items = await tx.budgetCategory.findMany({
        where: { budgetId: budget.id },
        select: { limit: true },
      });
      const categoryLimits = items.map((item) => item.limit);

      if (!isOverallLimitAllowed(limit, categoryLimits)) {
        throw new BudgetAllocationError(
          overallBelowAllocatedCopy(sumBudgetLimits(categoryLimits), limit ?? 0n),
        );
      }

      await tx.budget.update({
        where: { id: budget.id },
        data: { overallLimit: limit },
      });
    });
  } catch (error) {
    return { ok: false, error: allocationError(error, "ذخیره سقف کل انجام نشد. دوباره تلاش کن.") };
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
