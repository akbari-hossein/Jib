"use server";

import { RecurringFrequency, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { parseJalaliForm } from "@/lib/dates/jalali-form";
import {
  addRecurringOccurrence,
  firstOccurrenceOnOrAfter,
} from "@/lib/dates/recurring";
import {
  getTehranJalaliDate,
  gregorianUtcFromJalali,
  jalaliFromInstant,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import {
  assertAccountOwned,
  assertCategoryOwned,
  assertRecurringOwned,
  userFacingMutationError,
} from "@/server/services/ownership";
import { persistTransaction } from "@/server/services/transactions";

export type RecurringActionState = {
  ok: boolean;
  error?: string;
};

const typeSchema = z.enum(["EXPENSE", "INCOME"]);
const frequencySchema = z.enum(["WEEKLY", "MONTHLY", "YEARLY"]);

function revalidateRecurring() {
  revalidatePath("/recurring");
  revalidatePath("/home");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/budgets");
}

function categoryFits(kind: "EXPENSE" | "INCOME" | "BOTH", type: TransactionType) {
  if (type === "EXPENSE") {
    return kind === "EXPENSE" || kind === "BOTH";
  }
  if (type === "INCOME") {
    return kind === "INCOME" || kind === "BOTH";
  }
  return false;
}

export async function createRecurring(
  _previous: RecurringActionState | undefined,
  formData: FormData,
): Promise<RecurringActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const typeResult = typeSchema.safeParse(formData.get("type"));
  const frequencyResult = frequencySchema.safeParse(formData.get("frequency"));
  const amount = parseTomanInput(String(formData.get("amount") ?? ""));
  const categoryId = String(formData.get("categoryId") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const start = parseJalaliForm(formData, "start");
  const today = getTehranJalaliDate();

  if (name.length < 1 || name.length > 60) {
    return { ok: false, error: "نام را وارد کن." };
  }
  if (!typeResult.success) {
    return { ok: false, error: "نوع معتبر نیست." };
  }
  if (!frequencyResult.success) {
    return { ok: false, error: "دوره تکرار معتبر نیست." };
  }
  if (amount === null) {
    return { ok: false, error: "مبلغ را وارد کن." };
  }
  if (!categoryId) {
    return { ok: false, error: "دسته‌بندی را انتخاب کن." };
  }
  if (!accountId) {
    return { ok: false, error: "حساب را انتخاب کن." };
  }
  if (!start.ok) {
    return { ok: false, error: "تاریخ شروع معتبر نیست." };
  }

  const startDate = start.value ?? today;
  const frequency = frequencyResult.data as RecurringFrequency;
  const type = typeResult.data;
  const dayOfMonth = frequency === "MONTHLY" ? startDate.day : null;
  const nextDate = firstOccurrenceOnOrAfter(startDate, today, frequency, 1, dayOfMonth);

  try {
    const account = await assertAccountOwned(user.id, accountId);
    if (!account.isActive) {
      return { ok: false, error: "این حساب فعال نیست." };
    }
    const category = await assertCategoryOwned(user.id, categoryId);
    if (!categoryFits(category.kind, type)) {
      return { ok: false, error: "این دسته با نوع تراکنش نمی‌خواند." };
    }

    await prisma.recurringTransaction.create({
      data: {
        userId: user.id,
        name,
        type,
        amount,
        frequency,
        interval: 1,
        startDate: gregorianUtcFromJalali(startDate),
        nextRunAt: gregorianUtcFromJalali(nextDate),
        dayOfMonth,
        categoryId,
        accountId,
      },
    });
  } catch (error) {
    return { ok: false, error: userFacingMutationError(error, "ذخیره مورد تکراری انجام نشد. دوباره تلاش کن.") };
  }

  revalidateRecurring();
  return { ok: true };
}

export async function pauseRecurring(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await assertRecurringOwned(user.id, id);
  await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive: false },
  });
  revalidateRecurring();
}

export async function resumeRecurring(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const item = await assertRecurringOwned(user.id, id);
  const today = getTehranJalaliDate();
  const nextDate = firstOccurrenceOnOrAfter(
    jalaliFromInstant(item.nextRunAt),
    today,
    item.frequency,
    item.interval,
    item.dayOfMonth,
  );
  await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive: true, nextRunAt: gregorianUtcFromJalali(nextDate) },
  });
  revalidateRecurring();
}

export async function deleteRecurring(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await assertRecurringOwned(user.id, id);
  await prisma.recurringTransaction.delete({ where: { id } });
  revalidateRecurring();
}

export async function postRecurringNow(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const item = await assertRecurringOwned(user.id, id);
  if (!item.isActive) {
    return;
  }

  const today = getTehranJalaliDate();
  const scheduled = jalaliFromInstant(item.nextRunAt);
  const nextDate = firstOccurrenceOnOrAfter(
    addRecurringOccurrence(scheduled, item.frequency, item.interval, item.dayOfMonth),
    today,
    item.frequency,
    item.interval,
    item.dayOfMonth,
  );

  await prisma.$transaction(async (db) => {
    await persistTransaction(db, {
      userId: user.id,
      type: item.type,
      amount: item.amount,
      accountId: item.accountId,
      categoryId: item.categoryId,
      note: item.name,
      occurredAt: new Date(),
      recurringTransactionId: item.id,
    });
    await db.recurringTransaction.update({
      where: { id: item.id },
      data: { nextRunAt: gregorianUtcFromJalali(nextDate) },
    });
  });

  revalidateRecurring();
}
