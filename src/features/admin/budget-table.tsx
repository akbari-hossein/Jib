import { MoneyDisplay } from "@/components/money/money-display";
import { Badge } from "@/components/ui/badge";
import { UsageBar } from "@/components/usage-bar";
import { AdminUserIdentity } from "@/features/admin/user-identity";
import { formatCount } from "@/lib/admin/format";
import { calculateBudgetUsage } from "@/lib/finance/budget-usage";
import { JALALI_MONTHS } from "@/lib/labels";
import { toPersianDigits } from "@/lib/currency/format";

export function AdminBudgetTable({
  budgets,
}: {
  budgets: Array<{
    id: string;
    jalaliYear: number;
    jalaliMonth: number;
    limit: bigint | null;
    spent: bigint;
    categoryCount: number;
    createdAt: Date;
    user: { id: string; name: string | null; email: string };
  }>;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">کاربر</th>
              <th className="px-4 py-3 text-start font-medium">ماه</th>
              <th className="px-4 py-3 text-start font-medium">سقف / مصرف</th>
              <th className="px-4 py-3 text-start font-medium">دسته‌ها</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((budget) => {
              const usage = budget.limit != null ? calculateBudgetUsage(budget.spent, budget.limit) : null;
              const month = `${JALALI_MONTHS[budget.jalaliMonth - 1] ?? ""} ${toPersianDigits(budget.jalaliYear)}`;
              return (
                <tr key={budget.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">
                    <AdminUserIdentity
                      name={budget.user.name}
                      email={budget.user.email}
                      href={`/admin/users/${budget.user.id}`}
                    />
                  </td>
                  <td className="px-4 py-3">{month}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-52 flex-col gap-2">
                      <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                        <MoneyDisplay amount={budget.spent} className="text-xs" />
                        {budget.limit != null ? (
                          <MoneyDisplay amount={budget.limit} className="text-xs" />
                        ) : (
                          <span>بدون سقف کلی</span>
                        )}
                      </div>
                      {usage ? (
                        <UsageBar
                          pct={usage.pct}
                          tone={usage.status === "over" ? "expense" : usage.status === "near" ? "warning" : "primary"}
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="numeric-display px-4 py-3">{formatCount(budget.categoryCount)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        usage?.status === "over" ? "expense" : usage?.status === "near" ? "warning" : "muted"
                      }
                    >
                      {usage?.status === "over" ? "بالای سقف" : usage?.status === "near" ? "نزدیک سقف" : "سالم"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {budgets.map((budget) => {
          const usage = budget.limit != null ? calculateBudgetUsage(budget.spent, budget.limit) : null;
          const month = `${JALALI_MONTHS[budget.jalaliMonth - 1] ?? ""} ${toPersianDigits(budget.jalaliYear)}`;
          return (
            <li key={budget.id} className="rounded-3xl border border-border bg-card p-4">
              <p className="font-medium">{month}</p>
              <div className="mt-2">
                <AdminUserIdentity
                  name={budget.user.name}
                  email={budget.user.email}
                  href={`/admin/users/${budget.user.id}`}
                />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {usage ? <UsageBar pct={usage.pct} tone="primary" /> : null}
                <p className="text-xs text-muted-foreground">
                  <MoneyDisplay amount={budget.spent} className="text-xs" />
                  {budget.limit != null ? (
                    <>
                      {" "}
                      از <MoneyDisplay amount={budget.limit} className="text-xs" />
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
