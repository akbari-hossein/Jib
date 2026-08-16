export type MonthlyChange = {
  pct: number | null;
  direction: "up" | "down" | "flat" | "new";
};

export function calculateMonthlyChange(
  current: bigint,
  previous: bigint,
): MonthlyChange {
  if (previous <= 0n) {
    return { pct: null, direction: "new" };
  }

  if (current === previous) {
    return { pct: 0, direction: "flat" };
  }

  const diff = current > previous ? current - previous : previous - current;
  const pct = Number((diff * 100n) / previous);

  return {
    pct,
    direction: current > previous ? "up" : "down",
  };
}
