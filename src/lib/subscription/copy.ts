import type { SubscriptionStatus } from "@prisma/client";
import { formatToman } from "@/lib/currency/format";
import { REJECTION_REASON_COPY, type RejectionReasonCode } from "@/lib/subscription/rejection-reasons";

export const SUBSCRIPTION_COPY = {
  trialThreeDaysLeft: "۳ روز دیگه از دورهٔ آزمایشی رایگانت باقی مونده.",
  trialOneDayLeft: "فردا دورهٔ آزمایشی رایگانت تموم می‌شه.",
  receiptPending: "رسیدت دریافت شد و داره بررسی می‌شه. معمولاً این کار چند ساعت طول می‌کشه.",
  resubmitReceipt: "ارسال دوبارهٔ رسید",
  readOnly:
    "برای ثبت تراکنش یا تغییر بودجه، لازمه اشتراکت رو فعال کنی. اطلاعات قبلیت همچنان قابل مشاهده‌ست.",
  duplicatePending: "رسیدت در حال بررسی است. تا نتیجه بررسی، رسید جدید نمی‌تونی بفرستی.",
  activateCta: "فعال کردن اشتراک",
  renewCta: "تمدید اشتراک",
  copyCard: "کپی شماره کارت",
  cardCopied: "شماره کارت کپی شد.",
  uploadImage: "آپلود عکس رسید",
  pasteText: "چسباندن متن رسید",
  submitReceipt: "ارسال رسید",
  claimedAmount: "مبلغ واریزی (اختیاری)",
  claimedDate: "تاریخ واریز (اختیاری)",
  pendingExists: "یک رسید در حال بررسی داری.",
  upgradeTitle: "اشتراک جیب",
  statusCardTitle: "اشتراک",
} as const;

export function trialExpiredCopy(priceToman: number): string {
  return `دورهٔ آزمایشی رایگان تموم شده. برای ادامهٔ استفاده از جیب، اشتراک ماهانه (${formatToman(BigInt(priceToman))}) رو فعال کن.`;
}

export function paymentInstructionsCopy(priceToman: number, originalPriceToman: number | null): string {
  const amount = formatToman(BigInt(priceToman));
  const discount = originalPriceToman
    ? ` (با ۵۰٪ تخفیف از ${formatToman(BigInt(originalPriceToman))})`
    : "";
  return `مبلغ ${amount}${discount} رو به شمارهٔ کارت زیر واریز کن و بعد رسیدشو (عکس یا متن) اینجا بفرست.`;
}

export function trialReminderCopy(daysRemaining: number): string | null {
  if (daysRemaining === 3) {
    return SUBSCRIPTION_COPY.trialThreeDaysLeft;
  }
  if (daysRemaining === 1) {
    return SUBSCRIPTION_COPY.trialOneDayLeft;
  }
  return null;
}

export function approvedCopy(jalaliDate: string): string {
  return `اشتراکت فعال شد. تا ${jalaliDate} از همهٔ امکانات جیب استفاده کن.`;
}

export function rejectionCopy(reasonCode: string | null): string {
  if (reasonCode && reasonCode in REJECTION_REASON_COPY) {
    return REJECTION_REASON_COPY[reasonCode as RejectionReasonCode];
  }
  return REJECTION_REASON_COPY.OTHER;
}

export function writeBlockedCopy(status: SubscriptionStatus): string {
  if (status === "PENDING_REVIEW") {
    return SUBSCRIPTION_COPY.receiptPending;
  }
  return SUBSCRIPTION_COPY.readOnly;
}
