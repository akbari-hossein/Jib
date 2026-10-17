import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { GoogleProfile } from "@/lib/auth/google";
import { createUserWithReferral } from "@/server/services/referrals";

export async function findOrCreateGoogleUser(profile: GoogleProfile, referralCode: string | null) {
  const existingByGoogle = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingByGoogle) {
    if (!existingByGoogle.name && profile.name) {
      return prisma.user.update({
        where: { id: existingByGoogle.id },
        data: { name: profile.name },
      });
    }
    return existingByGoogle;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  });
  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.googleId,
        name: existingByEmail.name ?? profile.name,
      },
    });
  }

  try {
    return await createUserWithReferral({
      email: profile.email,
      googleId: profile.googleId,
      name: profile.name,
      referralCode,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.user.findFirst({
        where: {
          OR: [{ googleId: profile.googleId }, { email: profile.email }],
        },
      });
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}
