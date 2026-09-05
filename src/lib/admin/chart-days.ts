import { toGregorian } from "jalaali-js";
import {
  addJalaliDays,
  compareJalaliDate,
  getTehranJalaliDate,
  type JalaliDate,
} from "@/lib/dates/tehran";

function jalaliToGregorianKey(date: JalaliDate): string {
  const gregorian = toGregorian(date.year, date.month, date.day);
  return `${gregorian.gy}-${String(gregorian.gm).padStart(2, "0")}-${String(gregorian.gd).padStart(2, "0")}`;
}

export function fillTehranDailyCounts(
  rows: Array<{ day: string; count: number }>,
  from: Date,
  through: Date,
) {
  const byKey = new Map(rows.map((row) => [row.day, row.count]));
  const days: Array<{ key: string; count: number }> = [];
  let cursor = getTehranJalaliDate(from);
  const end = getTehranJalaliDate(through);

  while (compareJalaliDate(cursor, end) <= 0) {
    const key = jalaliToGregorianKey(cursor);
    days.push({ key, count: byKey.get(key) ?? 0 });
    cursor = addJalaliDays(cursor, 1);
  }

  return days;
}
