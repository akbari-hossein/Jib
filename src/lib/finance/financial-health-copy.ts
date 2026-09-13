import { toPersianDigits } from "@/lib/currency/format";

export type ScoreTrend = "up" | "down" | "flat" | "new";

export const SCORE_COMPONENT_LABEL = {
  savingsRate: "نرخ پس‌انداز",
  budgetAdherence: "پایبندی به بودجه",
  spendingConsistency: "ثبات خرج",
  emergencyFundCoverage: "پوشش اضطراری",
  debtBurden: "فشار قسط",
} as const;

export const HEALTH_SCORE_COPY = {
  title: "امتیاز مالی",
  emptyTitle: "امتیاز مالی هنوز آماده نیست",
  emptyDescription:
    "برای محاسبه امتیاز مالیت به یک ماه کامل داده نیاز داریم. بعد از اولین ماه فعالیت، اینجا جمع می‌شود.",
  missingData: "هنوز داده کافی نیست — بعد از ماه اول کامل برگرد.",
  share: "اشتراک‌گذاری",
  shareTitle: "اشتراک‌گذاری امتیاز مالی",
  shareDescription: "فقط امتیاز و روند روی کارت می‌آید. عدد حساب و درآمد روی کارت نیست.",
  includeHighlight: "نمایش نکتهٔ اصلی",
  includeHighlightHint: "خاموش یعنی فقط امتیاز؛ روشن یعنی یک جملهٔ کوتاه از دلیل تغییر.",
  story: "استوری",
  square: "پست",
  download: "دانلود عکس",
  sharing: "در حال ساخت عکس...",
  shareFailed: "ساخت عکس انجام نشد. دوباره تلاش کن.",
  saved: "عکس ذخیره شد.",
  thisQuarter: "این فصل",
  sinceLastMonth: "نسبت به ماه قبل",
  widgetPending: "بعد از ماه اول ساخته می‌شود",
  openScore: "مشاهده امتیاز",
  breakdown: "جزئیات امتیاز",
  trendTitle: "روند امتیاز",
  trendEmpty: "هنوز ماه‌های کافی برای دیدن روند امتیاز نیست.",
} as const;

export const GUILT_PHRASES = [
  "امتیازت پایینه",
  "خیلی بد",
  "بد عمل",
  "داری بد",
  "ضعیف",
  "شکست",
  "خراب",
  "افتضاح",
  "تنبل",
  "نمی‌تونی",
  "باید بهتر",
  "اخطار",
  "وضعیت خطر",
  "زنجیر",
  "استریک",
  "پشت سر هم",
  "روز متوالی",
  "نشکن",
  "از دست نده",
  "don't break",
  "streak",
] as const;

function pct(value: number): string {
  return `${toPersianDigits(Math.round(value))}٪`;
}

function pts(value: number): string {
  return toPersianDigits(Math.abs(Math.round(value)));
}

function monthsText(months: number): string {
  const rounded = Math.round(months * 10) / 10;
  if (Number.isInteger(rounded)) {
    return toPersianDigits(rounded);
  }
  return toPersianDigits(String(rounded).replace(".", "٫"));
}

export function missingScoreExplanation(
  key: keyof typeof SCORE_COMPONENT_LABEL,
): string {
  if (key === "savingsRate") {
    return "برای نرخ پس‌انداز، درآمد این دوره را ثبت کن.";
  }
  if (key === "budgetAdherence") {
    return "هنوز بودجه‌ای برای این ماه تنظیم نشده.";
  }
  if (key === "spendingConsistency") {
    return "برای دیدن ثبات خرج، به چند ماه ثبت نیاز داریم.";
  }
  if (key === "emergencyFundCoverage") {
    return "خرج ضروری این دوره مشخص نیست؛ پوشش اضطراری بعد از آن محاسبه می‌شود.";
  }
  return "برای این بخش به درآمد ثبت‌شده نیاز داریم.";
}

export function savingsRateExplanation(rate: number, previous?: number): string {
  if (previous != null && previous !== rate) {
    if (rate > previous) {
      return `نرخ پس‌اندازت از ${pct(previous)} به ${pct(rate)} رسیده.`;
    }
    return `نرخ پس‌انداز این دوره ${pct(rate)} است؛ دوره قبل ${pct(previous)} بود.`;
  }
  if (rate <= 0) {
    return "این دوره خرجت به اندازه درآمدت بوده یا بیشتر. نرخ از خودِ درآمد و هزینه ساخته می‌شود.";
  }
  return `نرخ پس‌انداز این دوره ${pct(rate)} است.`;
}

export function budgetAdherenceExplanation(score: number): string {
  if (score >= 90) {
    return "بودجه‌های فعال بیشتر زیر سقف مانده‌اند.";
  }
  if (score >= 70) {
    return "بخشی از بودجه‌ها به سقف نزدیک شده یا کمی از آن رد شده.";
  }
  return "میانگین وزنی مصرف بودجه‌ها نسبت به سقف‌شان این عدد را ساخته.";
}

