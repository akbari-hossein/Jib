import { MoneyDisplay } from "@/components/money/money-display";
import { Badge } from "@/components/ui/badge";
import { UsageBar } from "@/components/usage-bar";
import { AdminUserIdentity } from "@/features/admin/user-identity";
import { formatRelativeOrDate } from "@/lib/admin/format";
import { calculateGoalProgress } from "@/lib/finance/goal-progress";

export function AdminGoalTable({
  goals,
  now = new Date(),
}: {
  goals: Array<{
    id: string;
    name: string;
    targetAmount: bigint;
    currentAmount: bigint;
    targetDate: Date | null;
    isArchived: boolean;
    createdAt: Date;
    user: { id: string; name: string | null; email: string };
  }>;
  now?: Date;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">کاربر</th>
              <th className="px-4 py-3 text-start font-medium">هدف</th>
              <th className="px-4 py-3 text-start font-medium">مبلغ / پیشرفت</th>
              <th className="px-4 py-3 text-start font-medium">ایجاد</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const progress = calculateGoalProgress({
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                targetDate: goal.targetDate,
                today: now,
              });
              return (
                <tr key={goal.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">
                    <AdminUserIdentity
                      name={goal.user.name}
                      email={goal.user.email}
                      href={`/admin/users/${goal.user.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{goal.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-52 flex-col gap-2">
                      <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                        <MoneyDisplay amount={goal.currentAmount} className="text-xs" />
                        <MoneyDisplay amount={goal.targetAmount} className="text-xs" />
                      </div>
                      <UsageBar pct={progress.pct} tone="savings" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeOrDate(goal.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={goal.isArchived ? "muted" : progress.pct >= 100 ? "income" : "primary"}>
                      {goal.isArchived ? "بایگانی" : progress.pct >= 100 ? "رسیده" : "فعال"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {goals.map((goal) => {
          const progress = calculateGoalProgress({
            currentAmount: goal.currentAmount,
            targetAmount: goal.targetAmount,
            targetDate: goal.targetDate,
            today: now,
          });
          return (
            <li key={goal.id} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{goal.name}</p>
                <Badge tone={goal.isArchived ? "muted" : "primary"}>
                  {goal.isArchived ? "بایگانی" : "فعال"}
                </Badge>
              </div>
              <div className="mt-3">
                <AdminUserIdentity name={goal.user.name} email={goal.user.email} href={`/admin/users/${goal.user.id}`} />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <UsageBar pct={progress.pct} tone="savings" />
                <p className="text-xs text-muted-foreground">
                  <MoneyDisplay amount={goal.currentAmount} className="text-xs" /> از{" "}
                  <MoneyDisplay amount={goal.targetAmount} className="text-xs" />
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
