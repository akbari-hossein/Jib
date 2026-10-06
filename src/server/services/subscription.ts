import { cache } from "react";
import { Prisma, type ReceiptStatus, type SubscriptionStatus } from "@prisma/client";
import { formatJalaliAbsolute } from "@/lib/admin/format";
import { prisma } from "@/lib/db/prisma";
import { hasWriteAccess, WriteAccessBlockedError } from "@/lib/subscription/access";
import { canSubmitReceipt, pickLatestReceipt } from "@/lib/subscription/api-access";
import { calculateNextPeriodEnd } from "@/lib/subscription/calculateNextPeriodEnd";
import { calculateSubscriptionStatus } from "@/lib/subscription/calculateSubscriptionStatus";
import { calculateTrialDaysRemaining } from "@/lib/subscription/calculateTrialDaysRemaining";
import { calculateLegacyTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";
import { getDestinationCardNumber, getSubscriptionPriceToman } from "@/lib/subscription/config";
import { SUBSCRIPTION_PRICE_TOMAN } from "@/lib/subscription/constants";
import { approvedCopy, SUBSCRIPTION_COPY, writeBlockedCopy } from "@/lib/subscription/copy";
import type { ReceiptSubmissionInput } from "@/lib/subscription/receipt-schema";
import { isRejectionReasonCode } from "@/lib/subscription/rejection-reasons";
import { receiptImageOwnerId } from "@/lib/storage/receipt-images";
import { snapshotApprovalAmount } from "@/lib/subscription/metrics";
import { notifyAdminNewReceipt } from "@/lib/notifications/adminNotifier";

type DbClient = Prisma.TransactionClient | typeof prisma;

const receiptSelect = {
  id: true,
  status: true,
  createdAt: true,
  rejectionReasonCode: true,
  type: true,
  imageUrl: true,
  rawText: true,
  claimedAmount: true,
  claimedTransferDate: true,
  userId: true,
  subscriptionId: true,
} satisfies Prisma.PaymentReceiptSelect;

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
  priceToman: number;
  writeAccess: boolean;
  latestReceipt: {
    id: string;
    status: ReceiptStatus;
    createdAt: Date;
    rejectionReasonCode: string | null;
  } | null;
  cardNumber: string;
};

