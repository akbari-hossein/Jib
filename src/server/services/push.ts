import type { Prisma } from "@prisma/client";
import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";
import { vapidConfig } from "@/lib/notifications/vapid";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

let vapidConfigured = false;

function ensureVapid(): boolean {
  const config = vapidConfig();
  if (!config) {
    return false;
  }
  if (!vapidConfigured) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    vapidConfigured = true;
  }
  return true;
}

function isGonePushError(error: unknown): boolean {
  if (typeof error !== "object" || error == null || !("statusCode" in error)) {
    return false;
  }
  const statusCode = error.statusCode;
  return statusCode === 404 || statusCode === 410;
}

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<"sent" | "gone" | "skipped" | "failed"> {
  if (!ensureVapid()) {
    return "skipped";
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return "sent";
  } catch (error) {
    if (isGonePushError(error)) {
      return "gone";
    }
    return "failed";
  }
}

export async function deliverPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) {
    return;
  }

  const stale: string[] = [];
  await Promise.all(
    subscriptions.map(async (subscription) => {
      const result = await sendWebPush(subscription, payload);
      if (result === "gone") {
        stale.push(subscription.id);
      }
    }),
  );

  if (stale.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
  }
}

export async function upsertPushSubscription(
  userId: string,
  input: { endpoint: string; p256dh: string; auth: string; userAgent?: string | null },
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
    update: {
      userId,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

export type NotificationPayloadView = {
  title: string;
  body: string;
  href: string;
  explanation: string;
};

export function readNotificationPayload(value: Prisma.JsonValue): NotificationPayloadView {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { title: "جیب", body: "", href: "/notifications", explanation: "" };
  }
  const record = value as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : "جیب",
    body: typeof record.body === "string" ? record.body : "",
    href: typeof record.href === "string" ? record.href : "/notifications",
    explanation: typeof record.explanation === "string" ? record.explanation : "",
  };
}
