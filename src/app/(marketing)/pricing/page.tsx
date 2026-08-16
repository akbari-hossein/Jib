import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/features/marketing/header";
import { activatePro } from "@/server/actions/plan";
import { getCurrentUser } from "@/lib/auth/session";
import { canSelfServePro, isPro } from "@/lib/billing/plan";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "قیمت",
};

const FREE_ITEMS = [
  "تا ۳ حساب فعال",
  "تراکنش نامحدود",
  "تا ۲ هدف",
  "تا ۳ سقف بودجه در ماه",
  "گزارش هفته و ماه",
];

const PRO_ITEMS = [
  "حساب و هدف نامحدود",
  "سقف دسته نامحدود",
  "سقف کل ماه",
  "خرج و درآمد تکراری",
  "خروجی CSV تراکنش‌ها",
];

export default async function PricingPage() {
  const user = await getCurrentUser();
  const pro = user ? isPro(user.plan) : false;
  const selfServe = canSelfServePro();

  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">قیمت</h1>
        <p className="mt-4 max-w-lg leading-8 text-foreground/65">
          رایگان برای شروع کافی است. حرفه‌ای یعنی کنترل بیشتر و دید عمیق‌تر — نه هوش مصنوعی.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-surface p-6">
            <p className="text-sm text-foreground/45">رایگان</p>
            <h2 className="mt-1 text-2xl font-semibold">شروع</h2>
            <ul className="mt-5 flex flex-col gap-2 text-sm leading-7 text-foreground/70">
              {FREE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              href={user ? "/home" : "/login"}
              className="mt-6 inline-flex h-12 items-center text-sm text-primary"
            >
              {user ? "ادامه با رایگان" : "شروع رایگان"}
            </Link>
          </article>

          <article className="rounded-3xl border border-primary/30 bg-surface p-6">
            <p className="text-sm text-foreground/45">حرفه‌ای</p>
            <h2 className="mt-1 text-2xl font-semibold">کنترل بیشتر</h2>
            <ul className="mt-5 flex flex-col gap-2 text-sm leading-7 text-foreground/70">
              {PRO_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {pro ? (
              <p className="mt-6 text-sm text-income">نسخه حرفه‌ای تو فعاله.</p>
            ) : selfServe && user ? (
              <form action={activatePro} className="mt-6">
                <Button type="submit" className="w-full">
                  فعال‌سازی نسخه حرفه‌ای
                </Button>
              </form>
            ) : (
              <p className="mt-6 text-sm leading-7 text-foreground/50">
                پرداخت آنلاین به‌زودی.{" "}
                {user ? null : (
                  <Link href="/login" className="text-primary">
                    اول وارد شو
                  </Link>
                )}
              </p>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
