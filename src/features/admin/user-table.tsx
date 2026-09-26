import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminUserIdentity } from "@/features/admin/user-identity";
import { formatRelativeOrDate } from "@/lib/admin/format";
import { USER_STATUS_LABEL } from "@/lib/admin/labels";
import { buildPageHref, type SortDir, type UserSort } from "@/lib/admin/params";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/subscription/admin-copy";
import type { AdminUserListItem } from "@/server/queries/admin/users";

const SUBSCRIPTION_TONE = {
  ACTIVE: "income",
  TRIALING: "primary",
  PENDING_REVIEW: "warning",
  EXPIRED: "muted",
  REJECTED: "warning",
} as const;

function SortLink({
  label,
  field,
  sort,
  dir,
  search,
}: {
  label: string;
  field: UserSort;
  sort: UserSort;
  dir: SortDir;
  search: URLSearchParams;
}) {
  const nextDir: SortDir = sort === field && dir === "desc" ? "asc" : "desc";
  return (
    <Link
      href={buildPageHref("/admin/users", search, { sort: field, dir: nextDir, page: 1 })}
      className="hover:text-foreground"
    >
      {label}
      {sort === field ? (dir === "desc" ? " ↓" : " ↑") : ""}
    </Link>
  );
}

export function AdminUserTable({
  users,
  sort,
  dir,
  search,
}: {
  users: AdminUserListItem[];
  sort: UserSort;
  dir: SortDir;
  search: URLSearchParams;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">کاربر</th>
              <th className="px-4 py-3 text-start font-medium">
                <SortLink label="عضویت" field="createdAt" sort={sort} dir={dir} search={search} />
              </th>
              <th className="px-4 py-3 text-start font-medium">
                <SortLink label="آخرین فعالیت" field="lastActiveAt" sort={sort} dir={dir} search={search} />
              </th>
              <th className="px-4 py-3 text-start font-medium">شروع</th>
              <th className="px-4 py-3 text-start font-medium">اشتراک</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
              <th className="px-4 py-3 text-start font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <AdminUserIdentity name={user.name} email={user.email} href={`/admin/users/${user.id}`} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatRelativeOrDate(user.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatRelativeOrDate(user.lastActiveAt)}</td>
                <td className="px-4 py-3">
                  <Badge tone={user.onboardingCompletedAt ? "savings" : "muted"}>
                    {user.onboardingCompletedAt ? "تمام" : "ناتمام"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={SUBSCRIPTION_TONE[user.subscriptionStatus]}>
                    {SUBSCRIPTION_STATUS_LABEL[user.subscriptionStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={user.status === "ACTIVE" ? "income" : "warning"}>
                    {USER_STATUS_LABEL[user.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="text-xs text-primary">
                    جزئیات
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {users.map((user) => (
          <li key={user.id}>
            <Link
              href={`/admin/users/${user.id}`}
              className="block rounded-3xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <AdminUserIdentity name={user.name} email={user.email} />
                <Badge tone={user.status === "ACTIVE" ? "income" : "warning"}>
                  {USER_STATUS_LABEL[user.status]}
                </Badge>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                عضویت {formatRelativeOrDate(user.createdAt)} · فعالیت {formatRelativeOrDate(user.lastActiveAt)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {SUBSCRIPTION_STATUS_LABEL[user.subscriptionStatus]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
