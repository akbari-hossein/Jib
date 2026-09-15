import { prisma } from "@/lib/db/prisma";
import {
  adminUsersWhere,
  parseAdminUsersQuery,
  serializeAdminSubscriber,
  type AdminSubscriberDto,
} from "@/lib/subscription/admin-users";

export async function listAdminSubscribers(
  input: ReturnType<typeof parseAdminUsersQuery>,
  now = new Date(),
): Promise<{
  users: AdminSubscriberDto[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const where = adminUsersWhere(input);
  const skip = (input.page - 1) * input.pageSize;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip,
      take: input.pageSize,
    }),
  ]);

  // Paginated users first, then an indexed groupBy for that page only — never load all users to sum client-side.
  // Covering index note: (userId, status, amountToman, reviewedAt) if this join becomes slow at scale.
  const aggregates =
    users.length === 0
      ? []
      : await prisma.paymentReceipt.groupBy({
          by: ["userId"],
          where: {
            userId: { in: users.map((user) => user.id) },
            status: "APPROVED",
          },
          _sum: { amountToman: true },
          _max: { reviewedAt: true },
        });

  const byUser = new Map(
    aggregates.map((row) => [
      row.userId,
      {
        totalPaidToman: row._sum.amountToman ?? 0,
        lastPaymentAt: row._max.reviewedAt,
      },
    ]),
  );

  return {
    users: users.map((user) =>
      serializeAdminSubscriber(
        {
          ...user,
          totalPaidToman: byUser.get(user.id)?.totalPaidToman ?? 0,
          lastPaymentAt: byUser.get(user.id)?.lastPaymentAt ?? null,
        },
        now,
      ),
    ),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
}