export async function ensureUserSubscription(userId: string, db: DbClient = prisma, now = new Date()) {
  const existing = await db.subscription.findUnique({
    where: { userId },
    include: { receipts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (existing) {
    return existing;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const trialEndsAt = calculateLegacyTrialEndsAt(user.createdAt);
  const status = calculateSubscriptionStatus({
    now,
    trialEndsAt,
    currentPeriodEnd: null,
    latestReceiptStatus: null,
  });

  return db.subscription.create({
    data: {
      userId,
      trialEndsAt,
      status,
      priceToman: getSubscriptionPriceToman(),
    },
    include: { receipts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

function snapshotFromRow(
  row: {
    trialEndsAt: Date;
    currentPeriodEnd: Date | null;
    priceToman: number;
    receipts: Array<{
      id: string;
      status: ReceiptStatus;
      createdAt: Date;
      rejectionReasonCode: string | null;
    }>;
  },
  now: Date,
): SubscriptionSnapshot {
  const latestReceipt = pickLatestReceipt(row.receipts);
  const status = calculateSubscriptionStatus({
    now,
    trialEndsAt: row.trialEndsAt,
    currentPeriodEnd: row.currentPeriodEnd,
    latestReceiptStatus: latestReceipt?.status ?? null,
  });

  return {
    status,
    trialEndsAt: row.trialEndsAt,
    currentPeriodEnd: row.currentPeriodEnd,
    daysRemaining: calculateTrialDaysRemaining(now, row.trialEndsAt),
    priceToman: row.priceToman || SUBSCRIPTION_PRICE_TOMAN,
    writeAccess: hasWriteAccess(status),
    latestReceipt: latestReceipt
      ? {
          id: latestReceipt.id,
          status: latestReceipt.status,
          createdAt: latestReceipt.createdAt,
          rejectionReasonCode: latestReceipt.rejectionReasonCode,
        }
      : null,
    cardNumber: getDestinationCardNumber(),
  };
}

export async function getComputedSubscription(
  userId: string,
  now = new Date(),
  db: DbClient = prisma,
): Promise<SubscriptionSnapshot> {
  const row = await ensureUserSubscription(userId, db, now);
  return snapshotFromRow(row, now);
}

export const getCachedSubscription = cache(async (userId: string) => getComputedSubscription(userId));

export async function assertWriteAccess(userId: string, now = new Date()) {
  const snapshot = await getComputedSubscription(userId, now);
  if (!snapshot.writeAccess) {
    throw new WriteAccessBlockedError();
  }
}

export async function writeBlockedState(
  userId: string,
): Promise<{ ok: false; error: string } | null> {
  const snapshot = await getComputedSubscription(userId);
  if (snapshot.writeAccess) {
    return null;
  }
  return { ok: false, error: writeBlockedCopy(snapshot.status) };
}

export async function isWriteBlocked(userId: string): Promise<boolean> {
  const snapshot = await getComputedSubscription(userId);
  return !snapshot.writeAccess;
}

export function serializeSubscription(snapshot: SubscriptionSnapshot) {
  return {
    status: snapshot.status,
    trialEndsAt: snapshot.trialEndsAt.toISOString(),
    currentPeriodEnd: snapshot.currentPeriodEnd?.toISOString() ?? null,
    daysRemaining: snapshot.daysRemaining,
    priceToman: snapshot.priceToman,
    writeAccess: snapshot.writeAccess,
    latestReceipt: snapshot.latestReceipt
      ? {
          status: snapshot.latestReceipt.status,
          createdAt: snapshot.latestReceipt.createdAt.toISOString(),
          rejectionReasonCode: snapshot.latestReceipt.rejectionReasonCode,
        }
      : null,
    cardNumber: snapshot.cardNumber,
    approvedMessage:
      snapshot.status === "ACTIVE" && snapshot.currentPeriodEnd
        ? approvedCopy(formatJalaliAbsolute(snapshot.currentPeriodEnd))
        : null,
  };
}

export async function submitPaymentReceipt(input: {
  userId: string;
  userEmail: string;
  body: ReceiptSubmissionInput;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const subscription = await ensureUserSubscription(input.userId, prisma, now);

  const pendingCount = await prisma.paymentReceipt.count({
    where: { userId: input.userId, status: "PENDING" },
  });
  const allowed = canSubmitReceipt(pendingCount);
  if (!allowed.ok) {
    return allowed;
  }

  if (input.body.type === "IMAGE") {
    const ownerId = receiptImageOwnerId(input.body.imageUrl ?? "");
    if (ownerId !== input.userId) {
      return { ok: false as const, status: 400 as const, error: "مدرک پرداخت (عکس یا متن) الزامی است." };
    }
  }

  try {
    const receipt = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentReceipt.create({
        data: {
          subscriptionId: subscription.id,
          userId: input.userId,
          type: input.body.type,
          imageUrl: input.body.type === "IMAGE" ? input.body.imageUrl : null,
          rawText: input.body.type === "TEXT" ? input.body.rawText : null,
          claimedAmount: input.body.claimedAmount ?? null,
          claimedTransferDate: input.body.claimedTransferDate
            ? new Date(input.body.claimedTransferDate)
            : null,
          status: "PENDING",
        },
        select: receiptSelect,
      });

      const snapshot = snapshotFromRow(
        {
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          priceToman: subscription.priceToman,
          receipts: [created],
        },
        now,
      );

      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: snapshot.status },
      });

      return created;
    });

    await notifyAdminNewReceipt({
      id: receipt.id,
      userId: input.userId,
      userPhone: input.userEmail,
      type: receipt.type,
      createdAt: receipt.createdAt,
    });

    return { ok: true as const, status: 201 as const, receiptId: receipt.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, status: 409 as const, error: SUBSCRIPTION_COPY.duplicatePending };
    }
    throw error;
  }
}

export async function listAdminReceipts(status: ReceiptStatus = "PENDING") {
  return prisma.paymentReceipt.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      subscription: { select: { id: true, status: true, priceToman: true } },
    },
  });
}

