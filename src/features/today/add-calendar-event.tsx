"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { MoneyInput } from "@/components/money/money-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JalaliDate } from "@/lib/dates/tehran";
import { createCalendarEvent } from "@/server/actions/today";

export function AddCalendarEvent({
  defaultDate,
  defaultTime,
}: {
  defaultDate: JalaliDate;
  defaultTime: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
    }
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createCalendarEvent(undefined, formData);
      if (result.ok) {
        setOpen(false);
        setError(null);
        return;
      }
      setError(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
    });
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      shouldScaleBackground={false}
      repositionInputs={false}
    >
      <Drawer.Trigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-11 px-3 text-primary">
          افزودن رویداد
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[min(92dvh,100svh)] max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <Drawer.Title className="px-5 text-base font-semibold">رویداد تقویم</Drawer.Title>
          <form
            key={String(open)}
            action={submit}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="calendar-title">عنوان</Label>
              <Input id="calendar-title" name="title" required maxLength={80} placeholder="مثلاً دندانپزشکی" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>تاریخ</Label>
              <JalaliDateFields
                prefix="date"
                defaultValue={defaultDate}
                minYear={defaultDate.year}
                maxYear={defaultDate.year + 1}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="calendar-start">شروع</Label>
                <Input
                  id="calendar-start"
                  name="startTime"
                  type="time"
                  required
                  defaultValue={defaultTime}
                  dir="ltr"
                  className="numeric-display"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="calendar-end">پایان (اختیاری)</Label>
                <Input
                  id="calendar-end"
                  name="endTime"
                  type="time"
                  dir="ltr"
                  className="numeric-display"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="calendar-cost">هزینه احتمالی (اختیاری)</Label>
              <MoneyInput id="calendar-cost" name="linkedCostEstimate" />
              <p className="text-xs text-muted-foreground">
                فقط مبلغی که خودت می‌نویسی. جیب از عنوان هزینه نمی‌سازد.
              </p>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "در حال ذخیره…" : "ثبت رویداد"}
            </Button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
