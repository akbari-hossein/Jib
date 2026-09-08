import type {
  CalendarEventSource,
  CheckInMood,
  FinancialTaskSource,
  FinancialTaskType,
} from "@prisma/client";
import {
  addJalaliMonths,
  compareJalaliDate,
  getTehranJalaliDate,
  jalaliDateOnlyUtc,
  jalaliFromInstant,
  tehranMidnightUtc,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import type { CalendarEventSummary, FinancialTaskSummary } from "@/lib/finance/today-summary";

export type CalendarMonthEvent = CalendarEventSummary & {
  source: CalendarEventSource;
};

export type CalendarMonthTask = FinancialTaskSummary & {
  sourceType: FinancialTaskSource | null;
};

export interface CalendarMonthDay {
  events: CalendarMonthEvent[];
  tasks: CalendarMonthTask[];
  mood: CheckInMood | null;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  days: Record<string, CalendarMonthDay>;
}

export function jalaliDateKey(date: JalaliDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

type CalendarRow = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  linkedCostEstimate: bigint | null;
  source: CalendarEventSource;
};

type TaskRow = {
  id: string;
  title: string;
  type: FinancialTaskType;
  isCompleted: boolean;
  dueDate: Date;
  sourceType: FinancialTaskSource | null;
};

type CheckInRow = {
  date: Date;
  mood: CheckInMood;
};

export type CalendarMonthStore = {
  calendarEvent: {
    findMany: (args: {
      where: {
        userId: string;
        isDismissed: false;
        startTime: { gte: Date; lt: Date };
      };
      orderBy: { startTime: "asc" };
      select: {
        id: true;
        title: true;
        startTime: true;
        endTime: true;
        linkedCostEstimate: true;
        source: true;
      };
    }) => Promise<CalendarRow[]>;
  };
  financialTask: {
    findMany: (args: {
      where: {
        userId: string;
        dueDate: { gte: Date; lt: Date };
      };
      orderBy: { dueDate: "asc" };
      select: {
        id: true;
        title: true;
        type: true;
        isCompleted: true;
        dueDate: true;
        sourceType: true;
      };
    }) => Promise<TaskRow[]>;
  };
  dailyCheckIn: {
    findMany: (args: {
      where: {
        userId: string;
        date: { gte: Date; lt: Date };
      };
      select: {
        date: true;
        mood: true;
      };
    }) => Promise<CheckInRow[]>;
  };
};

function emptyDay(): CalendarMonthDay {
  return { events: [], tasks: [], mood: null };
}

function dayBucket(days: Record<string, CalendarMonthDay>, date: JalaliDate): CalendarMonthDay {
  const key = jalaliDateKey(date);
  const existing = days[key];
  if (existing) {
    return existing;
  }
  const created = emptyDay();
  days[key] = created;
  return created;
}

export function jalaliMonthRange(year: number, month: number): {
  start: JalaliDate;
  next: JalaliDate;
  eventStart: Date;
  eventEnd: Date;
  taskStart: Date;
  taskEnd: Date;
} {
  const start = { year, month, day: 1 };
  const next = addJalaliMonths(start, 1);
  return {
    start,
    next,
    eventStart: tehranMidnightUtc(start),
    eventEnd: tehranMidnightUtc(next),
    taskStart: jalaliDateOnlyUtc(start),
    taskEnd: jalaliDateOnlyUtc(next),
  };
}

export async function getCalendarMonthData(
  userId: string,
  year: number,
  month: number,
  now: Date = new Date(),
  store: CalendarMonthStore = prisma as unknown as CalendarMonthStore,
): Promise<CalendarMonthData> {
  const range = jalaliMonthRange(year, month);
  const today = getTehranJalaliDate(now);

  const [events, tasks, checkIns] = await Promise.all([
    store.calendarEvent.findMany({
      where: {
        userId,
        isDismissed: false,
        startTime: { gte: range.eventStart, lt: range.eventEnd },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        linkedCostEstimate: true,
        source: true,
      },
    }),
    store.financialTask.findMany({
      where: {
        userId,
        dueDate: { gte: range.taskStart, lt: range.taskEnd },
      },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        isCompleted: true,
        dueDate: true,
        sourceType: true,
      },
    }),
    store.dailyCheckIn.findMany({
      where: {
        userId,
        date: { gte: range.taskStart, lt: range.taskEnd },
      },
      select: {
        date: true,
        mood: true,
      },
    }),
  ]);

  const days: Record<string, CalendarMonthDay> = {};

  for (const event of events) {
    const day = jalaliFromInstant(event.startTime);
    if (day.year !== year || day.month !== month) {
      continue;
    }
    dayBucket(days, day).events.push({
      id: event.id,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      hasLinkedCost: event.linkedCostEstimate != null,
      linkedCostEstimate: event.linkedCostEstimate,
      source: event.source,
    });
  }

  for (const task of tasks) {
    const day = jalaliFromInstant(task.dueDate);
    if (day.year !== year || day.month !== month) {
      continue;
    }
    dayBucket(days, day).tasks.push({
      id: task.id,
      title: task.title,
      type: task.type,
      isCompleted: task.isCompleted,
      dueDate: task.dueDate,
      isOverdue: !task.isCompleted && compareJalaliDate(day, today) < 0,
      sourceType: task.sourceType,
    });
  }

  for (const checkIn of checkIns) {
    const day = jalaliFromInstant(checkIn.date);
    if (day.year !== year || day.month !== month) {
      continue;
    }
    dayBucket(days, day).mood = checkIn.mood;
  }

  return { year, month, days };
}
