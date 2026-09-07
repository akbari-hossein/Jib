export const CATEGORY_ICONS = [
  "home",
  "zap",
  "landmark",
  "shield",
  "utensils",
  "shopping-bag",
  "car",
  "heart-pulse",
  "graduation-cap",
  "sparkles",
  "plane",
  "repeat",
  "clapperboard",
  "piggy-bank",
  "trending-up",
  "wallet",
  "briefcase",
  "gift",
  "plus-circle",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_LABEL: Record<CategoryIconName, string> = {
  home: "خانه",
  zap: "قبض",
  landmark: "بانک",
  shield: "بیمه",
  utensils: "غذا",
  "shopping-bag": "خرید",
  car: "حمل‌ونقل",
  "heart-pulse": "سلامت",
  "graduation-cap": "آموزش",
  sparkles: "تفریح",
  plane: "سفر",
  repeat: "اشتراک",
  clapperboard: "سرگرمی",
  "piggy-bank": "پس‌انداز",
  "trending-up": "سرمایه",
  wallet: "حقوق",
  briefcase: "کار",
  gift: "هدیه",
  "plus-circle": "سایر",
};

const ICON_SET = new Set<string>(CATEGORY_ICONS);

export function isCategoryIcon(value: string): value is CategoryIconName {
  return ICON_SET.has(value);
}

export function defaultCategoryIcon(kind: "EXPENSE" | "INCOME"): CategoryIconName {
  return kind === "INCOME" ? "plus-circle" : "sparkles";
}
