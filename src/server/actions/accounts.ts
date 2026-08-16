"use server";

import { AccountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import { assertAccountOwned, userFacingMutationError } from "@/server/services/ownership";
import { assertCanCreate } from "@/server/services/plan";

export type AccountActionState = {
  ok: boolean;
  error?: string;
};

const accountTypeSchema = z.enum(["CASH", "BANK", "CARD", "SAVINGS", "OTHER"]);

function includeInAvailableFor(type: AccountType): boolean {
  return type !== "SAVINGS";
}

export async function createAccount(
  _previous: AccountActionState | undefined,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const typeResult = accountTypeSchema.safeParse(formData.get("type"));
  const balance = parseTomanInput(String(formData.get("balance") ?? "0"), {
    allowZero: true,
  });

  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "نام حساب را وارد کن." };
  }
  if (!typeResult.success) {
    return { ok: false, error: "نوع حساب معتبر نیست." };
  }
  if (balance === null) {
    return { ok: false, error: "موجودی معتبر نیست." };
  }

  try {
    await assertCanCreate(user.id, user.plan, "accounts");
    const count = await prisma.account.count({ where: { userId: user.id } });
    await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type: typeResult.data,
        balance,
        includeInAvailable: includeInAvailableFor(typeResult.data),
        sortOrder: count,
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidatePath("/accounts");
  revalidatePath("/home");
  revalidatePath("/transactions");
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

  if (!id) {
    return { ok: false, error: "حساب پیدا نشد." };
  }
  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "نام حساب را وارد کن." };
  }
  if (!typeResult.success) {
    return { ok: false, error: "نوع حساب معتبر نیست." };
  }

  try {
    await assertAccountOwned(user.id, id);
    await prisma.account.update({
      where: { id },
      data: {
        name,
        type: typeResult.data,
        includeInAvailable: includeRaw === "on" || includeRaw === "true",
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره حساب انجام نشد. دوباره تلاش کن.") };
  }

  revalidatePath("/accounts");
  revalidatePath("/home");
  return { ok: true };
}

export async function archiveAccount(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await assertAccountOwned(user.id, id);
  await prisma.account.update({
    where: { id },
    data: { isActive: false, includeInAvailable: false },
  });
  revalidatePath("/accounts");
  revalidatePath("/home");
  revalidatePath("/transactions");
}
