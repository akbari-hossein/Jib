import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { parseBootstrapAdminEmails } from "@/lib/admin/access";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "تنظیمات" };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const [adminCount, bootstrapConfigured] = await Promise.all([
    prisma.user.count({ where: { role: "ADMIN" } }),
    Promise.resolve(parseBootstrapAdminEmails().length > 0),
  ]);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader title="تنظیمات" description="نقش مدیر فقط در دیتابیس معتبر است و از کلاینت قابل جعل نیست." />

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">حساب مدیر فعلی</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">نام</dt>
            <dd className="mt-1">{admin.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">ایمیل</dt>
            <dd className="mt-1" dir="ltr">
              {admin.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">شناسه</dt>
            <dd className="mt-1 font-mono text-xs" dir="ltr">
              {admin.id}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">دسترسی مدیر</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          الان {adminCount} مدیر در سیستم هست. اولین مدیر را می‌توان با متغیر{" "}
          <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs">ADMIN_BOOTSTRAP_EMAILS</code> ساخت؛
          فقط وقتی هیچ مدیری وجود ندارد و همان ایمیل به <span className="whitespace-nowrap">/admin</span>{" "}
          برود، ارتقا داده می‌شود.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          بوت‌استرپ محیطی: {bootstrapConfigured ? "تنظیم شده" : "تنظیم نشده"}
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">حریم داده</h2>
        <ul className="mt-3 list-disc space-y-2 pe-5 text-sm leading-7 text-muted-foreground">
          <li>تراکنش‌های کاربران از این پنل ویرایش یا حذف نمی‌شوند.</li>
          <li>رمز عبور، توکن نشست و کلید پوش هرگز در گزارش اقدامات ذخیره نمی‌شود.</li>
          <li>کاربر عادی حتی با حدس زدن آدرس به این صفحات دسترسی ندارد.</li>
        </ul>
      </section>
    </main>
  );
}
