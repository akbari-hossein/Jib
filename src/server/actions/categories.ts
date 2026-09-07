"use server";

import { CategoryGroup, CategoryKind, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  canDeleteCategory,
  categoryDeletionCopy,
  type CategoryDependents,
} from "@/lib/categories/deletion";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { defaultCategoryIcon, isCategoryIcon } from "@/lib/categories/icons";
import { assertCategoryOwned, userFacingMutationError } from "@/server/services/ownership";

export type CategoryActionState = {
  ok: boolean;
  error?: string;
  blocked?: boolean;
  dependents?: CategoryDependents;
};

const kindSchema = z.enum(["EXPENSE", "INCOME"]);

function revalidateCategories() {
  revalidatePath("/categories");
  revalidatePath("/budgets");
  revalidatePath("/recurring");
  revalidatePath("/rules");
  revalidatePath("/home");
  revalidatePath("/transactions");
  revalidatePath("/reports");
}

function groupForKind(kind: CategoryKind): CategoryGroup {
  return kind === CategoryKind.INCOME ? CategoryGroup.FINANCIAL : CategoryGroup.LIFESTYLE;
}

async function countCategoryDependents(categoryId: string, userId: string): Promise<CategoryDependents> {
  const [transactionCount, budgetCount, recurringCount, ruleCount] = await Promise.all([
    prisma.transaction.count({ where: { userId, categoryId } }),
    prisma.budgetCategory.count({ where: { categoryId, budget: { userId } } }),
    prisma.recurringTransaction.count({ where: { userId, categoryId } }),
    prisma.transactionRule.count({ where: { userId, categoryId } }),
  ]);

  return { transactionCount, budgetCount, recurringCount, ruleCount };
}

export async function getCategoryDependents(categoryId: string): Promise<CategoryActionState> {
  const user = await requireUser();
  try {
    await assertCategoryOwned(user.id, categoryId);
    return { ok: true, dependents: await countCategoryDependents(categoryId, user.id) };
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "وضعیت دسته‌بندی خوانده نشد.") };
  }
}

export async function createCategory(
  _previous: CategoryActionState | undefined,
  formData: FormData,
): Promise<CategoryActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const kindParsed = kindSchema.safeParse(String(formData.get("kind") ?? ""));
  const iconRaw = String(formData.get("icon") ?? "").trim();

  if (name.length < 1 || name.length > 40) {
    return { ok: false, error: "نام دسته‌بندی را وارد کن." };
  }
  if (!kindParsed.success) {
    return { ok: false, error: "نوع دسته‌بندی را انتخاب کن." };
  }
  if (iconRaw && !isCategoryIcon(iconRaw)) {
    return { ok: false, error: "آیکون دسته‌بندی معتبر نیست." };
  }

  const kind = kindParsed.data === "INCOME" ? CategoryKind.INCOME : CategoryKind.EXPENSE;
  const icon = iconRaw || defaultCategoryIcon(kind);

  try {
    await prisma.category.create({
      data: {
        userId: user.id,
        name,
        kind,
        icon,
        group: groupForKind(kind),
        isSystem: false,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "دسته‌بندی با این نام از قبل وجود دارد." };
    }
    return { ok: false, error: userFacingMutationError(error, "ذخیره دسته‌بندی انجام نشد. دوباره تلاش کن.") };
  }

  revalidateCategories();
  return { ok: true };
}

export async function deleteCategory(
  _previous: CategoryActionState | undefined,
  formData: FormData,
): Promise<CategoryActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, error: "دسته‌بندی پیدا نشد." };
  }

  try {
    const category = await assertCategoryOwned(user.id, id);
    const dependents = await countCategoryDependents(id, user.id);
    if (!canDeleteCategory(category.isSystem, dependents)) {
      return {
        ok: false,
        blocked: true,
        dependents,
        error: categoryDeletionCopy(category.isSystem, dependents).description,
      };
    }

    await prisma.category.delete({ where: { id } });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "حذف دسته‌بندی انجام نشد. دوباره تلاش کن.") };
  }

  revalidateCategories();
  return { ok: true };
}
