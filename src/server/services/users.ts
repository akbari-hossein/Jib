import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";
import { getSubscriptionPriceToman } from "@/lib/subscription/config";
import { SYSTEM_CATEGORIES } from "@/server/services/categories";

type DbClient = Prisma.TransactionClient | typeof prisma;

type NewUserInput = {
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  name?: string | null;
};

export async function createUserWithDefaults(data: NewUserInput, db: DbClient = prisma) {
  const createdAt = new Date();
  return db.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash ?? null,
      googleId: data.googleId ?? null,
      name: data.name ?? null,
      createdAt,
      notificationPref: { create: {} },
      subscription: {
        create: {
          status: "TRIALING",
          trialEndsAt: calculateTrialEndsAt(createdAt),
          priceToman: getSubscriptionPriceToman(),
        },
      },
      categories: {
        create: SYSTEM_CATEGORIES.map((category) => ({
          name: category.name,
          group: category.group,
          kind: category.kind,
          icon: category.icon,
          isSystem: true,
        })),
      },
    },
  });
}