export async function countPendingReceipts() {
  return prisma.paymentReceipt.count({ where: { status: "PENDING" } });
}

export async function approveReceipt(input: { receiptId: string; adminId: string; now?: Date }) {
  const now = input.now ?? new Date();
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: input.receiptId },
    include: { subscription: { include: { receipts: { orderBy: { createdAt: "desc" }, take: 3 } } } },
  });

  if (!receipt) {
    return { ok: false as const, status: 404 as const, error: "رسید پیدا نشد." };
  }
  if (!receipt.subscription) {
    return { ok: false as const, status: 404 as const, error: "اشتراک پیدا نشد." };
  }
  if (receipt.status !== "PENDING") {
    return { ok: false as const, status: 409 as const, error: "این رسید قبلاً بررسی شده است." };
  }

  const currentPeriodEnd = calculateNextPeriodEnd(now, receipt.subscription.currentPeriodEnd);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.paymentReceipt.update({
      where: { id: receipt.id },
      data: {
        status: "APPROVED",
        reviewedByAdminId: input.adminId,
        reviewedAt: now,
        rejectionReasonCode: null,
        amountToman: snapshotApprovalAmount(receipt.subscription.priceToman),
      },
    });

    return tx.subscription.update({
      where: { id: receipt.subscriptionId },
      data: {
        status: "ACTIVE",
        currentPeriodEnd,
      },
    });
  });

  return { ok: true as const, status: 200 as const, subscription: updated };
}

export async function rejectReceipt(input: {
  receiptId: string;
  adminId: string;
  reasonCode: string;
  now?: Date;
}) {
  if (!isRejectionReasonCode(input.reasonCode)) {
    return { ok: false as const, status: 400 as const, error: "دلیل رد معتبر نیست." };
  }

  const now = input.now ?? new Date();
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: input.receiptId },
    include: { subscription: true },
  });

  if (!receipt) {
    return { ok: false as const, status: 404 as const, error: "رسید پیدا نشد." };
  }
  if (!receipt.subscription) {
    return { ok: false as const, status: 404 as const, error: "اشتراک پیدا نشد." };
  }
  if (receipt.status !== "PENDING") {
    return { ok: false as const, status: 409 as const, error: "این رسید قبلاً بررسی شده است." };
  }

  const updatedReceipt = await prisma.$transaction(async (tx) => {
    const next = await tx.paymentReceipt.update({
      where: { id: receipt.id },
      data: {
        status: "REJECTED",
        reviewedByAdminId: input.adminId,
        reviewedAt: now,
        rejectionReasonCode: input.reasonCode,
      },
    });

    const latest = pickLatestReceipt([next]);
    const status = calculateSubscriptionStatus({
      now,
      trialEndsAt: receipt.subscription.trialEndsAt,
      currentPeriodEnd: receipt.subscription.currentPeriodEnd,
      latestReceiptStatus: latest?.status ?? "REJECTED",
    });

    await tx.subscription.update({
      where: { id: receipt.subscriptionId },
      data: { status },
    });

    return next;
  });

  return { ok: true as const, status: 200 as const, receipt: updatedReceipt };
}

export async function refreshAllSubscriptionStatuses(now = new Date()) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      createdAt: true,
      subscription: {
        include: { receipts: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  let updated = 0;
  for (const user of users) {
    const row = user.subscription ?? (await ensureUserSubscription(user.id, prisma, now));
    const snapshot = snapshotFromRow(row, now);
    if (row.status !== snapshot.status) {
      await prisma.subscription.update({
        where: { id: row.id },
        data: { status: snapshot.status },
      });
      updated += 1;
    }
  }

  return { scanned: users.length, updated };
}
