import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/empty-state";
import { PaginationBar } from "@/features/admin/pagination-bar";
import { formatJalaliAbsolute } from "@/lib/admin/format";
import { formatToman } from "@/lib/currency/format";
import {
  ADMIN_USER_STATUS_FILTER_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/subscription/admin-copy";
import {
  ADMIN_USER_STATUS_FILTERS,
  type AdminSubscriberDto,
  type AdminUserStatusFilter,
} from "@/lib/subscription/admin-users";

const STATUS_TONE = {
  ACTIVE: "income",
  TRIALING: "primary",
  PENDING_REVIEW: "warning",
  EXPIRED: "muted",
  REJECTED: "warning",
} as const;

export function UsersTable({
  users,
  total,
  page,
  pageSize,
  status,
  search,
  searchParams,
}: {
  users: AdminSubscriberDto[];
  total: number;
  page: number;
  pageSize: number;
  status: AdminUserStatusFilter;
  search: string;
  searchParams: URLSearchParams;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const filtered = Boolean(search) || status !== "ALL";

  return (
    <section className="flex flex-col gap-4">
      <form
        className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_12rem_auto]"
        action="/admin/dashboard"
      >
        <Input
          name="search"
          defaultValue={search}
          placeholder="جستجوی شماره تماس یا نام"
          className="h-11 text-sm"
        />
        <NativeSelect
          name="status"
          defaultValue={status}
          className="h-11 text-sm"
          aria-label="وضعیت اشتراک"
        >
          {ADMIN_USER_STATUS_FILTERS.map((item) => (
            <option key={item} value={item}>
              {ADMIN_USER_STATUS_FILTER_LABEL[item]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary" className="h-11">
          اعمال
        </Button>
      </form>

      {total === 0 ? (
        <EmptyState
          title={filtered ? "نتیجه‌ای پیدا نشد" : "هنوز کاربری نیست"}
          description={
            filtered
              ? "فیلتر یا جستجو را تغییر بده."
              : "وقتی کسی در جیب ثبت‌نام کند، اینجا دیده می‌شود."
          }
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">شماره تماس</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت اشتراک</th>
                  <th className="px-4 py-3 text-start font-medium">تاریخ پایان دوره</th>
                  <th className="px-4 py-3 text-start font-medium">مجموع پرداختی</th>
                  <th className="px-4 py-3 text-start font-medium">آخرین پرداخت</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name?.trim() || "بدون نام"}</p>
                      <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                        {user.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[user.subscriptionStatus]}>
                        {SUBSCRIPTION_STATUS_LABEL[user.subscriptionStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.currentPeriodEnd
                        ? formatJalaliAbsolute(new Date(user.currentPeriodEnd))
                        : "—"}
                    </td>
                    <td className="numeric-display px-4 py-3">
                      {formatToman(BigInt(user.totalPaidToman))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.lastPaymentAt ? formatJalaliAbsolute(new Date(user.lastPaymentAt)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {users.map((user) => (
              <li key={user.userId} className="rounded-3xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.name?.trim() || "بدون نام"}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                      {user.phone}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[user.subscriptionStatus]}>
                    {SUBSCRIPTION_STATUS_LABEL[user.subscriptionStatus]}
                  </Badge>
                </div>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  پایان دوره{" "}
                  {user.currentPeriodEnd ? formatJalaliAbsolute(new Date(user.currentPeriodEnd)) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatToman(BigInt(user.totalPaidToman))} · آخرین پرداخت{" "}
                  {user.lastPaymentAt ? formatJalaliAbsolute(new Date(user.lastPaymentAt)) : "—"}
                </p>
              </li>
            ))}
          </ul>

          <PaginationBar
            pathname="/admin/dashboard"
            search={searchParams}
            page={page}
            pageCount={pageCount}
            total={total}
          />
        </>
      )}
    </section>
  );
}
