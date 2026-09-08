"use client";

import { useState } from "react";
import { toPersianDigits } from "@/lib/currency/format";
import type { JalaliDate } from "@/lib/dates/tehran";
import { JALALI_MONTHS } from "@/lib/labels";
import { MonthCalendarModal } from "@/features/calendar/month-calendar-modal";

function formatJalaliHeaderDate(date: JalaliDate): string {
  const month = JALALI_MONTHS[date.month - 1] ?? "";
  return `${toPersianDigits(date.day)} ${month} ${toPersianDigits(date.year)}`;
}

export function TodayDateHeader({ today }: { today: JalaliDate }) {
  const [open, setOpen] = useState(false);
  const [instance, setInstance] = useState(0);
  const label = formatJalaliHeaderDate(today);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInstance((value) => value + 1);
          setOpen(true);
        }}
        aria-label={`تقویم، ${label}`}
        className="numeric-display inline-flex h-11 max-w-full items-center rounded-full bg-surface-muted px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-border/80 hover:text-foreground"
      >
        <span className="truncate">{label}</span>
      </button>
      <MonthCalendarModal
        key={instance}
        open={open}
        onOpenChange={setOpen}
        today={today}
      />
    </>
  );
}
