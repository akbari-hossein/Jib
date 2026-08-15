import { CategoryGroup, CategoryKind } from "@prisma/client";

export const SYSTEM_CATEGORIES = [
  { name: "اجاره", group: CategoryGroup.ESSENTIAL, kind: CategoryKind.EXPENSE, icon: "home" },
  { name: "قبض", group: CategoryGroup.ESSENTIAL, kind: CategoryKind.EXPENSE, icon: "zap" },
  { name: "قسط", group: CategoryGroup.ESSENTIAL, kind: CategoryKind.EXPENSE, icon: "landmark" },
  { name: "بیمه", group: CategoryGroup.ESSENTIAL, kind: CategoryKind.EXPENSE, icon: "shield" },
  { name: "غذا", group: CategoryGroup.LIVING, kind: CategoryKind.EXPENSE, icon: "utensils" },
  { name: "خرید", group: CategoryGroup.LIVING, kind: CategoryKind.EXPENSE, icon: "shopping-bag" },
  { name: "حمل‌ونقل", group: CategoryGroup.LIVING, kind: CategoryKind.EXPENSE, icon: "car" },
  { name: "سلامت", group: CategoryGroup.LIVING, kind: CategoryKind.EXPENSE, icon: "heart-pulse" },
  { name: "آموزش", group: CategoryGroup.LIVING, kind: CategoryKind.EXPENSE, icon: "graduation-cap" },
  { name: "تفریح", group: CategoryGroup.LIFESTYLE, kind: CategoryKind.EXPENSE, icon: "sparkles" },
  { name: "سفر", group: CategoryGroup.LIFESTYLE, kind: CategoryKind.EXPENSE, icon: "plane" },
  { name: "اشتراک‌ها", group: CategoryGroup.LIFESTYLE, kind: CategoryKind.EXPENSE, icon: "repeat" },
  { name: "سرگرمی", group: CategoryGroup.LIFESTYLE, kind: CategoryKind.EXPENSE, icon: "clapperboard" },
  { name: "پس‌انداز", group: CategoryGroup.FINANCIAL, kind: CategoryKind.EXPENSE, icon: "piggy-bank" },
  { name: "سرمایه‌گذاری", group: CategoryGroup.FINANCIAL, kind: CategoryKind.EXPENSE, icon: "trending-up" },
  { name: "حقوق", group: CategoryGroup.FINANCIAL, kind: CategoryKind.INCOME, icon: "wallet" },
  { name: "پروژه", group: CategoryGroup.FINANCIAL, kind: CategoryKind.INCOME, icon: "briefcase" },
  { name: "هدیه", group: CategoryGroup.FINANCIAL, kind: CategoryKind.INCOME, icon: "gift" },
  { name: "سایر درآمد", group: CategoryGroup.FINANCIAL, kind: CategoryKind.INCOME, icon: "plus-circle" },
] as const;
