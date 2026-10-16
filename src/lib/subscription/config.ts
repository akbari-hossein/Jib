import {
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_PRICE_TOMAN,
} from "@/lib/subscription/constants";

export function getDestinationCardNumber(): string {
  return (process.env.JIB_DESTINATION_CARD_NUMBER ?? "").replace(/\s+/g, "");
}

export function getSubscriptionPriceToman(): number {
  const raw = process.env.JIB_SUBSCRIPTION_PRICE_TOMAN;
  if (!raw) {
    return SUBSCRIPTION_PRICE_TOMAN;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : SUBSCRIPTION_PRICE_TOMAN;
}

export function getSubscriptionOriginalPriceToman(): number {
  return Math.round(getSubscriptionPriceToman() / (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100));
}
