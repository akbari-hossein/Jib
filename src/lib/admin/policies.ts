import type { UserRole, UserStatus } from "@prisma/client";

export const ADMIN_POLICY_ERRORS = {
  selfStatus: "نمی‌توانی وضعیت حساب خودت را تغییر بدهی.",
  selfRole: "نمی‌توانی نقش خودت را تغییر بدهی.",
  selfDelete: "نمی‌توانی حساب خودت را حذف کنی.",
  lastAdminRole: "حداقل یک مدیر باید در سیستم بماند.",
  lastAdminDelete: "آخرین مدیر را نمی‌شود حذف کرد.",
} as const;

export function canChangeUserStatus(input: {
  actorId: string;
  targetId: string;
}): { ok: true } | { ok: false; error: string } {
  if (input.actorId === input.targetId) {
    return { ok: false, error: ADMIN_POLICY_ERRORS.selfStatus };
  }
  return { ok: true };
}

export function canChangeUserRole(input: {
  actorId: string;
  targetId: string;
  targetRole: UserRole;
  nextRole: UserRole;
  adminCount: number;
}): { ok: true } | { ok: false; error: string } {
  if (input.actorId === input.targetId) {
    return { ok: false, error: ADMIN_POLICY_ERRORS.selfRole };
  }
  if (input.targetRole === "ADMIN" && input.nextRole !== "ADMIN" && input.adminCount <= 1) {
    return { ok: false, error: ADMIN_POLICY_ERRORS.lastAdminRole };
  }
  return { ok: true };
}

export function canDeleteUser(input: {
  actorId: string;
  targetId: string;
  targetRole: UserRole;
  adminCount: number;
}): { ok: true } | { ok: false; error: string } {
  if (input.actorId === input.targetId) {
    return { ok: false, error: ADMIN_POLICY_ERRORS.selfDelete };
  }
  if (input.targetRole === "ADMIN" && input.adminCount <= 1) {
    return { ok: false, error: ADMIN_POLICY_ERRORS.lastAdminDelete };
  }
  return { ok: true };
}

export function nextStatusAction(status: UserStatus): UserStatus {
  return status === "ACTIVE" ? "DISABLED" : "ACTIVE";
}
