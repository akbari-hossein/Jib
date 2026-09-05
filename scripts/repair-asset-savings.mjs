#!/usr/bin/env node
/**
 * Reviewable repair for asset-savings inflation.
 *
 * Default is dry-run: prints which ASSET_ADD rows look like opening inventory
 * (created with the account) and would be reclassified as OPENING so they stop
 * counting toward this month's Savings figure.
 *
 *   npm run repair:asset-savings
 *   node scripts/repair-asset-savings.mjs --apply
 *
 * Never deletes transactions. Reclassify only.
 */
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const OPENING_WINDOW_MS = 2 * 60 * 1000;

function isLikelyOpening(tx, account, firstId) {
  if (tx.type !== "ASSET_ADD") {
    return false;
  }
  if (tx.movementReason === "OPENING") {
    return false;
  }
  if (tx.movementReason === "CORRECTION" || tx.movementReason === "SALE") {
    return false;
  }
  if (tx.id !== firstId) {
    return false;
  }
  const delta = Math.abs(tx.occurredAt.getTime() - account.createdAt.getTime());
  return delta <= OPENING_WINDOW_MS;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const accounts = await prisma.account.findMany({
      where: { type: "ASSET_HOLDING" },
      include: {
        user: { select: { email: true } },
        outgoingTransactions: {
          where: { type: { in: ["ASSET_ADD", "ASSET_REMOVE"] } },
          orderBy: { occurredAt: "asc" },
        },
      },
    });

    const report = [];
    for (const account of accounts) {
      const first = account.outgoingTransactions[0] ?? null;
      const quantitySum = account.outgoingTransactions.reduce((sum, tx) => {
        const q = tx.quantityDelta ? Number(tx.quantityDelta.toString()) : 0;
        return sum + q;
      }, 0);
      const accountQty = Number(account.quantity.toString());
      const candidates = account.outgoingTransactions.filter((tx) =>
        first ? isLikelyOpening(tx, account, first.id) : false,
      );

      if (candidates.length === 0 && Math.abs(quantitySum - accountQty) < 1e-9) {
        continue;
      }

      report.push({
        accountId: account.id,
        email: account.user.email,
        name: account.name,
        assetType: account.assetType,
        quantity: account.quantity.toString(),
        quantityFromTx: String(quantitySum),
        quantityDrift: Math.abs(quantitySum - accountQty) >= 1e-9,
        reclassify: candidates.map((tx) => ({
          id: tx.id,
          amount: tx.amount.toString(),
          quantityDelta: tx.quantityDelta?.toString() ?? null,
          rateToTomanSnapshot: tx.rateToTomanSnapshot?.toString() ?? null,
          occurredAt: tx.occurredAt.toISOString(),
          currentReason: tx.movementReason,
          nextReason: "OPENING",
        })),
      });
    }

    const tomanToRemove = report
      .flatMap((row) => row.reclassify)
      .reduce((sum, tx) => sum + BigInt(tx.amount), 0n);

    console.log(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          accountsInspected: accounts.length,
          openingRowsToReclassify: report.reduce((n, row) => n + row.reclassify.length, 0),
          tomanThatWouldLeavePeriodSavings: tomanToRemove.toString(),
          accountsAffected: report.filter((row) => row.reclassify.length > 0 || row.quantityDrift).length,
          rows: report,
        },
        null,
        2,
      ),
    );

    if (!APPLY) {
      console.log("\nDry-run only. Re-run with --apply to set movementReason=OPENING on the listed rows.");
      return;
    }

    const ids = report.flatMap((row) => row.reclassify.map((tx) => tx.id));
    if (ids.length === 0) {
      console.log("Nothing to apply.");
      return;
    }

    const updated = await prisma.transaction.updateMany({
      where: { id: { in: ids }, type: "ASSET_ADD" },
      data: { movementReason: "OPENING" },
    });
    console.log(`Applied OPENING to ${updated.count} transaction(s). No rows were deleted.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
