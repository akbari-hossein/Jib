import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { MoneyDisplay } from "@/components/money/money-display";
import { ContactAvatar } from "@/features/debts/contact-avatar";
import { toPersianDigits } from "@/lib/currency/format";
import { cn } from "@/lib/utils";
import type { DangContactRow } from "@/server/queries/debts";

function directionCopy(direction: DangContactRow["balance"]["direction"]): string {
  if (direction === "OWED_TO_ME") {
    return "طلب تو";
  }
  if (direction === "I_OWE") {
    return "بدهی تو";
  }
  return "تسویه‌شده";
}

export function DangContactList({ contacts }: { contacts: DangContactRow[] }) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        title="هنوز دنگی ثبت نکردی"
        description="اسم یک نفر و مبلغ را بنویس. لازم نیست طرف مقابل جیب داشته باشد."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Link
            href={`/dang/${contact.id}`}
            className="flex items-center gap-3 rounded-3xl border border-border bg-card px-4 py-4 transition-colors hover:bg-surface-muted/60"
          >
            <ContactAvatar name={contact.name} color={contact.color} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{contact.name}</p>
              <p className="mt-1 text-xs text-foreground/45">
                {directionCopy(contact.balance.direction)}
                {contact.openCount > 0
                  ? ` · ${toPersianDigits(contact.openCount)} دنگ باز`
                  : ""}
              </p>
            </div>
            <MoneyDisplay
              amount={contact.balance.signedAmount}
              className={cn(
                "text-sm font-semibold",
                contact.balance.direction === "OWED_TO_ME" && "text-income",
              )}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