export function spendingConsistencyExplanation(score: number): string {
  if (score >= 80) {
    return "خرج ماهانه‌ات در این چند ماه نسبتاً یکنواخت بوده.";
  }
  if (score >= 50) {
    return "خرج ماه‌ها کمی با هم فرق داشته؛ این بخش همان نوسان را نشان می‌دهد.";
  }
  return "خرج ماه‌ها با هم فرق بیشتری داشته. عدد فقط نوسان را گزارش می‌کند.";
}

export function emergencyFundExplanation(months: number): string {
  if (months <= 0) {
    return "هنوز پوشش جداگانه‌ای برای خرج ضروری کنار گذاشته نشده.";
  }
  if (months >= 3) {
    return `پس‌انداز کنارگذاشته‌ات حدود ${monthsText(months)} ماه از خرج ضروری را پوشش می‌دهد.`;
  }
  return `پس‌انداز کنارگذاشته‌ات حدود ${monthsText(months)} ماه از خرج ضروری را پوشش می‌دهد.`;
}

export function debtBurdenExplanation(dtiPct: number): string {
  if (dtiPct <= 0) {
    return "قسط یا پرداخت بدهی تکرارشونده‌ای نسبت به درآمد این دوره ثبت نشده.";
  }
  return `پرداخت‌های تکراری بدهی حدود ${pct(dtiPct)} از درآمد این دوره است.`;
}

type HeroExplanationInput = {
  kind: "hero";
  totalScore: number;
  previousTotalScore: number | null;
  trend: ScoreTrend;
  scoreDelta: number | null;
  driver: {
    key: keyof typeof SCORE_COMPONENT_LABEL;
    rawValue?: number;
    previousValue?: number;
    score: number;
    previousScore?: number;
  } | null;
};

type EmptyExplanationInput = { kind: "empty" };

export type ScoreExplanationInput = HeroExplanationInput | EmptyExplanationInput;

export function formatScoreExplanation(input: ScoreExplanationInput): string {
  if (input.kind === "empty") {
    return HEALTH_SCORE_COPY.emptyDescription;
  }

  const driverLine = driverSentence(input);
  if (driverLine) {
    return driverLine;
  }

  if (input.trend === "up" && input.scoreDelta != null && input.scoreDelta > 0) {
    return `امتیازت نسبت به ماه قبل ${pts(input.scoreDelta)} واحد بالا رفته.`;
  }
  if (input.trend === "down" && input.scoreDelta != null && input.scoreDelta < 0) {
    return `امتیازت نسبت به ماه قبل ${pts(input.scoreDelta)} واحد کمتر شده.`;
  }
  if (input.trend === "flat") {
    return "امتیازت نسبت به ماه قبل تغییری نکرده.";
  }
  return `امتیاز مالیت ${toPersianDigits(input.totalScore)} است.`;
}

function driverSentence(input: HeroExplanationInput): string | null {
  const driver = input.driver;
  if (!driver) {
    return null;
  }

  if (driver.key === "savingsRate" && driver.rawValue != null && driver.previousValue != null) {
    if (driver.rawValue > driver.previousValue) {
      return `امتیازت به خاطر افزایش نرخ پس‌انداز از ${pct(driver.previousValue)} به ${pct(driver.rawValue)} بالا رفت.`;
    }
    if (driver.rawValue < driver.previousValue) {
      return `امتیاز این دوره بیشتر از تغییر نرخ پس‌انداز اثر گرفته؛ از ${pct(driver.previousValue)} به ${pct(driver.rawValue)} رسیده.`;
    }
  }

  const label = SCORE_COMPONENT_LABEL[driver.key];
  if (input.trend === "up") {
    return `امتیازت بیشتر به خاطر ${label} بالا رفته.`;
  }
  if (input.trend === "down") {
    return `امتیاز این دوره بیشتر تحت تأثیر ${label} بوده.`;
  }
  return `بخش اصلی این امتیاز، ${label} است.`;
}

export function scoreDeltaCopy(delta: number | null, trend: ScoreTrend): string {
  if (trend === "new" || delta == null) {
    return "اولین دورهٔ قابل محاسبه";
  }
  if (trend === "flat" || delta === 0) {
    return "مثل ماه قبل";
  }
  if (trend === "up") {
    return `${pts(delta)} واحد بالاتر از ماه قبل`;
  }
  return `${pts(delta)} واحد کمتر از ماه قبل`;
}

export function shareHighlightCopy(input: {
  driverKey: keyof typeof SCORE_COMPONENT_LABEL;
  rawValue?: number;
  previousValue?: number;
}): string | null {
  if (input.driverKey === "savingsRate" && input.rawValue != null && input.previousValue != null) {
    const diff = input.rawValue - input.previousValue;
    if (diff === 0) {
      return null;
    }
    if (diff > 0) {
      return `نرخ پس‌انداز ${pct(diff)} بیشتر شده`;
    }
    return `نرخ پس‌انداز ${pct(-diff)} کمتر شده`;
  }
  return SCORE_COMPONENT_LABEL[input.driverKey];
}
