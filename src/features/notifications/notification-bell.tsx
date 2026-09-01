"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/currency/format";

export function NotificationBell({
  unreadCount,
  className,
}: {
  unreadCount: number;
  className?: string;
}) {
  const label = unreadCount > 0 ? `اعلان‌ها، ${toPersianDigits(unreadCount)} خوانده‌نشده` : "اعلان‌ها";

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-2xl bg-surface-muted text-foreground transition-colors hover:bg-border/80",
        className,
      )}
    >
      <Bell className="size-[18px]" strokeWidth={1.8} />
      {unreadCount > 0 ? (
        <span className="absolute top-1.5 end-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground">
          {toPersianDigits(unreadCount > 9 ? "۹+" : unreadCount)}
        </span>
      ) : null}
    </Link>
  );
}
