"use client";

import { useState, useTransition } from "react";
import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTehranClockInput } from "@/lib/dates/jalali-form";
import { getTehranGregorianDate, type JalaliDate } from "@/lib/dates/tehran";
import { cn } from "@/lib/utils";
import { createCalendarEvent, createCustomFinancialTask } from "@/server/actions/today";

const KINDS = [
  { id: "event", label: "رویداد" },
  { id: "task", label: "کار مالی" },
] as const;

type ItemKind = (typeof KINDS)[number]["id"];

export function AddItemForm({
  day,
  onCreated,
  onCancel,
}: {
  day: JalaliDate;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<ItemKind>("event");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const clock = getTehranGregorianDate();
  const defaultTime = formatTehranClockInput(clock.hour, clock.minute);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result =
        kind === "event"
          ? await createCalendarEvent(undefined, formData)
          : await createCustomFinancialTask(undefined, formData);
      if (result.ok) {
        setError(null);
        onCreated();
        return;
      }
      setError(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
    });
  }

  return (
    <form
      key={`${kind}-${day.year}-${day.month}-${day.day}`}
      action={submit}
      className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4"
    >
      <div className="flex gap-2">
        {KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setKind(item.id);
              setError(null);
            }}
            className={cn(
              "h-9 rounded-full px-3 text-sm transition-colors",
              kind === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface-muted text-foreground/70",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <input type="hidden" name={kind === "event" ? "dateYear" : "dueYear"} value={day.year} />
      <input type="hidden" name={kind === "event" ? "dateMonth" : "dueMonth"} value={day.month} />
      <input type="hidden" name={kind === "event" ? "dateDay" : "dueDay"} value={day.day} />
      {kind === "event" ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="calendar-month-title">عنوان</Label>
            <Input
              id="calendar-month-title"
              name="title"
              required
              maxLength={80}
              placeholder="مثلاً دندانپزشکی"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="calendar-month-start">شروع</Label>
              <Input
                id="calendar-month-start"
                name="startTime"
                type="time"
                required
                defaultValue={defaultTime}
                dir="ltr"
                className="numeric-display"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="calendar-month-end">پایان (اختیاری)</Label>
              <Input
                id="calendar-month-end"
                name="endTime"
                type="time"
                dir="ltr"
                className="numeric-display"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="calendar-month-cost">هزینه احتمالی (اختیاری)</Label>
            <MoneyInput id="calendar-month-cost" name="linkedCostEstimate" />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="calendar-month-task">عنوان</Label>
          <Input
            id="calendar-month-task"
            name="title"
            required
            maxLength={80}
            placeholder="مثلاً پرداخت قبض"
          />
        </div>
      )}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? "در حال ذخیره…" : kind === "event" ? "ثبت رویداد" : "ثبت کار"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
