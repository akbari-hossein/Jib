"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isNotificationRuleKey } from "@/lib/notifications/catalog";
import { clampHour } from "@/lib/notifications/quiet-hours";
import { prisma } from "@/lib/db/prisma";
import { ensureUserNotificationSettings } from "@/server/services/notifications";

export type NotificationActionState = {
  ok: boolean;
  error?: string;
};

function revalidateNotificationSurfaces() {
  revalidatePath("/notifications");
  revalidatePath("/settings/notifications");
  revalidatePath("/home");
  revalidatePath("/more");
}

function optionalHour(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return clampHour(parsed);
}

export async function toggleNotificationRule(ruleKey: string, enabled: boolean) {
  const user = await requireUser();
  if (!isNotificationRuleKey(ruleKey)) {
    return;
  }
  await ensureUserNotificationSettings(user.id);
  await prisma.userNotificationSetting.update({
    where: { userId_ruleKey: { userId: user.id, ruleKey } },
    data: { enabled },
  });
  revalidateNotificationSurfaces();
}

export async function setMuteAll(muted: boolean) {
  const user = await requireUser();
  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, muteAll: muted },
    update: { muteAll: muted },
  });
  revalidateNotificationSurfaces();
}

export async function updateNotificationPreferences(
  _prev: NotificationActionState | undefined,
  formData: FormData,
): Promise<NotificationActionState> {
  const user = await requireUser();
  const dailyAllowanceHour = clampHour(Number(formData.get("dailyAllowanceHour") ?? 9));
  const eveningHour = clampHour(Number(formData.get("eveningHour") ?? 20));
  const preferredHour = eveningHour;
  const quietHoursStart = optionalHour(formData.get("quietHoursStart"));
  const quietHoursEnd = optionalHour(formData.get("quietHoursEnd"));

  try {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferredHour,
        dailyAllowanceHour,
        eveningHour,
        quietHoursStart,
        quietHoursEnd,
      },
      update: {
        preferredHour,
        dailyAllowanceHour,
        eveningHour,
        quietHoursStart,
        quietHoursEnd,
      },
    });
  } catch {
    return { ok: false, error: "ذخیره تنظیمات انجام نشد. دوباره تلاش کن." };
  }

  revalidateNotificationSurfaces();
  return { ok: true };
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await prisma.notificationLog.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateNotificationSurfaces();
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notificationLog.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateNotificationSurfaces();
}
