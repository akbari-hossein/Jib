"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { assertCategoryOwned, assertRuleOwned, userFacingMutationError } from "@/server/services/ownership";

export type RuleActionState = {
  ok: boolean;
  error?: string;
};

const matchTypeSchema = z.enum(["EXACT", "CONTAINS"]);

export async function createRule(
  _previous: RuleActionState | undefined,
  formData: FormData,
): Promise<RuleActionState> {
  const user = await requireUser();
  const matchValue = String(formData.get("matchValue") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const matchType = matchTypeSchema.safeParse(formData.get("matchType") ?? "CONTAINS");

  if (matchValue.length < 2) {
    return { ok: false, error: "عبارت فروشنده خیلی کوتاه است." };
  }
  if (!matchType.success) {
    return { ok: false, error: "نوع تطبیق معتبر نیست." };
  }
  if (!categoryId) {
    return { ok: false, error: "دسته‌بندی را انتخاب کن." };
  }

  try {
    await assertCategoryOwned(user.id, categoryId);
    await prisma.transactionRule.create({
      data: {
        userId: user.id,
        matchField: "MERCHANT",
        matchType: matchType.data,
        matchValue,
        categoryId,
        priority: matchType.data === "EXACT" ? 10 : 0,
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره قانون انجام نشد. دوباره تلاش کن.") };
  }

  revalidatePath("/rules");
  revalidatePath("/transactions");
  return { ok: true };
}

export async function deleteRule(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await assertRuleOwned(user.id, id);
  await prisma.transactionRule.delete({ where: { id } });
  revalidatePath("/rules");
}
