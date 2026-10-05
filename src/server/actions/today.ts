"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { parseJalaliForm, parseTehranClock } from "@/lib/dates/jalali-form";
import {
  getTehranJalaliDate,
  tehranDateTimeUtc,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { parseTomanInput } from "@/lib/validation/money";
import {
  assertCalendarEventOwned,
  userFacingMutationError,
} from "@/server/services/ownership";

export type TodayMutationResult = {
  ok: boolean;
  error?: string;
};

export type TodayFormState = TodayMutationResult;

function revalidateHome() {
  revalidatePath("/home");
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
