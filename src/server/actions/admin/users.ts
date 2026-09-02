"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { UserRole, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/admin";
import {
  canChangeUserRole,
  canChangeUserStatus,
  canDeleteUser,
} from "@/lib/admin/policies";
import { prisma } from "@/lib/db/prisma";
import { writeAdminAuditLog } from "@/server/admin/audit";
import { deleteUserAndOwnedData } from "@/server/admin/users";

export type AdminActionState = {
  ok: boolean;
  error?: string;
};

const userIdSchema = z.string().trim().min(8).max(64);

function revalidateUser(userId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin/analytics");
}

export async function setAdminUserStatus(
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      userId: userIdSchema,
      status: z.enum(["ACTIVE", "DISABLED"]),
    })
    .safeParse({
      userId: formData.get("userId"),
      status: formData.get("status"),
    });
  if (!parsed.success) {
    return { ok: false, error: "درخواست معتبر نیست." };
  }

  const policy = canChangeUserStatus({ actorId: admin.id, targetId: parsed.data.userId });
  if (!policy.ok) {
    return { ok: false, error: policy.error };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, status: true },
    });
    if (!target) {
      return { ok: false, error: "کاربر پیدا نشد." };
    }
    if (target.status === parsed.data.status) {
      return { ok: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: { status: parsed.data.status as UserStatus },
      });
      if (parsed.data.status === "DISABLED") {
        await tx.session.deleteMany({ where: { userId: target.id } });
      }
      await writeAdminAuditLog({
        admin,
        action: parsed.data.status === "DISABLED" ? "USER_DISABLED" : "USER_REACTIVATED",
        targetType: "USER",
        targetId: target.id,
        metadata: { from: target.status, to: parsed.data.status },
        db: tx,
      });
    });
  } catch {
    return { ok: false, error: "تغییر وضعیت انجام نشد." };
  }

  revalidateUser(parsed.data.userId);
  return { ok: true };
}

export async function setAdminUserRole(
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      userId: userIdSchema,
      role: z.enum(["USER", "ADMIN"]),
    })
    .safeParse({
      userId: formData.get("userId"),
      role: formData.get("role"),
    });
  if (!parsed.success) {
    return { ok: false, error: "درخواست معتبر نیست." };
  }

  try {
    const [target, adminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, role: true },
      }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);
    if (!target) {
      return { ok: false, error: "کاربر پیدا نشد." };
    }

    const policy = canChangeUserRole({
      actorId: admin.id,
      targetId: target.id,
      targetRole: target.role,
      nextRole: parsed.data.role as UserRole,
      adminCount,
    });
    if (!policy.ok) {
      return { ok: false, error: policy.error };
    }
    if (target.role === parsed.data.role) {
      return { ok: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: { role: parsed.data.role as UserRole },
      });
      await writeAdminAuditLog({
        admin,
        action: "USER_ROLE_CHANGED",
        targetType: "USER",
        targetId: target.id,
        metadata: { from: target.role, to: parsed.data.role },
        db: tx,
      });
    });
  } catch {
    return { ok: false, error: "تغییر نقش انجام نشد." };
  }

  revalidateUser(parsed.data.userId);
  return { ok: true };
}

export async function resetAdminUserOnboarding(
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = z.object({ userId: userIdSchema }).safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "درخواست معتبر نیست." };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true, onboardingCompletedAt: true },
    });
    if (!target) {
      return { ok: false, error: "کاربر پیدا نشد." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: { onboardingCompletedAt: null },
      });
      await writeAdminAuditLog({
        admin,
        action: "USER_ONBOARDING_RESET",
        targetType: "USER",
        targetId: target.id,
        metadata: {
          hadCompleted: Boolean(target.onboardingCompletedAt),
        },
        db: tx,
      });
    });
  } catch {
    return { ok: false, error: "بازنشانی راهنمای شروع انجام نشد." };
  }

  revalidateUser(parsed.data.userId);
  return { ok: true };
}

export async function deleteAdminUser(
  _prev: AdminActionState | undefined,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      userId: userIdSchema,
      confirm: z.string().trim().email(),
    })
    .safeParse({
      userId: formData.get("userId"),
      confirm: formData.get("confirm"),
    });
  if (!parsed.success) {
    return { ok: false, error: "برای حذف، ایمیل کاربر را دقیق وارد کن." };
  }

  try {
    const [target, adminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, email: true, role: true },
      }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ]);
    if (!target) {
      return { ok: false, error: "کاربر پیدا نشد." };
    }
    if (target.email.toLowerCase() !== parsed.data.confirm.toLowerCase()) {
      return { ok: false, error: "ایمیل تأیید با حساب کاربر یکی نیست." };
    }

    const policy = canDeleteUser({
      actorId: admin.id,
      targetId: target.id,
      targetRole: target.role,
      adminCount,
    });
    if (!policy.ok) {
      return { ok: false, error: policy.error };
    }

    await prisma.$transaction(
      async (tx) => {
        await writeAdminAuditLog({
          admin,
          action: "USER_DELETED",
          targetType: "USER",
          targetId: target.id,
          metadata: { email: target.email, role: target.role },
          db: tx,
        });
        await deleteUserAndOwnedData(target.id, tx);
      },
      { timeout: 20_000 },
    );
  } catch {
    return { ok: false, error: "حذف کاربر انجام نشد." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/goals");
  revalidatePath("/admin/budgets");
  redirect("/admin/users");
}
