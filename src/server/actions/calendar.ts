"use server";

import type { CalendarEventSource, FinancialTaskSource, FinancialTaskType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getCalendarMonthData } from "@/lib/finance/calendar-month";
import {
  assertCalendarEventOwned,
  assertFinancialTaskOwned,
  userFacingMutationError,
} from "@/server/services/ownership";
import { prisma } from "@/lib/db/prisma";

export type CalendarMutationResult = {
  ok: boolean;
  error?: string;
};

export type CalendarEventItem = {
  id: string;
  title: string;
  startTime: string;
  linkedCostEstimate: string | null;
  source: CalendarEventSource;
};

export type CalendarTaskItem = {
  id: string;
  title: string;
  type: FinancialTaskType;
  isCompleted: boolean;
  isOverdue: boolean;
  sourceType: FinancialTaskSource | null;
};

export type CalendarDayItems = {
  events: CalendarEventItem[];
  tasks: CalendarTaskItem[];
};

export type CalendarMonthPayload = {
  year: number;
  month: number;
  days: Record<string, CalendarDayItems>;
};

export type LoadCalendarMonthResult =
  | { ok: true; data: CalendarMonthPayload }
  | { ok: false; error: string };

function revalidateCalendar() {
  revalidatePath("/home");
}

export async function loadCalendarMonth(
  year: number,
  month: number,
): Promise<LoadCalendarMonthResult> {
  const user = await requireUser();

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1300 ||
    year > 1600 ||
    month < 1 ||
    month > 12
  ) {
    return { ok: false, error: "تاریخ معتبر نیست." };
  }

  try {
    const data = await getCalendarMonthData(user.id, year, month);
    const days: Record<string, CalendarDayItems> = {};
    for (const [key, day] of Object.entries(data.days)) {
      days[key] = {
        events: day.events.map((event) => ({
          id: event.id,
          title: event.title,
          startTime: event.startTime.toISOString(),
          linkedCostEstimate: event.linkedCostEstimate?.toString() ?? null,
          source: event.source,
        })),
        tasks: day.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          type: task.type,
          isCompleted: task.isCompleted,
          isOverdue: task.isOverdue,
          sourceType: task.sourceType,
        })),
      };
    }
    return { ok: true, data: { year: data.year, month: data.month, days } };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "بارگذاری تقویم انجام نشد. دوباره تلاش کن."),
    };
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<CalendarMutationResult> {
  const user = await requireUser();

  try {
    const event = await assertCalendarEventOwned(user.id, eventId);
    if (event.source !== "MANUAL") {
      return { ok: false, error: "این مورد در دسترس نیست." };
    }
    await prisma.calendarEvent.delete({ where: { id: event.id } });
    revalidateCalendar();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}

export async function deleteCustomFinancialTask(taskId: string): Promise<CalendarMutationResult> {
  const user = await requireUser();

  try {
    const task = await assertFinancialTaskOwned(user.id, taskId);
    if (task.type !== "CUSTOM" || task.sourceType != null) {
      return { ok: false, error: "این مورد در دسترس نیست." };
    }
    await prisma.financialTask.delete({ where: { id: task.id } });
    revalidateCalendar();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}
