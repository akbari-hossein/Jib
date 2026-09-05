"use client";

import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions/notifications";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { formatJalaliDay, getTehranJalaliDate, jalaliFromInstant } from "@/lib/dates/tehran";
import type { NotificationLogItem } from "@/server/queries/notifications";

export function NotificationList({ items }: { items: NotificationLogItem[] }) {
  const today = getTehranJalaliDate();

  if (items.length === 0) {
    return (
      <EmptyState
        title="هنوز اعلانی نیست"
        description="وقتی بودجه‌ات به آستانه برسد، خرج تکراری نزدیک شود، یا سهم امروز آماده باشد، همان‌جا می‌آید."
      />
    );
  }

  const unread = items.some((item) => item.readAt == null);

  return (
    <div className="flex flex-col gap-4">
      {unread ? (
        <form action={markAllNotificationsRead}>
          <Button type="submit" variant="ghost" size="sm" className="self-start px-0">
            همه را خواندم
          </Button>
        </form>
      ) : null}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <NotificationCard item={item} today={today} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotificationCard({
  item,
  today,
}: {
  item: NotificationLogItem;
  today: ReturnType<typeof getTehranJalaliDate>;
}) {
  const unread = item.readAt == null;

  return (
    <article
      className={`rounded-3xl border border-border bg-card px-5 py-4 ${unread ? "" : "opacity-70"}`}
    >
      <Link
        href={item.href}
        className="block"
        onClick={() => {
          if (unread) {
            void markNotificationRead(item.id);
          }
        }}
      >
        <p className="text-xs text-muted-foreground">
          {item.title}
          <span className="mx-2">·</span>
          {formatJalaliDay(jalaliFromInstant(item.sentAt), today)}
        </p>
        <p className="mt-2 text-[15px] leading-7">{item.body}</p>
      </Link>
      {item.explanation ? (
        <details className="mt-3">
          <summary className="cursor-pointer list-none text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
            چرا؟
          </summary>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/70">{item.explanation}</p>
        </details>
      ) : null}
    </article>
  );
}
