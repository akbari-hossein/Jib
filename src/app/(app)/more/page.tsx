import Link from "next/link";
import { logout } from "@/server/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { PaydayForm } from "@/features/settings/payday-form";
import { PlanCard } from "@/features/settings/plan-card";
import { ProfileForm } from "@/features/settings/profile-form";
import { ReferenceAssetForm } from "@/features/settings/reference-asset-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getPlanAccess } from "@/server/queries/plan";

export const metadata = { title: "بیشتر" };

export default async function MorePage() {
  const user = await requireUser();
  const access = await getPlanAccess(user.id, user.plan);

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
        <Link href="/reports" className="px-5 py-4 text-sm hover:bg-surface-muted">
          گزارش‌ها
        </Link>
        <Link href="/accounts" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          حساب‌ها
        </Link>
        <Link href="/rates" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          نرخ‌ها
        </Link>
        <Link href="/rules" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          قوانین دسته‌بندی
        </Link>
        <Link href="/recurring" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          خرج و درآمد تکراری
        </Link>
        <Link href="/privacy" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          حریم خصوصی
        </Link>
        <Link href="/about" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          درباره جیب
        </Link>
        <Link href="/home?tour=1" className="border-t border-border px-5 py-4 text-sm hover:bg-surface-muted">
          راهنمای جیب
        </Link>
      </nav>

      <PlanCard access={access} />

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">روز درآمد</h2>
        <PaydayForm incomeDayOfMonth={user.incomeDayOfMonth} />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">معادل ارزش</h2>
        <ReferenceAssetForm preference={user.referenceAssetPreference} />
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
