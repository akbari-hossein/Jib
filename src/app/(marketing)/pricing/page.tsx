import type { Metadata } from "next";
import Link from "next/link";
import { activatePro } from "@/server/actions/plan";
import { getCurrentUser } from "@/lib/auth/session";
import { canSelfServePro, isPro } from "@/lib/billing/plan";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { publicPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = publicPageMetadata({
  title: "قیمت جیب",
  description:
    "جیب رایگان شروع می‌شود. نسخه حرفه‌ای حساب، هدف و بودجه نامحدود، مورد تکراری و خروجی دارد. پرداخت آنلاین هنوز فعال نیست.",
  path: "/pricing",
});

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
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "جیب", path: "/" },
          { name: "قیمت", path: "/pricing" },
        ])}
      />
      <h1 className="text-3xl font-semibold tracking-tight">قیمت</h1>
      <p className="mt-4 max-w-lg text-base leading-8 text-muted-foreground">
        رایگان برای شروع کافی است. حرفه‌ای یعنی کنترل بیشتر — نه هوش مصنوعی، نه پرداخت پنهان.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">رایگان</p>
          <h2 className="mt-1 text-2xl font-semibold">شروع</h2>
          <ul className="mt-5 flex flex-col gap-2 text-sm leading-7 text-muted-foreground">
            {FREE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link
            href={user ? "/home" : "/signup"}
            className="mt-6 inline-flex h-12 items-center text-sm text-primary"
          >
            {user ? "ادامه با رایگان" : "رایگان شروع کن"}
          </Link>
        </Card>

        <Card className="border-primary/25 p-6">
          <p className="text-sm text-muted-foreground">حرفه‌ای</p>
          <h2 className="mt-1 text-2xl font-semibold">کنترل بیشتر</h2>
          <ul className="mt-5 flex flex-col gap-2 text-sm leading-7 text-muted-foreground">
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
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              پرداخت آنلاین به‌زودی.{" "}
              {user ? null : (
                <Link href="/login" className="text-primary">
                  اول وارد شو
                </Link>
              )}
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
