import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "@/components/money/money-display";
import { PageHeader } from "@/components/ui/page-header";
import { ContactAvatar } from "@/features/debts/contact-avatar";
import { DangComposer } from "@/features/debts/dang-composer";
import { SettleDrawer } from "@/features/debts/settle-drawer";
import type { AccountOption, ContactOption } from "@/features/debts/types";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import {
  formatJalaliDay,
  getTehranJalaliDate,
  jalaliFromInstant,
  jalaliToEpochDay,
} from "@/lib/dates/tehran";
import { DEBT_STATUS_LABEL, DEBT_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { deleteContact, deleteDebt } from "@/server/actions/debts";
import type { ContactDetailDto } from "@/server/queries/debts";

function openDaysCopy(dateIso: string, today: ReturnType<typeof getTehranJalaliDate>): string | null {
  const days = jalaliToEpochDay(today) - jalaliToEpochDay(jalaliFromInstant(new Date(dateIso)));
  if (days < 1) {
    return null;
  }
  return `این دنگ ${toPersianDigits(days)} روز است که باز است`;
}

function balanceCopy(detail: ContactDetailDto): string {
  if (detail.balance.direction === "OWED_TO_ME") {
    return `${formatToman(detail.balance.netAmount)} طلب توست`;
  }
  if (detail.balance.direction === "I_OWE") {
    return `${formatToman(detail.balance.netAmount)} بدهی توست`;
  }
  return "بین شما چیزی باز نیست";
}

export function ContactDetailView({
  detail,
  contacts,
  accounts,
}: {
  detail: ContactDetailDto;
  contacts: ContactOption[];
  accounts: AccountOption[];
}) {
  const today = getTehranJalaliDate();

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title={detail.contact.name}
        description={balanceCopy(detail)}
        action={
          <Link href="/dang" className="text-sm text-primary">
            همه دنگ‌ها
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <ContactAvatar name={detail.contact.name} color={detail.contact.color} />
        <div className="flex flex-wrap gap-2">
          <SettleDrawer
            mode="contact"
            id={detail.contact.id}
            defaultAmount={detail.balance.netAmount.toString()}
            accounts={accounts}
          />
          {detail.balance.direction === "SETTLED" ? (
            <form action={deleteContact}>
              <input type="hidden" name="id" value={detail.contact.id} />
              <Button type="submit" variant="ghost" size="sm">
                حذف فرد
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <DangComposer contacts={contacts} accounts={accounts} defaultContactId={detail.contact.id} />

      {detail.timeline.length === 0 ? (
        <p className="text-sm leading-7 text-muted-foreground">هنوز چیزی بین شما ثبت نشده.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {detail.timeline.map((item) => {
            if (item.kind === "settlement") {
              return (
                <li key={`s-${item.id}`} className="rounded-3xl border border-border bg-card px-4 py-4">
                  <p className="text-xs text-muted-foreground">
                    تسویه · {formatJalaliDay(jalaliFromInstant(new Date(item.date)), today)}
                  </p>
                  <p className="mt-2 text-sm">
                    <MoneyDisplay amount={item.amount} className="font-semibold" />
                  </p>
                  {item.note ? <p className="mt-1 text-xs text-foreground/45">{item.note}</p> : null}
                </li>
              );
            }

            const openNote = item.status === "SETTLED" ? null : openDaysCopy(item.date, today);
            return (
              <li key={`d-${item.id}`} className="rounded-3xl border border-border bg-card px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.reason || item.splitTitle || "دنگ"}</p>
                    <p className="mt-1 text-xs text-foreground/45">
                      {formatJalaliDay(jalaliFromInstant(new Date(item.date)), today)} ·{" "}
                      {DEBT_TYPE_LABEL[item.type]}
                    </p>
                  </div>
                  <Badge tone={item.status === "SETTLED" ? "muted" : "primary"}>
                    {DEBT_STATUS_LABEL[item.status]}
                  </Badge>
                </div>
                <p className="mt-3 text-sm">
                  <MoneyDisplay
                    amount={item.remainingAmount}
                    className={cn("font-semibold", item.type === "OWED_TO_ME" && "text-income")}
                  />
                  {item.remainingAmount !== item.originalAmount ? (
                    <span className="text-foreground/45"> از {formatToman(BigInt(item.originalAmount))}</span>
                  ) : null}
                </p>
                {openNote ? <p className="mt-2 text-xs text-muted-foreground">{openNote}</p> : null}
                {item.status !== "SETTLED" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SettleDrawer
                      mode="debt"
                      id={item.id}
                      defaultAmount={item.remainingAmount}
                      accounts={accounts}
                      label="تسویه این مورد"
                    />
                    <form action={deleteDebt}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        حذف
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
