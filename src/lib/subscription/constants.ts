export const TRIAL_DAYS = 7;
export const PERIOD_DAYS = 30;
export const SUBSCRIPTION_PRICE_TOMAN = 99_000;
export const SUBSCRIPTION_DISCOUNT_PERCENT = 50;
export const MAX_RECEIPT_TEXT_LENGTH = 2000;
export const MIN_RECEIPT_TEXT_LENGTH = 5;
export const MAX_RECEIPT_IMAGE_BYTES = 4 * 1024 * 1024;
export const RECEIPT_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const RECEIPT_IMAGE_KEY_PREFIX = "jib-receipt:";
export const DAY_MS = 24 * 60 * 60 * 1000;

export type ReceiptImageMimeType = (typeof RECEIPT_IMAGE_MIME_TYPES)[number];
