import type { AdminAuditAction, UserRole, UserStatus } from "@prisma/client";

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  USER: "کاربر",
  ADMIN: "مدیر",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "فعال",
  DISABLED: "غیرفعال",
};

export const ADMIN_AUDIT_LABEL: Record<AdminAuditAction, string> = {
  USER_DISABLED: "غیرفعال کردن کاربر",
  USER_REACTIVATED: "فعال‌سازی دوباره کاربر",
  USER_ROLE_CHANGED: "تغییر نقش کاربر",
  USER_ONBOARDING_RESET: "بازنشانی راهنمای شروع",
  USER_DELETED: "حذف کاربر",
};

export const USER_FILTER_LABEL = {
  all: "همه کاربران",
  active: "فعال",
  disabled: "غیرفعال",
  new: "کاربران جدید",
  recently_active: "فعالیت اخیر",
  onboarding_complete: "راهنمای شروع تمام شده",
  onboarding_incomplete: "راهنمای شروع ناتمام",
  with_accounts: "با حساب",
  with_transactions: "با تراکنش",
} as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "نمای کلی" },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/transactions", label: "تراکنش‌ها" },
  { href: "/admin/accounts", label: "حساب‌ها" },
  { href: "/admin/budgets", label: "بودجه‌ها" },
  { href: "/admin/goals", label: "اهداف" },
  { href: "/admin/analytics", label: "تحلیل محصول" },
  { href: "/admin/audit", label: "گزارش اقدامات" },
  { href: "/admin/settings", label: "تنظیمات" },
] as const;
