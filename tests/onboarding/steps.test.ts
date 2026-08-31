import { describe, expect, it } from "vitest";
import { ONBOARDING_STEPS } from "@/features/onboarding/steps";

describe("onboarding steps", () => {
  it("stays short and covers the core product surfaces", () => {
    expect(ONBOARDING_STEPS).toHaveLength(7);
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual([
      "welcome",
      "dashboard",
      "accounts",
      "transactions",
      "budgets",
      "goals",
      "start",
    ]);
  });

  it("walks real app routes instead of a standalone tutorial", () => {
    const hrefs = new Set(ONBOARDING_STEPS.map((step) => step.href));
    expect(hrefs).toEqual(new Set(["/home", "/accounts", "/transactions", "/budgets", "/goals"]));
    expect(ONBOARDING_STEPS[0]?.layout).toBe("welcome");
    expect(ONBOARDING_STEPS.at(-1)?.layout).toBe("finish");
    expect(ONBOARDING_STEPS.at(-1)?.href).toBe("/accounts");
  });
});
