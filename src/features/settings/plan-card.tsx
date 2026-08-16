import Link from "next/link";
import { activatePro } from "@/server/actions/plan";
import { Button } from "@/components/ui/button";
import type { PlanAccess } from "@/server/queries/plan";

export function PlanCard({ access }: { access: PlanAccess }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5">
      <h2 className="text-base font-semibold">نسخه</h2>
      <p className="mt-2 text-sm text-foreground/60">
        {access.isPro ? "نسخه حرفه‌ای فعال است." : "نسخه رایگان — برای شروع کافی است."}
      </p>
      {access.isPro ? (
        <p className="mt-3 text-sm leading-7 text-foreground/50">
          حساب، هدف و سقف نامحدود، تکراری‌ها، سقف کل ماه و خروجی تراکنش‌ها باز است.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <Link href="/pricing" className="text-sm text-primary">
            مقایسه نسخه‌ها
          </Link>
          {access.canSelfServe ? (
            <form action={activatePro}>
              <Button type="submit" variant="secondary" className="w-full">
                فعال‌سازی نسخه حرفه‌ای
              </Button>
            </form>
          ) : (
            <p className="text-xs leading-6 text-foreground/45">پرداخت آنلاین به‌زودی اضافه می‌شود.</p>
          )}
        </div>
      )}
    </section>
  );
}
