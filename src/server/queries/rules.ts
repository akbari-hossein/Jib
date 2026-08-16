import { prisma } from "@/lib/db/prisma";

export async function listRules(userId: string) {
  return prisma.transactionRule.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}
