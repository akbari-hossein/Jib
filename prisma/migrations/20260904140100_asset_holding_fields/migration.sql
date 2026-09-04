-- AlterTable
ALTER TABLE "Account" ADD COLUMN "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0;
ALTER TABLE "Account" ADD COLUMN "assetType" "ReferenceAssetType";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "quantityDelta" DECIMAL(18,6);
ALTER TABLE "Transaction" ADD COLUMN "rateToTomanSnapshot" BIGINT;
ALTER TABLE "Transaction" ADD COLUMN "linkedCashTransactionId" TEXT;

CREATE UNIQUE INDEX "Transaction_linkedCashTransactionId_key" ON "Transaction"("linkedCashTransactionId");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_linkedCashTransactionId_fkey" FOREIGN KEY ("linkedCashTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "GoalFunding" (
    "goalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "GoalFunding_pkey" PRIMARY KEY ("goalId","accountId")
);

CREATE INDEX "GoalFunding_accountId_idx" ON "GoalFunding"("accountId");

ALTER TABLE "GoalFunding" ADD CONSTRAINT "GoalFunding_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalFunding" ADD CONSTRAINT "GoalFunding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
