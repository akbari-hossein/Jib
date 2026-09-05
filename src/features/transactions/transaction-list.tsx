import { CategoryIcon } from "@/components/category-icon";
import { HoldingExplain } from "@/components/finance/holding-explain";
import { MoneyDisplay } from "@/components/money/money-display";
import { DeleteTransactionButton } from "@/features/transactions/delete-transaction-button";
import { formatToman } from "@/lib/currency/format";
import { formatJalaliDay, getTehranJalaliDate, jalaliFromInstant } from "@/lib/dates/tehran";
import { ASSET_MOVEMENT_REASON_LABEL, TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { formatQuantity, parseQuantityToScaled } from "@/lib/finance/quantity";
import { cn } from "@/lib/utils";
import type { Account, Category, Transaction } from "@prisma/client";

type Row = Transaction & {
  category: Category | null;
  account: Account;
  toAccount: Account | null;
};

function isAssetMovement(type: Row["type"]): boolean {
  return type === "ASSET_ADD" || type === "ASSET_REMOVE";
}

function assetQuantityLabel(item: Row): string | null {
  if (!item.quantityDelta) {
    return null;
  }
  const scaled = parseQuantityToScaled(item.quantityDelta.toString());
  if (scaled == null) {
    return null;
  }
  const absolute = scaled < 0n ? -scaled : scaled;
  return formatQuantity(absolute);
}

function assetExplain(item: Row): string | null {
  const quantity = assetQuantityLabel(item);
  if (!quantity || item.rateToTomanSnapshot == null || item.rateToTomanSnapshot <= 0n) {
    return null;
  }
  return `${quantity} × ${formatToman(item.rateToTomanSnapshot)} = ${formatToman(item.amount)}`;
}

export function TransactionList({ transactions }: { transactions: Row[] }) {
  const today = getTehranJalaliDate();
  const groups = new Map<string, { label: string; items: Row[] }>();

  for (const item of transactions) {
    const day = jalaliFromInstant(item.occurredAt);
    const key = `${day.year}-${day.month}-${day.day}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { label: formatJalaliDay(day, today), items: [item] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.values()].map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h2 className="text-xs text-foreground/45">{group.label}</h2>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => {
              const quantity = assetQuantityLabel(item);
              const explain = assetExplain(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted">
                      <CategoryIcon name={item.category?.icon ?? (isAssetMovement(item.type) ? "coins" : "repeat")} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.type === "TRANSFER"
                          ? `از ${item.account.name} به ${item.toAccount?.name ?? ""}`
                          : isAssetMovement(item.type)
                            ? `${TRANSACTION_TYPE_LABEL[item.type]}${
                                item.movementReason
                                  ? ` · ${ASSET_MOVEMENT_REASON_LABEL[item.movementReason]}`
                                  : ""
                              }`
                            : item.category?.name ?? TRANSACTION_TYPE_LABEL[item.type]}
                      </p>
                      <p className="truncate text-xs text-foreground/45">
                        {isAssetMovement(item.type)
                          ? `${item.account.name}${quantity ? ` · ${quantity}` : ""}`
                          : `${item.merchant ? `${item.merchant} · ` : ""}${item.type === "TRANSFER" ? "جابه‌جایی" : item.account.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      {isAssetMovement(item.type) && item.amount === 0n ? (
                        <span className="text-xs text-muted-foreground">{quantity ?? "—"}</span>
                      ) : (
                        <MoneyDisplay
                          amount={item.amount}
                          className={cn(
                            "text-sm font-semibold",
                            item.type === "INCOME" && "text-income",
                            item.type === "EXPENSE" && "text-expense",
                          )}
                        />
                      )}
                      {explain ? <HoldingExplain detail={explain} /> : null}
                    </div>
                    <DeleteTransactionButton id={item.id} isAsset={isAssetMovement(item.type)} amount={item.amount} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
