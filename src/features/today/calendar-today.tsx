"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { AddCalendarEvent } from "@/features/today/add-calendar-event";
import { formatToman } from "@/lib/currency/format";
import { formatTehranTime, type JalaliDate } from "@/lib/dates/tehran";
import { dismissCalendarEvent } from "@/server/actions/today";

export type TodayCalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  hasLinkedCost: boolean;
  linkedCostEstimate: string | null;
};

export function CalendarToday({
  events,
  defaultDate,
  defaultTime,
}: {
  events: TodayCalendarEvent[];
  defaultDate: JalaliDate;
  defaultTime: string;
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const visible = events.filter((event) => !hiddenIds.includes(event.id));

  function dismiss(eventId: string) {
    setHiddenIds((ids) => [...ids, eventId]);
    setPendingId(eventId);
    startTransition(async () => {
      const result = await dismissCalendarEvent(eventId);
      setPendingId(null);
      if (!result.ok) {
        setHiddenIds((ids) => ids.filter((id) => id !== eventId));
        toast.error(result.error ?? "ذخیره نشد. دوباره تلاش کن.");
      }
    });
  }

  return (
    <Card className="min-w-0 flex-1 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">تقویم امروز</p>
        <AddCalendarEvent defaultDate={defaultDate} defaultTime={defaultTime} />
      </div>
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">رویدادی برای امروز نیست.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {visible.map((event) => (
            <li key={event.id} className="min-w-0">
              <p className="truncate text-sm font-medium">{event.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatTehranTime(new Date(event.startTime))}
                {event.hasLinkedCost && event.linkedCostEstimate
                  ? ` · ${formatToman(BigInt(event.linkedCostEstimate))}`
                  : ""}
              </p>
              <button
                type="button"
                className="mt-1 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
                disabled={pendingId === event.id}
                onClick={() => dismiss(event.id)}
              >
                رد کردن
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
