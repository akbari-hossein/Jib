import { describe, expect, it } from "vitest";
import { canCreate, hasFeature, isPro, limitFor } from "@/lib/billing/plan";

describe("plan access", () => {
  it("treats Free as limited and Pro as open", () => {
    expect(isPro("FREE")).toBe(false);
    expect(isPro("PRO")).toBe(true);
    expect(limitFor("FREE", "accounts")).toBe(3);
    expect(limitFor("PRO", "accounts")).toBeNull();
  });

  it("blocks the next create at the Free cap", () => {
    expect(canCreate("FREE", "accounts", 2)).toBe(true);
    expect(canCreate("FREE", "accounts", 3)).toBe(false);
    expect(canCreate("PRO", "accounts", 30)).toBe(true);
  });

  it("keeps Pro-only features off Free", () => {
    expect(hasFeature("FREE", "recurring")).toBe(false);
    expect(hasFeature("FREE", "export")).toBe(false);
    expect(hasFeature("PRO", "overallBudget")).toBe(true);
  });
});
