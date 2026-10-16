"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, List, MoreHorizontal, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const BOTTOM_NAV_ITEMS = [
  { href: "/home", label: "خانه", icon: House },
  { href: "/dang", label: "دنگ", icon: Users },
  { href: "/goals", label: "اهداف", icon: Target },
  { href: "/transactions", label: "تراکنش‌ها", icon: List },
  { href: "/more", label: "بیشتر", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="منوی اصلی"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
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
