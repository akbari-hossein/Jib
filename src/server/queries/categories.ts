import { prisma } from "@/lib/db/prisma";

export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ group: "asc" }, { createdAt: "asc" }],
  });
}
