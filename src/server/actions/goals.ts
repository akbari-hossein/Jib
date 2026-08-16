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

export type GoalActionState = {
  ok: boolean;
  error?: string;
};

function revalidateGoals() {
  revalidatePath("/goals");
  revalidatePath("/home");
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
  const accountId = String(formData.get("accountId") ?? "").trim();
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
    let opening = currentAmount;
    if (accountId) {
      const account = await assertAccountOwned(user.id, accountId);
      opening = account.balance;
    }

    await prisma.goal.create({
      data: {
        userId: user.id,
        name,
        targetAmount,
        currentAmount: opening,
        targetDate: target.value ? gregorianUtcFromJalali(target.value) : null,
        accountId: accountId || null,
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
    if (goal.accountId) {
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
