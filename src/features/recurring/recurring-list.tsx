import {
  deleteRecurring,
  pauseRecurring,
  postRecurringNow,
  resumeRecurring,
} from "@/server/actions/recurring";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/money/money-display";
import { formatJalaliDay, getTehranJalaliDate } from "@/lib/dates/tehran";
import { FREQUENCY_LABEL, TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import type { RecurringListItem } from "@/server/queries/recurring";

export function RecurringList({ items }: { items: RecurringListItem[] }) {
  const today = getTehranJalaliDate();

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-3xl border border-border bg-card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-foreground/45">
                {TRANSACTION_TYPE_LABEL[item.type]} · {FREQUENCY_LABEL[item.frequency]} ·{" "}
                {item.category.name}
              </p>
            </div>
            <MoneyDisplay amount={item.amount} className="text-sm font-semibold" />
          </div>
          <p className="mt-3 text-sm text-foreground/60">
            {item.isActive
              ? item.isDue
                ? "موعد رسیده"
                : `بعدی: ${formatJalaliDay(item.nextDate, today)}`
              : "متوقف"}
            {` · ${item.account.name}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.isActive && item.isDue ? (
              <form action={postRecurringNow}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" size="sm">
                  ثبت این دوره
                </Button>
              </form>
            ) : null}
            {item.isActive ? (
              <form action={pauseRecurring}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="secondary" size="sm">
                  توقف
                </Button>
              </form>
            ) : (
              <form action={resumeRecurring}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="secondary" size="sm">
                  ادامه
                </Button>
              </form>
            )}
            <form action={deleteRecurring}>
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" variant="ghost" size="sm">
                حذف
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
