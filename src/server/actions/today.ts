"use server";

import { CheckInMood } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { parseJalaliForm, parseTehranClock } from "@/lib/dates/jalali-form";
import {
  getTehranJalaliDate,
  jalaliDateOnlyUtc,
  tehranDateTimeUtc,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import {
  assertCalendarEventOwned,
  assertFinancialTaskOwned,
  userFacingMutationError,
} from "@/server/services/ownership";

export type CompleteFinancialTaskResult = TodayMutationResult;
export type TodayMutationResult = {
  ok: boolean;
  error?: string;
};

export type TodayFormState = TodayMutationResult;

const moodSchema = z.enum(["GOOD", "NEUTRAL", "STRESSED"]);

function revalidateHome() {
  revalidatePath("/home");
}

export async function completeFinancialTask(taskId: string): Promise<TodayMutationResult> {
  const user = await requireUser();

  try {
    const task = await assertFinancialTaskOwned(user.id, taskId);
    if (task.isCompleted) {
      return { ok: true };
    }

    await prisma.financialTask.update({
      where: { id: task.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    revalidateHome();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}

export async function createCustomFinancialTask(
  _previous: TodayFormState | undefined,
  formData: FormData,
): Promise<TodayFormState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const due = parseJalaliForm(formData, "due");
  const today = getTehranJalaliDate();

  if (title.length < 1 || title.length > 80) {
    return { ok: false, error: "عنوان کار را وارد کن." };
  }
  if (!due.ok) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }

  const dueDate = due.value ?? today;

  try {
    await prisma.financialTask.create({
      data: {
        userId: user.id,
        title,
        type: "CUSTOM",
        dueDate: jalaliDateOnlyUtc(dueDate),
      },
    });
    revalidateHome();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}

export async function saveDailyCheckIn(mood: CheckInMood): Promise<TodayMutationResult> {
  const user = await requireUser();
  const parsed = moodSchema.safeParse(mood);
  if (!parsed.success) {
    return { ok: false, error: "حال معتبر نیست." };
  }

  const today = jalaliDateOnlyUtc(getTehranJalaliDate());

  try {
    await prisma.dailyCheckIn.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, mood: parsed.data },
      update: { mood: parsed.data },
    });
    revalidateHome();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}

export async function createCalendarEvent(
  _previous: TodayFormState | undefined,
  formData: FormData,
): Promise<TodayFormState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const date = parseJalaliForm(formData, "date");
  const startClock = parseTehranClock(String(formData.get("startTime") ?? ""));
  const endRaw = String(formData.get("endTime") ?? "").trim();
  const endClock = endRaw ? parseTehranClock(endRaw) : null;
  const costRaw = String(formData.get("linkedCostEstimate") ?? "").trim();
  const cost = costRaw ? parseTomanInput(costRaw) : null;
  const today = getTehranJalaliDate();

  if (title.length < 1 || title.length > 80) {
    return { ok: false, error: "عنوان رویداد را وارد کن." };
  }
  if (!date.ok) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }
  if (!startClock) {
    return { ok: false, error: "ساعت شروع را وارد کن." };
  }
  if (endRaw && !endClock) {
    return { ok: false, error: "ساعت پایان معتبر نیست." };
  }
  if (costRaw && cost === null) {
    return { ok: false, error: "هزینه را به تومان وارد کن." };
  }

  const eventDate = date.value ?? today;
  const startTime = tehranDateTimeUtc(eventDate, startClock.hour, startClock.minute);
  const endTime = endClock
    ? tehranDateTimeUtc(eventDate, endClock.hour, endClock.minute)
    : null;

  if (endTime && endTime.getTime() <= startTime.getTime()) {
    return { ok: false, error: "ساعت پایان باید بعد از شروع باشد." };
  }

  try {
    await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title,
        startTime,
        endTime,
        source: "MANUAL",
        linkedCostEstimate: cost,
      },
    });
    revalidateHome();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}

export async function dismissCalendarEvent(eventId: string): Promise<TodayMutationResult> {
  const user = await requireUser();

  try {
    const event = await assertCalendarEventOwned(user.id, eventId);
    if (!event.isDismissed) {
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { isDismissed: true },
      });
    }
    revalidateHome();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}
