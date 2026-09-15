"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { EmptyState } from "@/components/empty-state";
import { formatJalaliAbsolute, formatCount } from "@/lib/admin/format";
import { formatToman } from "@/lib/currency/format";
import {
  ADMIN_USER_STATUS_FILTER_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
} from "@/lib/subscription/admin-copy";
import {
  ADMIN_USER_STATUS_FILTERS,
  DEFAULT_ADMIN_USERS_PAGE_SIZE,
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

type UsersResponse = {
  users: AdminSubscriberDto[];
  total: number;
  page: number;
  pageSize: number;
};

export function UsersTable() {
  const [status, setStatus] = useState<AdminUserStatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      status,
      page: String(page),
      pageSize: String(DEFAULT_ADMIN_USERS_PAGE_SIZE),
    });
    if (search) {
      params.set("search", search);
    }
    return params.toString();
  }, [status, search, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/users?${query}`)
      .then(async (response) => {
        if (response.status === 403 || response.status === 401) {
          throw new Error("forbidden");
        }
        if (!response.ok) {
          throw new Error("load-failed");
        }
        return (await response.json()) as UsersResponse;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("فهرست کاربران بارگذاری نشد.");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / DEFAULT_ADMIN_USERS_PAGE_SIZE));

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <section className="flex flex-col gap-4">
      <form
        onSubmit={applySearch}
        className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_12rem_auto]"
      >
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="جستجوی شماره تماس یا نام"
          className="h-11 text-sm"
        />
        <NativeSelect
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AdminUserStatusFilter);
            setPage(1);
          }}
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

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-muted-foreground">در حال بارگذاری فهرست کاربران…</p>
      ) : !data || data.total === 0 ? (
        <EmptyState
          title={search || status !== "ALL" ? "نتیجه‌ای پیدا نشد" : "هنوز کاربری نیست"}
          description={
            search || status !== "ALL"
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
                {data.users.map((user) => (
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
            {data.users.map((user) => (
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              صفحه {formatCount(data.page)} از {formatCount(pageCount)} · {formatCount(data.total)} مورد
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                قبلی
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
