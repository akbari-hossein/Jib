import { greetingForPeriod, getDayPeriod } from "@/lib/dates/tehran";
import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";

export default async function HomePage() {
  const user = await requireUser();
  const greeting = greetingForPeriod(getDayPeriod());
  const title = user.name ? `${greeting} ${user.name}` : greeting;

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header>
        <p className="text-sm text-foreground/50">{title}</p>
        <h1 className="mt-4 text-xs font-medium text-foreground/45">قابل خرج</h1>
        <p className="numeric-display mt-2 text-4xl font-semibold tracking-tight text-foreground/25">
          — — —
        </p>
      </header>
      <EmptyState
        title="هنوز موجودی ثبت نشده"
        description="وقتی اولین حسابت را اضافه کنی، اینجا می‌بینی امروز چقدر می‌توانی خرج کنی — بدون حساب‌وکتاب اضافه."
      />
    </main>
  );
}
