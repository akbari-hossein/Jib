import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_PRICE_TOMAN,
} from "@/lib/subscription/constants";
import { getSubscriptionOriginalPriceToman, getSubscriptionPriceToman } from "@/lib/subscription/config";
import { paymentInstructionsCopy } from "@/lib/subscription/copy";
import { softwareApplicationJsonLd } from "@/lib/seo/json-ld";

describe("subscription discount pricing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sets the monthly price to exactly half the original price", () => {
    expect(SUBSCRIPTION_PRICE_TOMAN).toBe(99_000);
    expect(SUBSCRIPTION_DISCOUNT_PERCENT).toBe(50);
    expect(getSubscriptionOriginalPriceToman()).toBe(198_000);
    expect(getSubscriptionPriceToman() * 2).toBe(getSubscriptionOriginalPriceToman());
  });

  it("shows the discounted amount and original amount in payment instructions", () => {
    const discountedInstructions = paymentInstructionsCopy(
      SUBSCRIPTION_PRICE_TOMAN,
      getSubscriptionOriginalPriceToman(),
    );
    expect(discountedInstructions).toContain("۹۹٬۰۰۰ تومان");
    expect(discountedInstructions).toContain("۱۹۸٬۰۰۰ تومان");
    expect(discountedInstructions).toContain("۵۰٪ تخفیف");
  });

  it("keeps payment instructions accurate for subscriptions with an older price", () => {
    const existingPriceInstructions = paymentInstructionsCopy(59_000, null);
    expect(existingPriceInstructions).toContain("۵۹٬۰۰۰ تومان");
    expect(existingPriceInstructions).not.toContain("۱۹۸٬۰۰۰ تومان");
  });

  it("derives the current and list prices from one environment variable", () => {
    vi.stubEnv("JIB_SUBSCRIPTION_PRICE_TOMAN", "125000");

    expect(getSubscriptionPriceToman()).toBe(125_000);
    expect(getSubscriptionOriginalPriceToman()).toBe(250_000);
    expect(
      paymentInstructionsCopy(getSubscriptionPriceToman(), getSubscriptionOriginalPriceToman()),
    ).toContain("۲۵۰٬۰۰۰ تومان");
    const offer = softwareApplicationJsonLd().offers;
    expect(offer.price).toBe("125000");
    expect(offer.description).toContain("۲۵۰٬۰۰۰ تومان");
  });
});
