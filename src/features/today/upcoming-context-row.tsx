import { Card } from "@/components/ui/card";
import { formatToman } from "@/lib/currency/format";
import {
  formatJalaliDay,
  getTehranJalaliDate,
  jalaliFromInstant,
} from "@/lib/dates/tehran";
import type { UpcomingFinancialEvent } from "@/lib/finance/today-summary";

function eventWhenLabel(event: UpcomingFinancialEvent): string {
  if (event.urgency === "today") return "امروز";
  if (event.urgency === "tomorrow") return "فردا";
  return formatJalaliDay(jalaliFromInstant(event.date), getTehranJalaliDate());
}

export function UpcomingFinancialEventCard({ event }: { event: UpcomingFinancialEvent }) {
  return (
    <Card className="min-w-0 flex-1 px-4 py-4">
      <p className="text-xs text-muted-foreground">{eventWhenLabel(event)}</p>
      <p className="mt-2 truncate text-sm font-medium">{event.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{formatToman(event.amount)}</p>
    </Card>
  );
}
