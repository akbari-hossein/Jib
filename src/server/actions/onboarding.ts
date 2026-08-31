"use server";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function markOnboardingDone(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (user.onboardingCompletedAt) {
    return { ok: true };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompletedAt: new Date() },
  });

  return { ok: true };
}
