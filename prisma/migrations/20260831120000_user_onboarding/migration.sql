-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing users should not see first-run onboarding.
UPDATE "User" SET "onboardingCompletedAt" = CURRENT_TIMESTAMP WHERE "onboardingCompletedAt" IS NULL;
