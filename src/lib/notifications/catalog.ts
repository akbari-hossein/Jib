export const NOTIFICATION_RULE_KEYS = [
  "NO_TRANSACTION_TODAY",
  "BUDGET_THRESHOLD",
  "UPCOMING_RECURRING",
  "SPENDING_PACE_ANOMALY",
  "DAILY_ALLOWANCE",
  "GOAL_MILESTONE",
] as const;

export type NotificationRuleKey = (typeof NOTIFICATION_RULE_KEYS)[number];

export type NotificationRuleCatalogItem = {
  key: NotificationRuleKey;
  title: string;
  description: string;
  isActiveByDefault: boolean;
  legacyPref:
    | "budgetAlert"
    | "weeklyReview"
    | "goalMilestone"
    | "recurringDue"
    | "incomeExpected"
    | null;
};

export const NOTIFICATION_RULE_CATALOG: NotificationRuleCatalogItem[] = [
  {
    key: "NO_TRANSACTION_TODAY",
    title: "یادآوری ثبت تراکنش",
    description: "اگر معمولاً هر روز ثبت می‌کنی و تا عصر چیزی ننوشتی، یک یادآوری آرام می‌آید.",
    isActiveByDefault: true,
    legacyPref: null,
  },
  {
    key: "BUDGET_THRESHOLD",
    title: "نزدیک شدن به سقف بودجه",
    description: "وقتی مصرف یک دسته به ۷۵٪، ۹۰٪ یا ۱۰۰٪ برسد، همان ماه فقط یک‌بار برای هر آستانه خبر می‌دهد.",
    isActiveByDefault: true,
    legacyPref: "budgetAlert",
  },
  {
    key: "UPCOMING_RECURRING",
    title: "خرج تکراری نزدیک",
    description: "سه روز و یک روز مانده به موعد اجاره، قسط یا قبض، مبلغ و تاریخ را یادآوری می‌کند.",
    isActiveByDefault: true,
    legacyPref: "recurringDue",
  },
  {
    key: "SPENDING_PACE_ANOMALY",
    title: "سرعت خرج این هفته",
    description: "اگر برآورد خطی خرج این هفته بیش از حد از هفته قبل جلو بزند، یک‌بار در همان هفته می‌گوید.",
    isActiveByDefault: true,
    legacyPref: "weeklyReview",
  },
  {
    key: "DAILY_ALLOWANCE",
    title: "سهم امروز",
    description: "در ساعتی که انتخاب می‌کنی، سهم باقی‌مانده امروز را یادآوری می‌کند.",
    isActiveByDefault: false,
    legacyPref: "incomeExpected",
  },
  {
    key: "GOAL_MILESTONE",
    title: "رسیدن به مرحله هدف",
    description: "در ۲۵٪، ۵۰٪، ۷۵٪ و ۱۰۰٪ پیشرفت هر هدف، یک‌بار تبریک می‌گوید.",
    isActiveByDefault: true,
    legacyPref: "goalMilestone",
  },
];

export function isNotificationRuleKey(value: string): value is NotificationRuleKey {
  return (NOTIFICATION_RULE_KEYS as readonly string[]).includes(value);
}
