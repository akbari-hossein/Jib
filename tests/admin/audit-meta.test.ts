import { describe, expect, it } from "vitest";
import { sanitizeAuditMetadata } from "@/lib/admin/audit-meta";
import { countTrend, formatCount } from "@/lib/admin/format";

describe("admin audit metadata", () => {
  it("drops secrets and keeps operational fields", () => {
    expect(
      sanitizeAuditMetadata({
        from: "ACTIVE",
        to: "DISABLED",
        password: "secret",
        tokenHash: "abc",
        amount: 12n,
      }),
    ).toEqual({
      from: "ACTIVE",
      to: "DISABLED",
      amount: "12",
    });
  });
});

describe("admin number formatting", () => {
  it("formats counts in Persian digits", () => {
    expect(formatCount(12420)).toContain("۱۲");
  });

  it("computes trends without fabricating a percentage from zero", () => {
    expect(countTrend(8, 0)).toEqual({ pct: null, direction: "new" });
    expect(countTrend(8, 8)).toEqual({ pct: 0, direction: "flat" });
    expect(countTrend(12, 10).direction).toBe("up");
  });
});
