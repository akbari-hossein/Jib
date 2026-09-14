import { toPersianDigits } from "@/lib/currency/format";

export const EMERGENCY_FUND_COPY = {
  name: "صندوق اضطراری",
  setupIntro: "صندوق اضطراری یعنی پس‌اندازی برای پوشش هزینه‌های ضروری در صورت قطع درآمد.",
  targetLabel: "این صندوق باید چند ماه هزینه‌ی تو رو پوشش بده؟",
  categoryLabel: "کدام دسته‌ها را «ضروری» در نظر می‌گیری؟",
  progressLabel: "٪ تکمیل‌شده",
  categoryDisclosure: "دسته‌های محاسبه‌شده به‌عنوان «ضروری»",
  insufficientData:
    "برای محاسبه‌ی دقیق‌تر، به حداقل ۳ ماه تاریخچه‌ی تراکنش نیاز است. عدد فعلی بر اساس داده‌ی محدودتری تخمین زده شده.",
  insufficientDataShort: "برای محاسبه‌ی دقیق‌تر، به حداقل ۳ ماه تاریخچه‌ی تراکنش نیاز است.",
  notSaving: "در حال حاضر نرخ پس‌انداز مثبتی ثبت نشده تا بتوان زمان رسیدن به هدف را تخمین زد.",
  noSavingsData: "در حال حاضر نرخ پس‌انداز مثبتی ثبت نشده تا بتوان زمان رسیدن به هدف را تخمین زد.",
  estimateLabel: "برآورد ماهانه‌ی هزینه‌ی ضروری",
  estimateHint: "اگر تاریخچه هنوز کم است، می‌توانی یک برآورد وارد کنی. این عدد جدا از تراکنش‌ها نگه داشته می‌شود.",
  estimateUsed: "عدد فعلی بر اساس برآورد دستی است، نه میانگین تراکنش‌ها.",
  currentAmountLabel: "الان چقدر برای این صندوق کنار گذاشتی؟",
  customMonths: "دلخواه",
  customMonthsLabel: "تعداد ماه (۱ تا ۲۴)",
  waitForHistory: "می‌توانی بدون برآورد ادامه بدهی؛ عدد با داده‌ی فعلی محاسبه می‌شود.",
  save: "ذخیره صندوق اضطراری",
  saveChanges: "ذخیره تغییرات",
  setupCta: "تنظیم صندوق اضطراری",
  openDetail: "جزئیات",
  editSettings: "ویرایش تنظیمات",
  reached: "مبلغ فعلی به هدف رسیده.",
  archive: "بایگانی",
} as const;

export function monthPresetLabel(months: number): string {
  return `${toPersianDigits(months)} ماه`;
}

export function forecastCopy(months: number): string {
  return `با نرخ پس‌انداز فعلی، حدود ${toPersianDigits(months)} ماه دیگر به این هدف می‌رسی.`;
}

export function targetCoverageCopy(months: number): string {
  return `هدف: پوشش ${toPersianDigits(months)} ماه هزینه‌ی ضروری`;
}

export function averageBasisCopy(averageLabel: string, monthsUsed: number, usingEstimate: boolean): string {
  if (usingEstimate) {
    return `بر اساس برآورد دستی ${averageLabel} هزینه‌ی ضروری در ماه`;
  }
  return `بر اساس میانگین ${averageLabel} هزینه‌ی ضروری در ماه`;
}

export function recentAverageCopy(monthsUsed: number): string {
  if (monthsUsed <= 0) {
    return "هنوز ماه کاملی از هزینه‌ی ضروری ثبت نشده.";
  }
  return `(میانگین ${toPersianDigits(monthsUsed)} ماه اخیر)`;
}
