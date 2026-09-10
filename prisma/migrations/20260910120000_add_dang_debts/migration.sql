-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('I_OWE', 'OWED_TO_ME');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OPEN', 'PARTIALLY_SETTLED', 'SETTLED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'LOAN_GIVEN';
ALTER TYPE "TransactionType" ADD VALUE 'LOAN_RECEIVED';

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "color" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "DebtType" NOT NULL,
    "originalAmount" BIGINT NOT NULL,
    "remainingAmount" BIGINT NOT NULL,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "accountId" TEXT,
    "status" "DebtStatus" NOT NULL DEFAULT 'OPEN',
    "splitBillId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementPayment" (
    "id" TEXT NOT NULL,
    "debtRecordId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT,
    "note" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitBill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalAmount" BIGINT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "paidByMe" BOOLEAN NOT NULL DEFAULT true,
    "accountId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DebtRecord_transactionId_key" ON "DebtRecord"("transactionId");

-- CreateIndex
CREATE INDEX "DebtRecord_userId_status_idx" ON "DebtRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "DebtRecord_contactId_idx" ON "DebtRecord"("contactId");

-- CreateIndex
CREATE INDEX "DebtRecord_status_idx" ON "DebtRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementPayment_transactionId_key" ON "SettlementPayment"("transactionId");

-- CreateIndex
CREATE INDEX "SettlementPayment_debtRecordId_idx" ON "SettlementPayment"("debtRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitBill_transactionId_key" ON "SplitBill"("transactionId");

-- CreateIndex
CREATE INDEX "SplitBill_userId_idx" ON "SplitBill"("userId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtRecord" ADD CONSTRAINT "DebtRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtRecord" ADD CONSTRAINT "DebtRecord_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtRecord" ADD CONSTRAINT "DebtRecord_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtRecord" ADD CONSTRAINT "DebtRecord_splitBillId_fkey" FOREIGN KEY ("splitBillId") REFERENCES "SplitBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtRecord" ADD CONSTRAINT "DebtRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_debtRecordId_fkey" FOREIGN KEY ("debtRecordId") REFERENCES "DebtRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBill" ADD CONSTRAINT "SplitBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBill" ADD CONSTRAINT "SplitBill_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitBill" ADD CONSTRAINT "SplitBill_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
