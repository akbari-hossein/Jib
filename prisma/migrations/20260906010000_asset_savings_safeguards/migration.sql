-- CreateEnum
CREATE TYPE "AssetMovementReason" AS ENUM ('OPENING', 'PURCHASE', 'SALE', 'CORRECTION');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "referenceRateId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "movementReason" "AssetMovementReason";

-- Backfill: existing asset rows default to purchase/sale so history stays counted
-- until the reviewable repair script reclassifies opening inventory.
UPDATE "Transaction" SET "movementReason" = 'PURCHASE' WHERE "type" = 'ASSET_ADD' AND "movementReason" IS NULL;
UPDATE "Transaction" SET "movementReason" = 'SALE' WHERE "type" = 'ASSET_REMOVE' AND "movementReason" IS NULL;

-- CreateTable
CREATE TABLE "RateIngestEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "assetType" "ReferenceAssetType",
    "ok" BOOLEAN NOT NULL,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "recorded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateIngestEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RateIngestEvent_source_createdAt_idx" ON "RateIngestEvent"("source", "createdAt");
CREATE INDEX "RateIngestEvent_assetType_createdAt_idx" ON "RateIngestEvent"("assetType", "createdAt");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_referenceRateId_fkey" FOREIGN KEY ("referenceRateId") REFERENCES "ReferenceRate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Quantity cannot go negative (sell/decrease exceeding holdings).
ALTER TABLE "Account" ADD CONSTRAINT "Account_quantity_nonnegative_chk" CHECK ("quantity" >= 0);

-- New asset movements must carry a reason. Existing rows are backfilled above.
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_asset_reason_chk" CHECK (
  ("type" NOT IN ('ASSET_ADD', 'ASSET_REMOVE')) OR ("movementReason" IS NOT NULL)
);

-- Snapshot toman is never a negative or zero placeholder.
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_rate_snapshot_chk" CHECK (
  "rateToTomanSnapshot" IS NULL OR "rateToTomanSnapshot" > 0
);
