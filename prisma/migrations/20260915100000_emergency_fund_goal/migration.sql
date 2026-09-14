-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('CUSTOM', 'EMERGENCY_FUND');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "type" "GoalType" NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN     "targetMonths" INTEGER,
ADD COLUMN     "essentialCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "estimatedMonthlyEssential" BIGINT;

-- CreateIndex
CREATE INDEX "Goal_userId_type_isArchived_idx" ON "Goal"("userId", "type", "isArchived");
