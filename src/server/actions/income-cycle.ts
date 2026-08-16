"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type IncomeDayState = {
  ok: boolean;
  error?: string;
};

const daySchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31), {
    message: "روز درآمد معتبر نیست.",
  });

export async function updateIncomeDay(
  _previous: IncomeDayState | undefined,
  formData: FormData,
): Promise<IncomeDayState> {
  const user = await requireUser();
  const parsed = daySchema.safeParse(String(formData.get("incomeDayOfMonth") ?? ""));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "روز درآمد معتبر نیست." };
  }

  const incomeDayOfMonth = parsed.data === "" ? null : Number(parsed.data);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { incomeDayOfMonth },
    });
  } catch {
    return { ok: false, error: "ذخیره روز درآمد انجام نشد. دوباره تلاش کن." };
  }

  revalidatePath("/home");
  revalidatePath("/more");
  return { ok: true };
}
