import { prisma } from "@/lib/db/prisma";
import { NOTIFICATION_RULE_CATALOG } from "@/lib/notifications/catalog";
import { vapidPublicKey } from "@/lib/notifications/vapid";
import { ensureUserNotificationSettings } from "@/server/services/notifications";
import { readNotificationPayload } from "@/server/services/push";

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notificationLog.count({
    where: { userId, readAt: null },
  });
}

export async function listNotificationLogs(userId: string, take = 50) {
  const rows = await prisma.notificationLog.findMany({
    where: { userId },
    orderBy: { sentAt: "desc" },
    take,
  });

  return rows.map((row) => {
    const payload = readNotificationPayload(row.payload);
    return {
      id: row.id,
      ruleKey: row.ruleKey,
      sentAt: row.sentAt,
      readAt: row.readAt,
      title: payload.title,
      body: payload.body,
      href: payload.href,
      explanation: payload.explanation,
    };
  });
}

export type NotificationLogItem = Awaited<ReturnType<typeof listNotificationLogs>>[number];

export async function getNotificationSettings(userId: string) {
  const [{ pref, settings }, rules, pushCount] = await Promise.all([
    ensureUserNotificationSettings(userId),
    prisma.notificationRule.findMany({ orderBy: { key: "asc" } }),
    prisma.pushSubscription.count({ where: { userId } }),
  ]);

  const settingByKey = new Map(settings.map((row) => [row.ruleKey, row]));
  const ruleByKey = new Map(rules.map((row) => [row.key, row]));

  const items = NOTIFICATION_RULE_CATALOG.map((catalog) => {
    const setting = settingByKey.get(catalog.key);
    const rule = ruleByKey.get(catalog.key);
    return {
      key: catalog.key,
      title: rule?.title ?? catalog.title,
      description: catalog.description,
      enabled: setting?.enabled ?? catalog.isActiveByDefault,
      channel: setting?.channel ?? "PUSH",
    };
  });

  return {
    muteAll: pref.muteAll,
    preferredHour: pref.preferredHour,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    dailyAllowanceHour: pref.dailyAllowanceHour,
    eveningHour: pref.eveningHour,
    hasPushSubscription: pushCount > 0,
    vapidPublicKey: vapidPublicKey(),
    items,
  };
}

export type NotificationSettingsDto = Awaited<ReturnType<typeof getNotificationSettings>>;
