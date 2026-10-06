import Link from "next/link";
import { logout } from "@/server/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { PaydayForm } from "@/features/settings/payday-form";
import { ProfileForm } from "@/features/settings/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SubscriptionStatusCard } from "@/features/subscription/components/SubscriptionStatusCard";
import { getCachedSubscription, serializeSubscription } from "@/server/services/subscription";
import { getReferralSummary } from "@/server/services/referrals";
import { getSiteUrl } from "@/lib/config/site";
import { ReferralCard } from "@/features/referrals/referral-card";

export const metadata = { title: "بیشتر" };

export default async function MorePage() {
  const user = await requireUser();
  const snapshot = serializeSubscription(await getCachedSubscription(user.id));
  const referralSummary = await getReferralSummary(user.id);

  return (
    <main className="flex flex-col gap-8 px-5 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">بیشتر</h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
            {user.email}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <nav className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
        <Link href="/budgets" className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>💰</span>
          بودجه
        </Link>
        <Link href="/reports" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>📈</span>
          گزارش‌ها
        </Link>
        <Link href="/accounts" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>🏦</span>
          حساب‌ها
        </Link>
        <Link href="/categories" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>🏷️</span>
          دسته‌بندی‌ها
        </Link>
        <Link href="/rules" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>⚙️</span>
          قوانین دسته‌بندی
        </Link>
        <Link href="/recurring" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>🔁</span>
          خرج و درآمد تکراری
        </Link>
        <Link href="/upgrade" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          <span aria-hidden>⭐</span>
          اشتراک
        </Link>
        {user.role === "ADMIN" ? (
          <Link href="/admin" className="flex items-center gap-3 border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
            <span aria-hidden>🛡️</span>
            پنل مدیریت
          </Link>
        ) : null}
      </nav>

      <nav className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
        <p className="px-5 pt-4 text-xs text-muted-foreground">ابزارها</p>
        <Link href="/tools/calculators" className="px-5 py-4 text-sm hover:bg-surface-muted">
          محاسبه‌گر مالی
        </Link>
      </nav>

      <SubscriptionStatusCard snapshot={snapshot} />

      <ReferralCard summary={referralSummary} signupUrl={`${getSiteUrl()}/signup`} />

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">روز درآمد</h2>
        <PaydayForm incomeDayOfMonth={user.incomeDayOfMonth} />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">پروفایل</h2>
        <ProfileForm name={user.name} />
      </section>

      <form action={logout}>
        <Button type="submit" variant="ghost" className="w-full text-foreground/70">
          خروج
        </Button>
      </form>
    </main>
  );
}
