-- CreateEnum
CREATE TYPE "CalendarEventSource" AS ENUM ('MANUAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "FinancialTaskType" AS ENUM ('BILL_DUE', 'BUDGET_CHECK', 'RECURRING_REMINDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FinancialTaskSource" AS ENUM ('RECURRING_TRANSACTION', 'BUDGET');

-- CreateEnum
CREATE TYPE "CheckInMood" AS ENUM ('GOOD', 'NEUTRAL', 'STRESSED');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "source" "CalendarEventSource" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "externalProvider" TEXT,
    "linkedCostEstimate" BIGINT,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "FinancialTaskType" NOT NULL,
    "dueDate" DATE NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "sourceType" "FinancialTaskSource",
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mood" "CheckInMood" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startTime_idx" ON "CalendarEvent"("userId", "startTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_externalId_idx" ON "CalendarEvent"("userId", "externalId");

-- CreateIndex
CREATE INDEX "FinancialTask_userId_dueDate_isCompleted_idx" ON "FinancialTask"("userId", "dueDate", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialTask_userId_sourceType_sourceId_dueDate_key" ON "FinancialTask"("userId", "sourceType", "sourceId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_userId_date_key" ON "DailyCheckIn"("userId", "date");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTask" ADD CONSTRAINT "FinancialTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
