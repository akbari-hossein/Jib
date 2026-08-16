import type { Plan } from "@prisma/client";

export type LimitedResource = "accounts" | "goals" | "budgetCategories";
export type ProFeature = "recurring" | "export" | "overallBudget";

export const FREE_LIMITS: Record<LimitedResource, number> = {
  accounts: 3,
  goals: 2,
  budgetCategories: 3,
};

export function isPro(plan: Plan): boolean {
  return plan === "PRO";
}

export function limitFor(plan: Plan, resource: LimitedResource): number | null {
  if (isPro(plan)) {
    return null;
  }
  return FREE_LIMITS[resource];
}

export function canCreate(plan: Plan, resource: LimitedResource, currentCount: number): boolean {
  const limit = limitFor(plan, resource);
  return limit == null || currentCount < limit;
}

const PRO_FEATURES: readonly ProFeature[] = ["recurring", "export", "overallBudget"];

export function hasFeature(plan: Plan, feature: ProFeature): boolean {
  return isPro(plan) && PRO_FEATURES.includes(feature);
}

export function canSelfServePro(): boolean {
  return process.env.NODE_ENV === "development" || process.env.PRO_SELF_SERVE === "true";
}

export function limitCopy(resource: LimitedResource): string {
  switch (resource) {
    case "accounts":
      return "در نسخه رایگان تا ۳ حساب فعال می‌توانی داشته باشی.";
    case "goals":
      return "در نسخه رایگان تا ۲ هدف می‌توانی داشته باشی.";
    case "budgetCategories":
      return "در نسخه رایگان تا ۳ سقف دسته می‌توانی بگذاری.";
  }
}

export function featureCopy(feature: ProFeature): string {
  switch (feature) {
    case "recurring":
      return "خرج و درآمد تکراری در نسخه حرفه‌ای است.";
    case "export":
      return "خروجی گرفتن در نسخه حرفه‌ای است.";
    case "overallBudget":
      return "سقف کل ماه در نسخه حرفه‌ای است.";
  }
}
