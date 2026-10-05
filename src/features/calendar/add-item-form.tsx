"use client";

import { useState, useTransition } from "react";
import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTehranClockInput } from "@/lib/dates/jalali-form";
import { getTehranGregorianDate, type JalaliDate } from "@/lib/dates/tehran";
import { createCalendarEvent } from "@/server/actions/today";

export function AddItemForm({
  day,
  onCreated,
  onCancel,
}: {
  day: JalaliDate;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const clock = getTehranGregorianDate();
  const defaultTime = formatTehranClockInput(clock.hour, clock.minute);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createCalendarEvent(undefined, formData);
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
      key={`${day.year}-${day.month}-${day.day}`}
      action={submit}
      className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4"
    >
      <input type="hidden" name="dateYear" value={day.year} />
      <input type="hidden" name="dateMonth" value={day.month} />
      <input type="hidden" name="dateDay" value={day.day} />
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
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="flex min-w-0 flex-col gap-2">
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
        <div className="flex min-w-0 flex-col gap-2">
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
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="h-12 min-w-0 flex-1">
          {pending ? "در حال ذخیره…" : "ثبت رویداد"}
        </Button>
        <Button type="button" variant="ghost" className="h-12 px-4" onClick={onCancel}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
