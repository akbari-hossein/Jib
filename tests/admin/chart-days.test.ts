import { describe, expect, it } from "vitest";
import { fillTehranDailyCounts } from "@/lib/admin/chart-days";

describe("admin chart days", () => {
  it("fills missing Tehran days without shifting UTC", () => {
    const from = new Date("2026-08-31T20:30:00.000Z");
    const through = new Date("2026-09-02T20:30:00.000Z");
    const filled = fillTehranDailyCounts(
      [{ day: "2026-09-02", count: 4 }],
      from,
      through,
    );
    expect(filled.map((item) => item.key)).toEqual(["2026-09-01", "2026-09-02", "2026-09-03"]);
    expect(filled.find((item) => item.key === "2026-09-02")?.count).toBe(4);
    expect(filled.find((item) => item.key === "2026-09-01")?.count).toBe(0);
  });
});
