import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import {
  ADMIN_PAGE_SIZE,
  type SortDir,
  type UserFilter,
  type UserSort,
  userFilterWhere,
  userOrderBy,
  userSearchWhere,
} from "@/lib/admin/params";
import { prisma } from "@/lib/db/prisma";
import { getAdminUserById } from "@/server/admin/admin-user-query";

const userListSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  lastActiveAt: true,
  onboardingCompletedAt: true,
  _count: {
    select: {
      accounts: true,
      transactions: true,
    },
  },
} satisfies Prisma.UserSelect;

export async function listAdminUsers(input: {
  query: string;
  filter: UserFilter;
  sort: UserSort;
  dir: SortDir;
  page: number;
  now?: Date;
}) {
  const clauses: Prisma.UserWhereInput[] = [userFilterWhere(input.filter, input.now)];
  const search = userSearchWhere(input.query);
  if (search) {
    clauses.push(search);
  }
  const where: Prisma.UserWhereInput = { AND: clauses };
  const skip = (input.page - 1) * ADMIN_PAGE_SIZE;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: [userOrderBy(input.sort, input.dir), { id: "asc" }],
      skip,
      take: ADMIN_PAGE_SIZE,
    }),
  ]);

  return {
    users,
    total,
    page: input.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export type AdminUserListItem = Awaited<ReturnType<typeof listAdminUsers>>["users"][number];

export async function getAdminUserDetail(id: string) {
  const user = await getAdminUserById(id);
  if (!user) {
    notFound();
  }
  return user;
}

export type AdminUserDetail = Awaited<ReturnType<typeof getAdminUserDetail>>;
