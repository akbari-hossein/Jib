import { describe, expect, it } from "vitest";
import {
  SUBSCRIPTION_ORIGINAL_PRICE_TOMAN,
  SUBSCRIPTION_PRICE_TOMAN,
} from "@/lib/subscription/constants";
import { paymentInstructionsCopy } from "@/lib/subscription/copy";

describe("subscription discount pricing", () => {
  it("sets the monthly price to exactly half the original price", () => {
    expect(SUBSCRIPTION_PRICE_TOMAN).toBe(99_000);
    expect(SUBSCRIPTION_ORIGINAL_PRICE_TOMAN).toBe(198_000);
    expect(SUBSCRIPTION_PRICE_TOMAN * 2).toBe(SUBSCRIPTION_ORIGINAL_PRICE_TOMAN);
  });

  it("shows the discounted amount and original amount in payment instructions", () => {
    const discountedInstructions = paymentInstructionsCopy(SUBSCRIPTION_PRICE_TOMAN);
    expect(discountedInstructions).toContain("۹۹٬۰۰۰ تومان");
    expect(discountedInstructions).toContain("۱۹۸٬۰۰۰ تومان");
    expect(discountedInstructions).toContain("۵۰٪ تخفیف");
  });

  it("keeps payment instructions accurate for subscriptions with an older price", () => {
    const existingPriceInstructions = paymentInstructionsCopy(59_000);
    expect(existingPriceInstructions).toContain("۵۹٬۰۰۰ تومان");
    expect(existingPriceInstructions).not.toContain("۱۹۸٬۰۰۰ تومان");
  });
});
