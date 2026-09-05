import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationSettings } from "@/features/notifications/notification-settings";
import { getNotificationSettings } from "@/server/queries/notifications";

export const metadata = { title: "اعلان‌ها" };

export default async function NotificationSettingsPage() {
  const user = await requireUser();
  const settings = await getNotificationSettings(user.id);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <PageHeader
        title="اعلان‌ها"
        description="فقط همان چیزی را روشن بگذار که برایت مفید است. هیچ پیامی حدس نمی‌زند یا سرزنش نمی‌کند."
      />
      <NotificationSettings settings={settings} />
    </main>
  );
}
