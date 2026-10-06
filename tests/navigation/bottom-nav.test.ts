import { describe, expect, it } from "vitest";
import { BOTTOM_NAV_ITEMS } from "@/components/layout/bottom-nav";

describe("bottom navigation", () => {
  it("keeps the requested order and destinations", () => {
    expect(BOTTOM_NAV_ITEMS.map(({ href, label }) => [label, href])).toEqual([
      ["خانه", "/home"],
      ["دنگ", "/dang"],
      ["اهداف", "/goals"],
      ["تراکنش‌ها", "/transactions"],
      ["بیشتر", "/more"],
    ]);
  });
});
