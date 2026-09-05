import type { AdminAuditAction, Prisma, User } from "@prisma/client";
import { sanitizeAuditMetadata } from "@/lib/admin/audit-meta";
import { prisma } from "@/lib/db/prisma";

export async function writeAdminAuditLog(input: {
  admin: Pick<User, "id" | "email">;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  db?: Prisma.TransactionClient | typeof prisma;
}) {
  const db = input.db ?? prisma;
  const metadata = sanitizeAuditMetadata(input.metadata);
  await db.adminAuditLog.create({
    data: {
      adminId: input.admin.id,
      adminEmail: input.admin.email,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });
}
