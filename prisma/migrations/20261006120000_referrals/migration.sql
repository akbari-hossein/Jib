CREATE TYPE "ReferralRewardType" AS ENUM ('INVITER', 'INVITEE');

ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

UPDATE "User"
SET "referralCode" = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_no_self_referral_check" CHECK ("referrerUserId" <> "referredUserId"),
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "beneficiaryUserId" TEXT NOT NULL,
    "type" "ReferralRewardType" NOT NULL,
    "cyclePosition" INTEGER NOT NULL,
    "requestedDays" INTEGER NOT NULL,
    "grantedDays" INTEGER NOT NULL,
    "jalaliYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReferralReward_cyclePosition_check" CHECK ("cyclePosition" BETWEEN 0 AND 3),
    CONSTRAINT "ReferralReward_requestedDays_check" CHECK ("requestedDays" >= 0),
    CONSTRAINT "ReferralReward_grantedDays_check" CHECK ("grantedDays" >= 0 AND "grantedDays" <= "requestedDays")
);

CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX "Referral_referrerUserId_createdAt_idx" ON "Referral"("referrerUserId", "createdAt");
CREATE UNIQUE INDEX "ReferralReward_referralId_type_key" ON "ReferralReward"("referralId", "type");
CREATE INDEX "ReferralReward_beneficiaryUserId_jalaliYear_type_idx" ON "ReferralReward"("beneficiaryUserId", "jalaliYear", "type");

ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey"
    FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey"
    FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey"
    FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_beneficiaryUserId_fkey"
    FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
