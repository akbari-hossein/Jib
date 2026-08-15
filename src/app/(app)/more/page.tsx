import { logout } from "@/server/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { maskPhone } from "@/lib/auth/phone";
import { toPersianDigits } from "@/lib/currency/format";
import { ProfileForm } from "@/features/settings/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function MorePage() {
  const user = await requireUser();

  return (
    <main className="flex flex-col gap-8 px-5 pt-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">بیشتر</h1>
          <p className="mt-1 text-sm text-foreground/50" dir="ltr">
            {toPersianDigits(maskPhone(user.phone))}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="rounded-3xl border border-border bg-surface p-5">
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
