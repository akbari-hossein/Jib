-- AlterTable
ALTER TABLE "PaymentReceipt" ADD COLUMN "amountToman" INTEGER;

-- Backfill already-approved receipts from the subscription price stored at the time of this migration.
UPDATE "PaymentReceipt" AS receipt
SET "amountToman" = subscription."priceToman"
FROM "Subscription" AS subscription
WHERE receipt."subscriptionId" = subscription."id"
  AND receipt."status" = 'APPROVED'
  AND receipt."amountToman" IS NULL;

-- CreateIndex
CREATE INDEX "PaymentReceipt_status_reviewedAt_idx" ON "PaymentReceipt"("status", "reviewedAt");

-- CreateIndex
CREATE INDEX "PaymentReceipt_userId_status_idx" ON "PaymentReceipt"("userId", "status");
