import { describe, expect, it } from "vitest";
import {
  addJalaliDays,
  addJalaliMonths,
  gregorianUtcFromJalali,
  jalaliDateOnlyUtc,
  tehranDateTimeUtc,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import {
  getCalendarMonthData,
  jalaliDateKey,
  jalaliMonthRange,
  type CalendarMonthStore,
} from "@/lib/finance/calendar-month";

const USER_ID = "user_1";
const OTHER_USER_ID = "user_2";
const MONTH = { year: 1404, month: 6, day: 10 } as const;
const NOW = new Date(tehranMidnightUtc(MONTH).getTime() + 8 * 60 * 60 * 1000);

type Seed = {
  calendarEvents?: Array<{
    userId: string;
    id: string;
    title: string;
    startTime: Date;
    endTime: Date | null;
    linkedCostEstimate: bigint | null;
    source: "MANUAL" | "GOOGLE";
    isDismissed: boolean;
  }>;
  financialTasks?: Array<{
    userId: string;
    id: string;
    title: string;
    type: "BILL_DUE" | "BUDGET_CHECK" | "RECURRING_REMINDER" | "CUSTOM";
    isCompleted: boolean;
    dueDate: Date;
    sourceType: "RECURRING_TRANSACTION" | "BUDGET" | null;
  }>;
};

function unexpectedWrite(method: string) {
  return async () => {
    throw new Error(`getCalendarMonthData must not call ${method}`);
  };
}

function createStore(seed: Seed = {}): CalendarMonthStore & { reads: string[]; writes: string[] } {
  const reads: string[] = [];
  const writes: string[] = [];
  const track = (method: string) => async () => {
    writes.push(method);
    return unexpectedWrite(method)();
  };

  const store = {
    reads,
    writes,
    calendarEvent: {
      findMany: async ({
        where,
      }: {
        where: {
          userId: string;
          isDismissed: false;
          startTime: { gte: Date; lt: Date };
        };
      }) => {
        reads.push("calendarEvent.findMany");
        return (seed.calendarEvents ?? [])
          .filter(
            (event) =>
              event.userId === where.userId &&
              event.isDismissed === false &&
              event.startTime >= where.startTime.gte &&
              event.startTime < where.startTime.lt,
          )
          .sort((left, right) => left.startTime.getTime() - right.startTime.getTime())
          .map(({ id, title, startTime, endTime, linkedCostEstimate, source }) => ({
            id,
            title,
            startTime,
            endTime,
            linkedCostEstimate,
            source,
          }));
      },
      create: track("calendarEvent.create"),
      update: track("calendarEvent.update"),
      delete: track("calendarEvent.delete"),
    },
    financialTask: {
      findMany: async ({
        where,
      }: {
        where: {
          userId: string;
          dueDate: { gte: Date; lt: Date };
        };
      }) => {
        reads.push("financialTask.findMany");
        return (seed.financialTasks ?? [])
          .filter(
            (task) =>
              task.userId === where.userId &&
              task.dueDate >= where.dueDate.gte &&
              task.dueDate < where.dueDate.lt,
          )
          .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())
          .map(({ id, title, type, isCompleted, dueDate, sourceType }) => ({
            id,
            title,
            type,
            isCompleted,
            dueDate,
            sourceType,
          }));
      },
      create: track("financialTask.create"),
      update: track("financialTask.update"),
      delete: track("financialTask.delete"),
    },
  };

  return store as unknown as CalendarMonthStore & { reads: string[]; writes: string[] };
}

describe("jalaliDateKey", () => {
  it("zero-pads month and day", () => {
    expect(jalaliDateKey({ year: 1404, month: 6, day: 8 })).toBe("1404-06-08");
  });
});

