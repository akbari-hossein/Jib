import { describe, expect, it } from "vitest";
import {
  parseAmountInput,
  parseDateInput,
  parseEnum,
  parsePage,
  parseSearchQuery,
  userFilterWhere,
  userSearchWhere,
  USER_FILTERS,
} from "@/lib/admin/params";

describe("admin query params", () => {
  it("clamps pagination", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("2")).toBe(2);
    expect(parsePage(["3"])).toBe(3);
    expect(parsePage("nope")).toBe(1);
  });

  it("accepts only known filters", () => {
    expect(parseEnum("active", USER_FILTERS, "all")).toBe("active");
    expect(parseEnum("hacked", USER_FILTERS, "all")).toBe("all");
  });

  it("trims search and ignores empty queries", () => {
    expect(parseSearchQuery("  ali@jib.app  ")).toBe("ali@jib.app");
    expect(userSearchWhere("")).toBeUndefined();
    expect(userSearchWhere("ali")).toMatchObject({
      OR: expect.arrayContaining([{ email: { contains: "ali", mode: "insensitive" } }]),
    });
  });

  it("builds server-side user filters", () => {
    const now = new Date("2026-09-02T12:00:00.000Z");
    expect(userFilterWhere("disabled", now)).toEqual({ status: "DISABLED" });
    expect(userFilterWhere("onboarding_incomplete", now)).toEqual({
      onboardingCompletedAt: null,
    });
    expect(userFilterWhere("with_accounts", now)).toEqual({ accounts: { some: {} } });
    expect(userFilterWhere("new", now).createdAt).toEqual({
      gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    });
  });

  it("parses dates and amounts conservatively", () => {
    expect(parseDateInput("2026-09-02")?.toISOString()).toBe("2026-09-02T00:00:00.000Z");
    expect(parseDateInput("09/02/2026")).toBeUndefined();
    expect(parseAmountInput("12000")).toBe(12000n);
    expect(parseAmountInput("-1")).toBeUndefined();
    expect(parseAmountInput("12.5")).toBeUndefined();
  });
});
