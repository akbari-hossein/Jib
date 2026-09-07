import { toLatinDigits } from "@/lib/currency/format";
import { clampJalaliDay, jalaliMonthLength, type JalaliDate } from "@/lib/dates/tehran";

export function parseTehranClock(
  raw: string,
): { hour: number; minute: number } | null {
  const latin = toLatinDigits(raw).trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(latin);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

export function formatTehranClockInput(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseJalaliForm(
  formData: FormData,
  prefix: string,
): { ok: true; value: JalaliDate | null } | { ok: false } {
  const yearRaw = toLatinDigits(String(formData.get(`${prefix}Year`) ?? "")).trim();
  const monthRaw = toLatinDigits(String(formData.get(`${prefix}Month`) ?? "")).trim();
  const dayRaw = toLatinDigits(String(formData.get(`${prefix}Day`) ?? "")).trim();

  if (!yearRaw && !monthRaw && !dayRaw) {
    return { ok: true, value: null };
  }
  if (!yearRaw || !monthRaw || !dayRaw) {
    return { ok: false };
  }

  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1300 ||
    year > 1600 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return { ok: false };
  }

  if (jalaliMonthLength(year, month) < 1) {
    return { ok: false };
  }

  return { ok: true, value: { year, month, day: clampJalaliDay(year, month, day) } };
}
