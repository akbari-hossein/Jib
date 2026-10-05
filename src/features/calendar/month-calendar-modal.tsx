"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Drawer } from "vaul";
import { MonthGrid } from "@/features/calendar/month-grid";
import { SelectedDayPanel } from "@/features/calendar/selected-day-panel";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/currency/format";
import { addJalaliMonths, type JalaliDate } from "@/lib/dates/tehran";
import { jalaliDateKey } from "@/lib/finance/calendar-month";
import { JALALI_MONTHS } from "@/lib/labels";
import {
  loadCalendarMonth,
  type CalendarDayItems,
  type CalendarMonthPayload,
} from "@/server/actions/calendar";

const EMPTY_DAY: CalendarDayItems = {
  events: [],
  totals: { income: "0", expense: "0" },
  holiday: null,
};

export function MonthCalendarModal({
  open,
  onOpenChange,
  today,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  today: JalaliDate;
}) {
  const [view, setView] = useState<JalaliDate>({ year: today.year, month: today.month, day: 1 });
  const [selected, setSelected] = useState<JalaliDate>(today);
  const [payload, setPayload] = useState<CalendarMonthPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    const year = view.year;
    const month = view.month;
    let cancelled = false;
    startTransition(async () => {
      const result = await loadCalendarMonth(year, month);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLoadError(result.error ?? "بارگذاری تقویم انجام نشد. دوباره تلاش کن.");
        return;
      }
      setLoadError(null);
      setPayload(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, reloadToken, startTransition, view.month, view.year]);

  function goToMonth(next: JalaliDate) {
    const monthStart = { year: next.year, month: next.month, day: 1 };
    setView(monthStart);
    if (next.year === today.year && next.month === today.month) {
      setSelected(today);
    } else {
      setSelected(monthStart);
    }
  }

  const monthLabel = `${JALALI_MONTHS[view.month - 1] ?? ""} ${toPersianDigits(view.year)}`;
  const selectedItems = useMemo(() => {
    if (!payload || payload.year !== view.year || payload.month !== view.month) {
      return EMPTY_DAY;
    }
    return payload.days[jalaliDateKey(selected)] ?? EMPTY_DAY;
  }, [payload, selected, view.month, view.year]);

  const showingCurrentMonth = payload?.year === view.year && payload?.month === view.month;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[min(92dvh,100svh)] max-h-[min(92dvh,100svh)] max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <Drawer.Title className="sr-only">تقویم ماه</Drawer.Title>
          <div className="flex items-center justify-between gap-3 px-5 pb-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="ماه قبل"
              onClick={() => goToMonth(addJalaliMonths(view, -1))}
            >
              <ChevronRight className="size-5" />
            </Button>
            <button
              type="button"
              className="min-h-11 min-w-0 flex-1 truncate rounded-xl px-2 text-center text-sm font-medium hover:bg-surface-muted"
              aria-label="بازگشت به ماه جاری"
              onClick={() => goToMonth(today)}
            >
              {monthLabel}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label="ماه بعد"
              onClick={() => goToMonth(addJalaliMonths(view, 1))}
            >
              <ChevronLeft className="size-5" />
            </Button>
          </div>
          <div className="px-5">
            <MonthGrid
              year={view.year}
              month={view.month}
              today={today}
              selected={selected}
              days={showingCurrentMonth ? payload?.days ?? {} : {}}
              onSelect={setSelected}
            />
          </div>
          {loadError ? (
            <p role="alert" className="px-5 pt-3 text-sm text-destructive">
              {loadError}
            </p>
          ) : null}
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {pending && !showingCurrentMonth ? (
              <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
            ) : (
              <SelectedDayPanel
                day={selected}
                today={today}
                items={selectedItems}
                onChanged={() => setReloadToken((token) => token + 1)}
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
