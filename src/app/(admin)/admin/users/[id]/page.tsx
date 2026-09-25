import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { AdminUserActions } from "@/features/admin/user-actions";
import { formatCount, formatJalaliAbsolute, formatJalaliDateTime } from "@/lib/admin/format";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminUserDetail } from "@/server/queries/admin/users";

const SUBSCRIPTION_STATUS_LABEL = {
  TRIALING: "آزمایشی",
  PENDING_REVIEW: "در انتظار بررسی",
  ACTIVE: "فعال",
  EXPIRED: "منقضی",
  REJECTED: "رد شده",
} as const;

export const metadata = { title: "جزئیات کاربر" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await getAdminUserDetail(id);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs current={user.name?.trim() || user.email || "کاربر"} />
      <PageHeader
        title={user.name?.trim() || "بدون نام"}
        description={user.email ?? undefined}
      />

      <aside className="rounded-3xl border border-border bg-card p-4 text-sm leading-7 text-muted-foreground">
        به دلایل حریم خصوصی، جزئیات تراکنش‌ها، حساب‌ها، بودجه‌ها و اهداف کاربران در این پنل نمایش داده نمی‌شود.
      </aside>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="شناسه" value={user.id} dir="ltr" />
        <InfoCard label="نقش" value={USER_ROLE_LABEL[user.role]} />
        <InfoCard label="وضعیت" value={USER_STATUS_LABEL[user.status]} />
        <InfoCard
          label="زبان"
          value={user.locale || "—"}
        />
        <InfoCard label="عضویت" value={formatJalaliAbsolute(user.createdAt)} />
        <InfoCard
          label="آخرین فعالیت"
          value={user.lastLoginAt ? formatJalaliDateTime(user.lastLoginAt) : "—"}
        />
        <InfoCard
          label="اشتراک"
          value={user.subscription ? SUBSCRIPTION_STATUS_LABEL[user.subscription.status] : "بدون اشتراک"}
        />
        <InfoCard
          label="پایان دوره"
          value={user.subscription?.currentPeriodEnd ? formatJalaliAbsolute(user.subscription.currentPeriodEnd) : "—"}
        />
        <InfoCard
          label="ورود"
          value={[user.hasPassword ? "ایمیل" : null, user.signedInWithGoogle ? "گوگل" : null]
            .filter(Boolean)
            .join(" · ") || "نامشخص"}
        />
        <InfoCard
          label="حالت فقط‌خواندنی"
          value={user.readOnlyMode ? "فعال" : "غیرفعال"}
        />
        <InfoCard
          label="تعداد نشست‌های فعال"
          value={formatCount(user.counts.activeSessions)}
        />
        <InfoCard
          label="روز درآمد"
          value={user.incomeDayOfMonth != null ? formatCount(user.incomeDayOfMonth) : "—"}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="تعداد حساب‌ها" value={user.counts.accountCount} />
        <StatCard label="تعداد تراکنش‌ها" value={user.counts.transactionCount} />
        <StatCard label="تعداد بودجه‌ها" value={user.counts.budgetCount} />
        <StatCard label="تعداد اهداف" value={user.counts.goalCount} />
      </section>

      <p className="text-xs text-muted-foreground">
        به دلایل حریم خصوصی، جزئیات تراکنش‌ها، حساب‌ها، بودجه‌ها و اهداف کاربران در این پنل نمایش داده نمی‌شود.
      </p>

      <AdminUserActions
        userId={user.id}
        email={user.email ?? ""}
        role={user.role}
        status={user.status}
        onboardingCompleted={user.onboardingCompletedAt != null}
        isSelf={admin.id === user.id}
      />
    </main>
  );
}

function InfoCard({ label, value, dir }: { label: string; value: string; dir?: "ltr" }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-all text-sm font-medium" dir={dir}>
        {value}
      </p>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="numeric-display mt-2 text-2xl font-semibold">{formatCount(value)}</p>
    </article>
  );
}
