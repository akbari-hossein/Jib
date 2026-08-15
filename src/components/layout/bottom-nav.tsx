"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, List, MoreHorizontal, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "خانه", icon: House },
  { href: "/transactions", label: "تراکنش‌ها", icon: List },
  { href: "/budgets", label: "بودجه", icon: Wallet },
  { href: "/goals", label: "اهداف", icon: Target },
  { href: "/more", label: "بیشتر", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="منوی اصلی"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors duration-150",
                  active ? "text-primary" : "text-foreground/45 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
