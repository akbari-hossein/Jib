import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function deleteUserAndOwnedData(
  userId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await db.transaction.deleteMany({ where: { userId } });
  await db.recurringTransaction.deleteMany({ where: { userId } });
  await db.transactionRule.deleteMany({ where: { userId } });
  await db.budget.deleteMany({ where: { userId } });
  await db.goal.deleteMany({ where: { userId } });
  await db.account.deleteMany({ where: { userId } });
  await db.category.deleteMany({ where: { userId } });
  await db.session.deleteMany({ where: { userId } });
  await db.notificationLog.deleteMany({ where: { userId } });
  await db.userNotificationSetting.deleteMany({ where: { userId } });
  await db.notificationPreference.deleteMany({ where: { userId } });
  await db.pushSubscription.deleteMany({ where: { userId } });
  await db.user.delete({ where: { id: userId } });
}
