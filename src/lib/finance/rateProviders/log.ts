export function logRateEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined> = {},
): void {
  const payload: Record<string, string | number | boolean | null> = { event };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }
    if (/key|secret|token|authorization|password/i.test(key)) {
      continue;
    }
    payload[key] = value;
  }
  console.info(JSON.stringify(payload));
}
