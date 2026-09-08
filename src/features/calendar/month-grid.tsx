"use client";

import { toPersianDigits } from "@/lib/currency/format";
import {
  addJalaliDays,
  isSameJalaliDay,
  jalaliMonthLength,
  jalaliWeekStart,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { jalaliDateKey } from "@/lib/finance/calendar-month";
import { JALALI_WEEKDAY_SHORT } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CalendarDayItems } from "@/server/actions/calendar";

function monthCells(year: number, month: number): (JalaliDate | null)[] {
  const first = { year, month, day: 1 };
  const start = jalaliWeekStart(first);
  const length = jalaliMonthLength(year, month);
  const cells: (JalaliDate | null)[] = [];
  let cursor = start;
  for (let index = 0; index < 42; index += 1) {
    const inMonth = cursor.year === year && cursor.month === month && cursor.day <= length;
    cells.push(inMonth ? cursor : null);
    cursor = addJalaliDays(cursor, 1);
  }
  return cells;
}

export function MonthGrid({
  year,
  month,
  today,
  selected,
  days,
  onSelect,
}: {
  year: number;
  month: number;
  today: JalaliDate;
  selected: JalaliDate;
  days: Record<string, CalendarDayItems>;
  onSelect: (day: JalaliDate) => void;
}) {
  const cells = monthCells(year, month);

  return (
    <div>
      <div className="grid grid-cols-7">
        {JALALI_WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          const key = jalaliDateKey(day);
          const items = days[key];
          const hasEvents = (items?.events.length ?? 0) > 0;
          const hasTasks = (items?.tasks.length ?? 0) > 0;
          const isToday = isSameJalaliDay(day, today);
          const isSelected = isSameJalaliDay(day, selected);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={toPersianDigits(day.day)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-primary/10 ring-1 ring-inset ring-primary/45"
                    : "hover:bg-surface-muted",
              )}
            >
              <span className="numeric-display leading-none">{toPersianDigits(day.day)}</span>
              {hasEvents || hasTasks ? (
                <span className="mt-1 flex items-center justify-center gap-0.5">
                  {hasEvents ? (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary",
                      )}
                    />
                  ) : null}
                  {hasTasks ? <span className="size-1.5 rounded-full bg-warning" /> : null}
                </span>
              ) : (
                <span className="mt-1 h-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
