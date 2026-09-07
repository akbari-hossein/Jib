import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationList } from "@/features/notifications/notification-list";
import { listNotificationLogs } from "@/server/queries/notifications";

export const metadata = { title: "اعلان‌ها" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotificationLogs(user.id);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="اعلان‌ها"
        description="هر پیام از یک قاعده مشخص می‌آید. با «چرا؟» حسابش را می‌بینی."
        action={
          <Link href="/settings/notifications" className="text-sm text-primary">
            تنظیمات
          </Link>
        }
      />
      <NotificationList items={items} />
    </main>
  );
}
