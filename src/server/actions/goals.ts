"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { parseJalaliForm } from "@/lib/dates/jalali-form";
import { gregorianUtcFromJalali } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import {
  assertAccountOwned,
  assertGoalOwned,
  userFacingMutationError,
} from "@/server/services/ownership";
import { assertCanCreate } from "@/server/services/plan";

export type GoalActionState = {
  ok: boolean;
  error?: string;
};

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/home");
  revalidatePath("/reports");
}

export async function createGoal(
  _previous: GoalActionState | undefined,
  formData: FormData,
): Promise<GoalActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = parseTomanInput(String(formData.get("targetAmount") ?? ""));
  const currentAmount = parseTomanInput(String(formData.get("currentAmount") ?? "0"), {
    allowZero: true,
  });
  const accountIds = formData
    .getAll("fundingAccountId")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const accountId = String(formData.get("accountId") ?? "").trim();
  const fundingIds = accountIds.length > 0 ? accountIds : accountId ? [accountId] : [];
  const target = parseJalaliForm(formData, "target");

  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "نام هدف را وارد کن." };
  }
  if (targetAmount === null) {
    return { ok: false, error: "مبلغ هدف را وارد کن." };
  }
  if (currentAmount === null) {
    return { ok: false, error: "مبلغ فعلی معتبر نیست." };
  }
  if (!target.ok) {
    return { ok: false, error: "تاریخ هدف معتبر نیست." };
  }

  try {
    await assertCanCreate(user.id, user.plan, "goals");
    for (const fundingId of fundingIds) {
      await assertAccountOwned(user.id, fundingId);
    }
    const primaryAccountId = fundingIds[0] ?? null;

    await prisma.goal.create({
      data: {
        userId: user.id,
        name,
        targetAmount,
        currentAmount: primaryAccountId ? 0n : currentAmount,
        targetDate: target.value ? gregorianUtcFromJalali(target.value) : null,
        accountId: primaryAccountId,
        fundings: primaryAccountId
          ? { create: fundingIds.map((id) => ({ accountId: id })) }
          : undefined,
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره هدف انجام نشد. دوباره تلاش کن.") };
  }

  revalidateGoals();
  return { ok: true };
}

export async function updateGoalCurrent(
  _previous: GoalActionState | undefined,
  formData: FormData,
): Promise<GoalActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const currentAmount = parseTomanInput(String(formData.get("currentAmount") ?? ""), {
    allowZero: true,
  });

  if (!id) {
    return { ok: false, error: "هدف پیدا نشد." };
  }
  if (currentAmount === null) {
    return { ok: false, error: "مبلغ فعلی معتبر نیست." };
  }

  try {
    const goal = await assertGoalOwned(user.id, id);
    const fundingCount = await prisma.goalFunding.count({ where: { goalId: id } });
    if (goal.accountId || fundingCount > 0) {
      return { ok: false, error: "مبلغ این هدف از حساب وصل‌شده می‌آید." };
    }
    await prisma.goal.update({
      where: { id },
      data: { currentAmount },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره هدف انجام نشد. دوباره تلاش کن.") };
  }

  revalidateGoals();
  return { ok: true };
}

export async function archiveGoal(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await assertGoalOwned(user.id, id);
  await prisma.goal.update({
    where: { id },
    data: { isArchived: true },
  });
  revalidateGoals();
}
