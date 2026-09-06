import { describe, expect, it } from "vitest";
import {
  accountFallbackIcon,
  isAccountColor,
  isAccountIcon,
} from "@/lib/accounts/appearance";

describe("account appearance", () => {
  it("accepts only palette colors and icons", () => {
    expect(isAccountColor("#6B7C93")).toBe(true);
    expect(isAccountColor("#ffffff")).toBe(false);
    expect(isAccountIcon("wallet")).toBe(true);
    expect(isAccountIcon("sparkles")).toBe(false);
  });

  it("falls back to a sensible icon per type", () => {
    expect(accountFallbackIcon("CARD")).toBe("credit-card");
    expect(accountFallbackIcon("SAVINGS")).toBe("piggy-bank");
    expect(accountFallbackIcon("BANK")).toBe("landmark");
  });
});
