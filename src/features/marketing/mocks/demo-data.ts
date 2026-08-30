export const DEMO_LABEL = "نمونه نمایشی";

export const DEMO = {
  greeting: "عصر بخیر سارا",
  available: 8_420_000n,
  today: 480_000n,
  remainingDays: 13,
  monthlySpent: 7_800_000n,
  monthlyIncome: 25_000_000n,
  monthlySaved: 4_200_000n,
  foodSpent: 2_800_000n,
  foodLimit: 4_000_000n,
  foodPct: 70,
  transportSpent: 1_100_000n,
  transportLimit: 2_000_000n,
  transportPct: 55,
  goalName: "مک‌بوک",
  goalCurrent: 60_000_000n,
  goalTarget: 150_000_000n,
  goalPct: 40,
  goalMonthly: 10_000_000n,
  goalMonthsLeft: 9,
  reviewChange: 8,
  transactions: [
    { name: "ناهار", merchant: "کافه نشون", amount: 285_000n, type: "EXPENSE" as const },
    { name: "اسنپ", merchant: "سفر", amount: 92_000n, type: "EXPENSE" as const },
    { name: "پروژه فریلنس", merchant: "واریز", amount: 6_500_000n, type: "INCOME" as const },
  ],
} as const;
