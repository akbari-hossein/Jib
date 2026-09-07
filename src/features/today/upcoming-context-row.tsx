import { Card } from "@/components/ui/card";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import {
  formatJalaliDay,
  formatTehranTime,
  getTehranJalaliDate,
  jalaliFromInstant,
} from "@/lib/dates/tehran";
import type { CalendarEventSummary, UpcomingFinancialEvent } from "@/lib/finance/today-summary";

function eventWhenLabel(event: UpcomingFinancialEvent): string {
  if (event.urgency === "today") return "امروز";
  if (event.urgency === "tomorrow") return "فردا";
  return formatJalaliDay(jalaliFromInstant(event.date), getTehranJalaliDate());
}

function UpcomingFinancialEventCard({ event }: { event: UpcomingFinancialEvent }) {
  return (
    <Card className="min-w-0 flex-1 px-4 py-4">
      <p className="text-xs text-muted-foreground">{eventWhenLabel(event)}</p>
      <p className="mt-2 truncate text-sm font-medium">{event.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{formatToman(event.amount)}</p>
    </Card>
  );
}

function CalendarEventsCard({ events }: { events: CalendarEventSummary[] }) {
  const next = events[0];
  return (
    <Card className="min-w-0 flex-1 px-4 py-4">
      <p className="text-xs text-muted-foreground">تقویم امروز</p>
      <p className="mt-2 text-sm font-medium">
        {events.length === 1 ? next.title : `${toPersianDigits(events.length)} رویداد`}
      </p>
      {next ? (
        <p className="mt-1 text-sm text-muted-foreground">{formatTehranTime(next.startTime)}</p>
      ) : null}
    </Card>
  );
}

export function UpcomingContextRow({
  events,
  calendarEvents,
}: {
  events: UpcomingFinancialEvent[];
  calendarEvents: CalendarEventSummary[];
}) {
  const nearest = events[0] ?? null;
  const hasCalendar = calendarEvents.length > 0;
  if (!nearest && !hasCalendar) {
    return null;
  }

  const both = Boolean(nearest && hasCalendar);

  return (
    <div className={both ? "grid grid-cols-2 gap-3 md:flex" : "grid grid-cols-1"}>
      {nearest ? <UpcomingFinancialEventCard event={nearest} /> : null}
      {hasCalendar ? <CalendarEventsCard events={calendarEvents} /> : null}
    </div>
  );
}
