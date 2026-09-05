import type { AdminAuditAction, Prisma } from "@prisma/client";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/params";
import { prisma } from "@/lib/db/prisma";

export async function listAdminAuditLogs(input: {
  query: string;
  action?: AdminAuditAction;
  page: number;
}) {
  const clauses: Prisma.AdminAuditLogWhereInput[] = [];
  if (input.action) {
    clauses.push({ action: input.action });
  }
  if (input.query) {
    clauses.push({
      OR: [
        { adminEmail: { contains: input.query, mode: "insensitive" } },
        { targetId: { equals: input.query } },
        { targetType: { contains: input.query, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.AdminAuditLogWhereInput = clauses.length ? { AND: clauses } : {};
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      select: {
        id: true,
        adminEmail: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
        admin: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  return {
    logs,
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}
