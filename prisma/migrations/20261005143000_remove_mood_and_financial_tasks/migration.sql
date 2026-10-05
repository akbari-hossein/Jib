-- DropForeignKey
ALTER TABLE "FinancialTask" DROP CONSTRAINT "FinancialTask_userId_fkey";

-- DropForeignKey
ALTER TABLE "DailyCheckIn" DROP CONSTRAINT "DailyCheckIn_userId_fkey";

-- DropTable
DROP TABLE "FinancialTask";

-- DropTable
DROP TABLE "DailyCheckIn";

-- DropEnum
DROP TYPE "FinancialTaskType";

-- DropEnum
DROP TYPE "FinancialTaskSource";

-- DropEnum
DROP TYPE "CheckInMood";
