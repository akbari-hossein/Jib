"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  admin: "نمای کلی",
  dashboard: "اشتراک",
  users: "کاربران",
  transactions: "تراکنش‌ها",
  accounts: "حساب‌ها",
  budgets: "بودجه‌ها",
  goals: "اهداف",
  analytics: "تحلیل محصول",
  audit: "گزارش اقدامات",
  settings: "تنظیمات",
  receipts: "رسیدها",
};

export function AdminBreadcrumbs({ current }: { current?: string }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => {
    const href = `/${parts.slice(0, index + 1).join("/")}`;
    const isLast = index === parts.length - 1;
    const label = isLast && current ? current : (LABELS[part] ?? "جزئیات");
    return { href, label, isLast };
  });

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="مسیر صفحه" className="mb-4 text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 ? <span className="text-border">/</span> : null}
            {crumb.isLast ? (
              <span className="text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
