import { addUtcDays } from "@/lib/subscription/addUtcDays";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";
import { createUserWithDefaults } from "@/server/services/users";
import { capReferralReward, daysForReferralNumber, REFERRAL_ANNUAL_CAP_DAYS } from "@/lib/referrals/rules";

export async function createUserWithReferral(input: {
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  name?: string | null;
  referralCode?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const code = input.referralCode?.trim().toUpperCase() || null;
  return prisma.$transaction(async (tx) => {
    const inviter = code
      ? await tx.user.findFirst({
          where: { referralCode: code, status: "ACTIVE" },
          select: { id: true },
        })
      : null;
    if (code && !inviter) throw new Error("INVALID_REFERRAL_CODE");

    const user = await createUserWithDefaults(
      {
        email: input.email,
        passwordHash: input.passwordHash,
        googleId: input.googleId,
        name: input.name,
      },
      tx,
    );

    if (!inviter) return user;
    if (inviter.id === user.id) throw new Error("SELF_REFERRAL");

    // Serialize a referrer's reward sequence and annual cap across concurrent registrations.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${inviter.id}))`;
    const referral = await tx.referral.create({
      data: {
        referrerUserId: inviter.id,
        referredUserId: user.id,
        referralCode: code!,
        createdAt: now,
      },
    });
    const qualifiedCount = await tx.referral.count({ where: { referrerUserId: inviter.id } });
    const cyclePosition = ((qualifiedCount - 1) % 3) + 1;
    const requestedDays = daysForReferralNumber(qualifiedCount);
    const jalaliYear = getTehranJalaliDate(now).year;
    const alreadyGranted = await tx.referralReward.aggregate({
      where: { beneficiaryUserId: inviter.id, jalaliYear, type: "INVITER" },
      _sum: { grantedDays: true },
    });
    const grantedDays = capReferralReward(requestedDays, alreadyGranted._sum.grantedDays ?? 0);

    await tx.referralReward.createMany({
      data: [
        {
          referralId: referral.id,
          beneficiaryUserId: inviter.id,
          type: "INVITER",
          cyclePosition,
          requestedDays,
          grantedDays,
          jalaliYear,
          createdAt: now,
        },
        {
          referralId: referral.id,
          beneficiaryUserId: user.id,
          type: "INVITEE",
          cyclePosition: 0,
          requestedDays: 7,
          grantedDays: 7,
          jalaliYear,
          createdAt: now,
        },
      ],
    });

    if (grantedDays > 0) {
      const inviterSubscription = await tx.subscription.findUniqueOrThrow({
        where: { userId: inviter.id },
      });
      const hasCurrentPaidPeriod =
        inviterSubscription.status === "ACTIVE" &&
        inviterSubscription.currentPeriodEnd !== null &&
        inviterSubscription.currentPeriodEnd > now;
      if (hasCurrentPaidPeriod) {
        await tx.subscription.update({
          where: { userId: inviter.id },
          data: {
            currentPeriodEnd: addUtcDays(inviterSubscription.currentPeriodEnd!, grantedDays),
          },
        });
      } else {
        const base = inviterSubscription.trialEndsAt > now ? inviterSubscription.trialEndsAt : now;
        await tx.subscription.update({
          where: { userId: inviter.id },
          data: { trialEndsAt: addUtcDays(base, grantedDays), status: "TRIALING" },
        });
      }
    }

    const trial = await tx.subscription.findUniqueOrThrow({ where: { userId: user.id } });
    await tx.subscription.update({
      where: { userId: user.id },
      data: { trialEndsAt: addUtcDays(trial.trialEndsAt, 7) },
    });
    return user;
  });
}

export async function getReferralSummary(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } });
  const jalaliYear = getTehranJalaliDate().year;
  const [referrals, rewards] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerUserId: userId },
      orderBy: { createdAt: "desc" },
      include: { rewards: { where: { beneficiaryUserId: userId, type: "INVITER" } } },
    }),
    prisma.referralReward.aggregate({
      where: { beneficiaryUserId: userId, jalaliYear, type: "INVITER" },
      _sum: { grantedDays: true },
    }),
  ]);
  const successfulCount = referrals.length;
  const nextRewardDays = daysForReferralNumber(successfulCount + 1);
  const position = successfulCount % 3;
  return {
    referralCode: user.referralCode,
    successfulCount,
    referrals: referrals.map((referral) => ({
      createdAt: referral.createdAt.toISOString(),
      requestedDays: referral.rewards[0]?.requestedDays ?? 0,
      grantedDays: referral.rewards[0]?.grantedDays ?? 0,
    })),
    annualGrantedDays: rewards._sum.grantedDays ?? 0,
    annualCapDays: REFERRAL_ANNUAL_CAP_DAYS,
    progressCount: position,
    nextRewardDays: Math.min(nextRewardDays, REFERRAL_ANNUAL_CAP_DAYS - (rewards._sum.grantedDays ?? 0)),
  };
}
