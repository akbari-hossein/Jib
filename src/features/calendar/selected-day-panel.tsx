"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AddItemForm } from "@/features/calendar/add-item-form";
import { Button } from "@/components/ui/button";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { formatTehranTime, jalaliWeekdayIndex, type JalaliDate } from "@/lib/dates/tehran";
import {
  CHECK_IN_MOOD_DAY_LABEL,
  JALALI_MONTHS,
  JALALI_WEEKDAYS,
  MOOD_EMOJI,
  TRANSACTION_TYPE_LABEL,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  deleteCalendarEvent,
  deleteCustomFinancialTask,
  type CalendarDayItems,
  type CalendarEventItem,
  type CalendarTaskItem,
} from "@/server/actions/calendar";
import { setFinancialTaskCompleted } from "@/server/actions/today";

function formatDayHeading(date: JalaliDate, today: JalaliDate): string {
  const weekday = JALALI_WEEKDAYS[jalaliWeekdayIndex(date)] ?? "";
  const month = JALALI_MONTHS[date.month - 1] ?? "";
  const day = toPersianDigits(date.day);
  if (date.year !== today.year) {
    return `${weekday}، ${day} ${month} ${toPersianDigits(date.year)}`;
  }
  return `${weekday}، ${day} ${month}`;
}

export function SelectedDayPanel({
  day,
  today,
  items,
  onChanged,
}: {
  day: JalaliDate;
  today: JalaliDate;
  items: CalendarDayItems;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const income = BigInt(items.totals.income);
  const expense = BigInt(items.totals.expense);
  const hasTotals = income !== 0n || expense !== 0n;
  const empty = items.events.length === 0 && items.tasks.length === 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-sm font-medium">{formatDayHeading(day, today)}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 shrink-0 px-3 text-primary"
          onClick={() => setAdding((open) => !open)}
        >
          {adding ? (
            "بستن"
          ) : (
            <>
              <Plus className="size-4" />
              افزودن
            </>
          )}
        </Button>
      </div>
      {items.holiday ? (
        <p className="text-sm text-muted-foreground">{items.holiday.title}</p>
      ) : null}
      {hasTotals ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{TRANSACTION_TYPE_LABEL.INCOME}</p>
            <p className="numeric-display mt-0.5 text-sm font-semibold text-income">
              +{formatToman(income, { withUnit: false })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{TRANSACTION_TYPE_LABEL.EXPENSE}</p>
            <p className="numeric-display mt-0.5 text-sm font-semibold text-expense">
              −{formatToman(expense, { withUnit: false })}
            </p>
          </div>
        </div>
      ) : null}
      {items.mood ? (
        <p className="text-sm text-muted-foreground">
          <span aria-hidden>{MOOD_EMOJI[items.mood]}</span> {CHECK_IN_MOOD_DAY_LABEL[items.mood]}
        </p>
      ) : null}
      {adding ? (
        <AddItemForm
          day={day}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            onChanged();
          }}
        />
      ) : null}
      {empty && !adding && !items.mood && !hasTotals ? (
        <p className="text-sm text-muted-foreground">چیزی برای این روز ثبت نشده</p>
      ) : null}
      {items.events.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs text-muted-foreground">رویدادها</h3>
          <ul className="overflow-hidden rounded-3xl border border-border bg-card">
            {items.events.map((event) => (
              <CalendarEventRow key={event.id} event={event} onDeleted={onChanged} />
            ))}
          </ul>
        </div>
      ) : null}
      {items.tasks.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs text-muted-foreground">کارهای مالی</h3>
          <ul className="overflow-hidden rounded-3xl border border-border bg-card">
            {items.tasks.map((task) => (
              <FinancialTaskRow key={task.id} task={task} onChanged={onChanged} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CalendarEventRow({
  event,
  onDeleted,
}: {
  event: CalendarEventItem;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const cost = event.linkedCostEstimate ? formatToman(BigInt(event.linkedCostEstimate)) : null;

  function remove() {
    startTransition(async () => {
      const result = await deleteCalendarEvent(event.id);
      if (!result.ok) {
        toast.error(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
        return;
      }
      onDeleted();
    });
  }

  return (
    <li className="flex items-start justify-between gap-3 px-4 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {event.title}
          {cost ? <span className="ms-2 font-normal text-muted-foreground">{cost}</span> : null}
          <span className="ms-2 font-normal numeric-display text-muted-foreground">
            — {formatTehranTime(new Date(event.startTime))}
          </span>
        </p>
      </div>
      {event.source === "MANUAL" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-foreground/40"
          disabled={pending}
          onClick={remove}
        >
          حذف
        </Button>
      ) : null}
    </li>
  );
}

function FinancialTaskRow({
  task,
  onChanged,
}: {
  task: CalendarTaskItem;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const checkboxId = `calendar-task-${task.id}`;
  const canDelete = task.type === "CUSTOM" && task.sourceType == null;

  function toggle() {
    startTransition(async () => {
      const result = await setFinancialTaskCompleted(task.id, !task.isCompleted);
      if (!result.ok) {
        toast.error(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
        return;
      }
      onChanged();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteCustomFinancialTask(task.id);
      if (!result.ok) {
        toast.error(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
        return;
      }
      onChanged();
    });
  }

  return (
    <li
      className={cn(
        "border-s-2",
        task.isOverdue ? "border-s-warning" : "border-s-transparent",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <input
          id={checkboxId}
          type="checkbox"
          checked={task.isCompleted}
          disabled={pending}
          onChange={toggle}
          className="size-4 shrink-0 rounded border-border accent-primary"
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            "min-w-0 flex-1 text-sm leading-6",
            task.isCompleted && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </label>
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-foreground/40"
            disabled={pending}
            onClick={remove}
          >
            حذف
          </Button>
        ) : null}
      </div>
    </li>
  );
}
