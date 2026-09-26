import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { AdminUserActions } from "@/features/admin/user-actions";
import { formatCount, formatJalaliAbsolute, formatJalaliDateTime, formatRelativeOrDate } from "@/lib/admin/format";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/auth/admin";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/subscription/admin-copy";
import { getAdminUserDetail } from "@/server/queries/admin/users";

export const metadata = { title: "جزئیات کاربر" };

const SUBSCRIPTION_TONE = {
  ACTIVE: "income",
  TRIALING: "primary",
  PENDING_REVIEW: "warning",
  EXPIRED: "muted",
  REJECTED: "warning",
} as const;

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
      <AdminBreadcrumbs current={user.name?.trim() || user.email} />
      <PageHeader title={user.name?.trim() || "بدون نام"} description={user.email} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="شناسه" value={user.id} dir="ltr" />
        <InfoCard label="نقش" value={USER_ROLE_LABEL[user.role]} />
        <InfoCard label="وضعیت" value={USER_STATUS_LABEL[user.status]} />
        <article className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">اشتراک</p>
          <div className="mt-2">
            <Badge tone={SUBSCRIPTION_TONE[user.subscriptionStatus]}>
              {SUBSCRIPTION_STATUS_LABEL[user.subscriptionStatus]}
            </Badge>
          </div>
        </article>
        <InfoCard label="عضویت" value={formatJalaliAbsolute(user.createdAt)} />
        <InfoCard
          label="آخرین فعالیت"
          value={user.lastActiveAt ? formatJalaliDateTime(user.lastActiveAt) : "—"}
        />
        <InfoCard
          label="راهنمای شروع"
          value={user.onboardingCompletedAt ? formatRelativeOrDate(user.onboardingCompletedAt) : "ناتمام"}
        />
        <InfoCard
          label="ورود"
          value={[user.hasPassword ? "ایمیل" : null, user.signedInWithGoogle ? "گوگل" : null]
            .filter(Boolean)
            .join(" · ") || "نامشخص"}
        />
        <InfoCard
          label="پایان دوره"
          value={user.currentPeriodEnd ? formatJalaliAbsolute(user.currentPeriodEnd) : "—"}
        />
        <InfoCard label="نشست‌های فعال" value={formatCount(user.activeSessions)} />
      </section>

      <AdminUserActions
        userId={user.id}
        email={user.email}
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