describe("getCalendarMonthData", () => {
  it("buckets events and tasks by Jalali day with two queries", async () => {
    const day18 = { year: 1404, month: 6, day: 18 };
    const day19 = { year: 1404, month: 6, day: 19 };
    const store = createStore({
      calendarEvents: [
        {
          userId: USER_ID,
          id: "event_1",
          title: "قرار دکتر",
          startTime: tehranDateTimeUtc(day18, 10, 0),
          endTime: null,
          linkedCostEstimate: 250_000n,
          source: "MANUAL",
          isDismissed: false,
        },
        {
          userId: USER_ID,
          id: "event_dismissed",
          title: "ردشده",
          startTime: tehranDateTimeUtc(day18, 12, 0),
          endTime: null,
          linkedCostEstimate: null,
          source: "MANUAL",
          isDismissed: true,
        },
        {
          userId: OTHER_USER_ID,
          id: "event_other",
          title: "رویداد دیگران",
          startTime: tehranDateTimeUtc(day18, 11, 0),
          endTime: null,
          linkedCostEstimate: null,
          source: "MANUAL",
          isDismissed: false,
        },
      ],
      financialTasks: [
        {
          userId: USER_ID,
          id: "task_open",
          title: "پرداخت قبض برق",
          type: "CUSTOM",
          isCompleted: false,
          dueDate: jalaliDateOnlyUtc(day18),
          sourceType: null,
        },
        {
          userId: USER_ID,
          id: "task_done",
          title: "چک کردن بودجه غذا",
          type: "BUDGET_CHECK",
          isCompleted: true,
          dueDate: jalaliDateOnlyUtc(day18),
          sourceType: "BUDGET",
        },
        {
          userId: USER_ID,
          id: "task_next_day",
          title: "کار فردا",
          type: "CUSTOM",
          isCompleted: false,
          dueDate: jalaliDateOnlyUtc(day19),
          sourceType: null,
        },
      ],
    });

    const data = await getCalendarMonthData(USER_ID, 1404, 6, NOW, store);
    const day = data.days["1404-06-18"];

    expect(store.reads).toEqual(["calendarEvent.findMany", "financialTask.findMany"]);
    expect(store.writes).toEqual([]);
    expect(day?.events.map((event) => event.id)).toEqual(["event_1"]);
    expect(day?.events[0]?.linkedCostEstimate).toBe(250_000n);
    expect(day?.tasks.map((task) => task.id)).toEqual(["task_open", "task_done"]);
    expect(day?.tasks[0]?.isCompleted).toBe(false);
    expect(day?.tasks[1]?.isCompleted).toBe(true);
    expect(day?.tasks[1]?.sourceType).toBe("BUDGET");
    expect(data.days["1404-06-19"]?.tasks.map((task) => task.id)).toEqual(["task_next_day"]);
  });

  it("excludes the first day of the next month", async () => {
    const last = { year: 1404, month: 6, day: 31 };
    const next = addJalaliMonths({ year: 1404, month: 6, day: 1 }, 1);
    const store = createStore({
      calendarEvents: [
        {
          userId: USER_ID,
          id: "in_month",
          title: "آخر ماه",
          startTime: tehranDateTimeUtc(last, 23, 0),
          endTime: null,
          linkedCostEstimate: null,
          source: "MANUAL",
          isDismissed: false,
        },
        {
          userId: USER_ID,
          id: "next_month",
          title: "ماه بعد",
          startTime: tehranDateTimeUtc(next, 0, 30),
          endTime: null,
          linkedCostEstimate: null,
          source: "MANUAL",
          isDismissed: false,
        },
      ],
      financialTasks: [
        {
          userId: USER_ID,
          id: "task_in",
          title: "کار آخر ماه",
          type: "CUSTOM",
          isCompleted: false,
          dueDate: jalaliDateOnlyUtc(last),
          sourceType: null,
        },
        {
          userId: USER_ID,
          id: "task_next",
          title: "کار ماه بعد",
          type: "CUSTOM",
          isCompleted: false,
          dueDate: jalaliDateOnlyUtc(next),
          sourceType: null,
        },
      ],
    });

    const data = await getCalendarMonthData(USER_ID, 1404, 6, NOW, store);
    expect(Object.keys(data.days).sort()).toEqual(["1404-06-31"]);
    expect(data.days["1404-06-31"]?.events.map((event) => event.id)).toEqual(["in_month"]);
    expect(data.days["1404-06-31"]?.tasks.map((task) => task.id)).toEqual(["task_in"]);
  });

  it("marks incomplete past tasks as overdue", async () => {
    const yesterday = addJalaliDays(MONTH, -1);
    const store = createStore({
      financialTasks: [
        {
          userId: USER_ID,
          id: "overdue",
          title: "عقب‌افتاده",
          type: "CUSTOM",
          isCompleted: false,
          dueDate: jalaliDateOnlyUtc(yesterday),
          sourceType: null,
        },
        {
          userId: USER_ID,
          id: "done_yesterday",
          title: "تمام‌شده",
          type: "CUSTOM",
          isCompleted: true,
          dueDate: jalaliDateOnlyUtc(yesterday),
          sourceType: null,
        },
      ],
    });

    const data = await getCalendarMonthData(USER_ID, 1404, 6, NOW, store);
    const tasks = data.days[jalaliDateKey(yesterday)]?.tasks ?? [];
    expect(tasks.find((task) => task.id === "overdue")?.isOverdue).toBe(true);
    expect(tasks.find((task) => task.id === "done_yesterday")?.isOverdue).toBe(false);
  });
});

describe("jalaliMonthRange", () => {
  it("uses Tehran midnight for events and date-only UTC for tasks", () => {
    const range = jalaliMonthRange(1404, 6);
    expect(range.eventStart).toEqual(tehranMidnightUtc({ year: 1404, month: 6, day: 1 }));
    expect(range.eventEnd).toEqual(tehranMidnightUtc({ year: 1404, month: 7, day: 1 }));
    expect(range.taskStart).toEqual(jalaliDateOnlyUtc({ year: 1404, month: 6, day: 1 }));
    expect(range.taskEnd).toEqual(jalaliDateOnlyUtc({ year: 1404, month: 7, day: 1 }));
    expect(gregorianUtcFromJalali(range.next).getTime()).toBeGreaterThan(
      gregorianUtcFromJalali(range.start).getTime(),
    );
  });
});
