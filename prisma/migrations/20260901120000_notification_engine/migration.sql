-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'IN_APP');

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN "muteAll" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "NotificationPreference" ADD COLUMN "preferredHour" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "NotificationPreference" ADD COLUMN "quietHoursStart" INTEGER;
ALTER TABLE "NotificationPreference" ADD COLUMN "quietHoursEnd" INTEGER;
ALTER TABLE "NotificationPreference" ADD COLUMN "dailyAllowanceHour" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "NotificationPreference" ADD COLUMN "eveningHour" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "NotificationPreference" ADD COLUMN "paceThresholdPct" INTEGER NOT NULL DEFAULT 25;

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActiveByDefault" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'PUSH',
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,

    CONSTRAINT "UserNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dedupeKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRule_key_key" ON "NotificationRule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSetting_userId_ruleKey_key" ON "UserNotificationSetting"("userId", "ruleKey");

-- CreateIndex
CREATE INDEX "UserNotificationSetting_userId_idx" ON "UserNotificationSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_userId_ruleKey_dedupeKey_key" ON "NotificationLog"("userId", "ruleKey", "dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_sentAt_idx" ON "NotificationLog"("userId", "sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_readAt_idx" ON "NotificationLog"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "UserNotificationSetting" ADD CONSTRAINT "UserNotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed system-defined notification rules (not user-editable in MVP)
INSERT INTO "NotificationRule" ("id", "key", "title", "isActiveByDefault") VALUES
('rule_no_transaction_today', 'NO_TRANSACTION_TODAY', 'یادآوری ثبت تراکنش', true),
('rule_budget_threshold', 'BUDGET_THRESHOLD', 'نزدیک شدن به سقف بودجه', true),
('rule_upcoming_recurring', 'UPCOMING_RECURRING', 'خرج تکراری نزدیک', true),
('rule_spending_pace_anomaly', 'SPENDING_PACE_ANOMALY', 'سرعت خرج این هفته', true),
('rule_daily_allowance', 'DAILY_ALLOWANCE', 'سهم امروز', false),
('rule_goal_milestone', 'GOAL_MILESTONE', 'رسیدن به مرحله هدف', true);
