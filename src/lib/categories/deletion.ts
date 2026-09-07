import { toPersianDigits } from "@/lib/currency/format";

export type CategoryDependents = {
  transactionCount: number;
  budgetCount: number;
  recurringCount: number;
  ruleCount: number;
};

export function categoryHasReferences(deps: CategoryDependents): boolean {
  return (
    deps.transactionCount > 0 ||
    deps.budgetCount > 0 ||
    deps.recurringCount > 0 ||
    deps.ruleCount > 0
  );
}

export function canDeleteCategory(isSystem: boolean, deps: CategoryDependents): boolean {
  return !isSystem && !categoryHasReferences(deps);
}

export function categoryDeletionCopy(
  isSystem: boolean,
  deps: CategoryDependents,
): {
  canDelete: boolean;
  title: string;
  description: string;
} {
  if (isSystem) {
    return {
      canDelete: false,
      title: "دسته‌بندی پیش‌فرض را نمی‌شود حذف کرد",
      description: "این دسته مال جیب است و تراکنش‌های قبلی به آن وصل‌اند. می‌توانی دسته‌های خودت را بسازی یا حذف کنی.",
    };
  }

  if (!categoryHasReferences(deps)) {
    return {
      canDelete: true,
      title: "دسته‌بندی حذف شود؟",
      description: "این دسته برای همیشه حذف می‌شود و قابل برگشت نیست.",
    };
  }

  const reasons: string[] = [];
  if (deps.transactionCount > 0) {
    reasons.push(`${toPersianDigits(deps.transactionCount)} تراکنش`);
  }
  if (deps.budgetCount > 0) {
    reasons.push(`${toPersianDigits(deps.budgetCount)} بودجه`);
  }
  if (deps.recurringCount > 0) {
    reasons.push(`${toPersianDigits(deps.recurringCount)} مورد تکراری`);
  }
  if (deps.ruleCount > 0) {
    reasons.push(`${toPersianDigits(deps.ruleCount)} قانون`);
  }

  return {
    canDelete: false,
    title: "این دسته‌بندی در حال استفاده است",
    description: `چون ${reasons.join(" و ")} به آن وصل است، حذفش تاریخچه مالی را ناقص می‌کند. تراکنش‌های قبلی باید همان دسته را نگه دارند.`,
  };
}
