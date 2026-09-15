export const REJECTION_REASON_CODES = [
  "AMOUNT_MISMATCH",
  "UNREADABLE",
  "WRONG_DESTINATION",
  "DUPLICATE",
  "OTHER",
] as const;

export type RejectionReasonCode = (typeof REJECTION_REASON_CODES)[number];

export const REJECTION_REASON_COPY: Record<RejectionReasonCode, string> = {
  AMOUNT_MISMATCH: "مبلغ رسید با مبلغ اشتراک (۵۹,۰۰۰ تومان) مطابقت ندارد.",
  UNREADABLE: "رسید ارسالی خوانا نیست. لطفاً دوباره تلاش کن.",
  WRONG_DESTINATION: "رسید به شماره کارت جیب واریز نشده است.",
  DUPLICATE: "این رسید قبلاً برای یک اشتراک دیگر ثبت شده است.",
  OTHER: "رسید تایید نشد. لطفاً با پشتیبانی در تماس باش.",
};

export function isRejectionReasonCode(value: string): value is RejectionReasonCode {
  return (REJECTION_REASON_CODES as readonly string[]).includes(value);
}
