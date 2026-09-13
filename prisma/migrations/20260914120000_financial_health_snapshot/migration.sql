-- CreateTable
CREATE TABLE "FinancialHealthSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "savingsRateScore" INTEGER NOT NULL,
    "budgetAdherenceScore" INTEGER NOT NULL,
    "spendingConsistencyScore" INTEGER NOT NULL,
    "emergencyFundScore" INTEGER NOT NULL,
    "debtBurdenScore" INTEGER NOT NULL,
    "primaryDriver" TEXT,
    "explanation" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialHealthSnapshot_userId_createdAt_idx" ON "FinancialHealthSnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialHealthSnapshot_userId_periodStart_idx" ON "FinancialHealthSnapshot"("userId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialHealthSnapshot_userId_periodStart_key" ON "FinancialHealthSnapshot"("userId", "periodStart");

-- AddForeignKey
ALTER TABLE "FinancialHealthSnapshot" ADD CONSTRAINT "FinancialHealthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
