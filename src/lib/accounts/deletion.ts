import { toPersianDigits } from "@/lib/currency/format";

export type AccountDependents = {
  transactionCount: number;
  recurringCount: number;
  goalCount: number;
};

export function canPermanentlyDeleteAccount(deps: AccountDependents): boolean {
  return deps.transactionCount === 0 && deps.recurringCount === 0;
}

export function accountDeletionCopy(deps: AccountDependents): {
  canDelete: boolean;
  title: string;
  description: string;
} {
  const canDelete = canPermanentlyDeleteAccount(deps);

  if (canDelete) {
    const goalNote =
      deps.goalCount > 0
        ? ` ${toPersianDigits(deps.goalCount)} هدف وصل‌شده از این حساب جدا می‌شود.`
        : "";
    return {
      canDelete: true,
      title: "حساب حذف شود؟",
      description: `این حساب برای همیشه حذف می‌شود و قابل برگشت نیست.${goalNote}`,
    };
  }

  const reasons: string[] = [];
  if (deps.transactionCount > 0) {
    reasons.push(`${toPersianDigits(deps.transactionCount)} تراکنش`);
  }
  if (deps.recurringCount > 0) {
    reasons.push(`${toPersianDigits(deps.recurringCount)} مورد تکراری`);
  }

  return {
    canDelete: false,
    title: "این حساب را نمی‌شود حذف کرد",
    description: `چون ${reasons.join(" و ")} به آن وصل است، حذف تاریخچه مالی را به‌هم می‌ریزد. می‌توانی بایگانی‌اش کنی تا از قابل‌خرج و حساب‌های فعال خارج شود، ولی تراکنش‌ها بمانند.`,
  };
}
