-- CreateEnum
CREATE TYPE "ReferenceAssetType" AS ENUM ('USD', 'GOLD_COIN', 'GOLD_GRAM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "referenceAssetPreference" "ReferenceAssetType";

-- CreateTable
CREATE TABLE "ReferenceRate" (
    "id" TEXT NOT NULL,
    "assetType" "ReferenceAssetType" NOT NULL,
    "rateToToman" BIGINT NOT NULL,
    "source" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceRate_assetType_effectiveAt_idx" ON "ReferenceRate"("assetType", "effectiveAt");
