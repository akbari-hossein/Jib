import { prisma } from "@/lib/db/prisma";
import { compareJalaliDate, getTehranJalaliDate, jalaliFromInstant } from "@/lib/dates/tehran";

export async function listRecurring(userId: string) {
  const today = getTehranJalaliDate();
  const items = await prisma.recurringTransaction.findMany({
    where: { userId },
    include: { category: true, account: true },
    orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }],
  });

  return items.map((item) => {
    const nextDate = jalaliFromInstant(item.nextRunAt);
    return {
      ...item,
      nextDate,
      isDue: item.isActive && compareJalaliDate(nextDate, today) <= 0,
    };
  });
}

export type RecurringListItem = Awaited<ReturnType<typeof listRecurring>>[number];
