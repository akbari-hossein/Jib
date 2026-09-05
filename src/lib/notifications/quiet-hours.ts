/** True when `hour` (0–23, Tehran) falls in [start, end). Overnight ranges wrap midnight. */
export function isInQuietHours(
  hour: number,
  start: number | null | undefined,
  end: number | null | undefined,
): boolean {
  if (start == null || end == null) {
    return false;
  }
  if (start === end) {
    return false;
  }
  if (start < end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

export function clampHour(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const hour = Math.trunc(value);
  if (hour < 0) return 0;
  if (hour > 23) return 23;
  return hour;
}
