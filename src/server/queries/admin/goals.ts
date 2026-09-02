import type { Prisma } from "@prisma/client";
import { ADMIN_PAGE_SIZE, type SortDir, userSearchWhere } from "@/lib/admin/params";
import { prisma } from "@/lib/db/prisma";

export async function listAdminGoals(input: {
  query: string;
  status: "all" | "active" | "archived";
  dir: SortDir;
  page: number;
}) {
  const clauses: Prisma.GoalWhereInput[] = [];
  if (input.status === "active") {
    clauses.push({ isArchived: false });
  }
  if (input.status === "archived") {
    clauses.push({ isArchived: true });
  }
  if (input.query) {
    const userMatch = userSearchWhere(input.query);
    clauses.push({
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        ...(userMatch ? [{ user: userMatch }] : []),
      ],
    });
  }

  const where: Prisma.GoalWhereInput = clauses.length ? { AND: clauses } : {};
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, goals] = await Promise.all([
    prisma.goal.count({ where }),
    prisma.goal.findMany({
      where,
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        isArchived: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ createdAt: input.dir }, { id: "asc" }],
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  return {
    goals,
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}
