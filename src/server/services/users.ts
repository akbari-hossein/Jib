import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateTrialEndsAt } from "@/lib/subscription/calculateTrialEndsAt";
import { getSubscriptionPriceToman } from "@/lib/subscription/config";
import { SYSTEM_CATEGORIES } from "@/server/services/categories";
import { randomBytes } from "node:crypto";

type DbClient = Prisma.TransactionClient | typeof prisma;

type NewUserInput = {
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  name?: string | null;
};

async function newReferralCode(db: DbClient): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bytes = randomBytes(8);
    const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    const exists = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("REFERRAL_CODE_GENERATION_FAILED");
}

export async function createUserWithDefaults(data: NewUserInput, db: DbClient = prisma) {
  const createdAt = new Date();
  const referralCode = await newReferralCode(db);
  return db.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash ?? null,
      googleId: data.googleId ?? null,
      name: data.name ?? null,
      referralCode,
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
