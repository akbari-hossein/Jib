import type { Account, AccountType, ReferenceAssetType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getTehranJalaliDate, tehranMidnightUtc } from "@/lib/dates/tehran";
import { describeHoldingValue, toAccountSnapshot } from "@/lib/finance/assetHoldings";
import { isReferenceAssetType, type ReferenceAssetType as AssetType } from "@/lib/finance/purchasing-power";
import { parseQuantityToScaled } from "@/lib/finance/quantity";
import { calculateRateMove, describeRateAge, readStaleAfterMs } from "@/lib/finance/rate-freshness";
import { getLatestRate, getLatestRates } from "@/lib/finance/referenceRates";
import type { AccountSnapshot } from "@/lib/finance/types";

export type AccountListItem = {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  quantity: string;
  assetType: ReferenceAssetType | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  includeInAvailable: boolean;
  holdingText: string | null;
  holdingDetail: string | null;
  staleLabel: string | null;
  valueUnavailable: boolean;
  dayMove: { direction: "up" | "down" | "flat"; pct: number } | null;
};

function scaledFromAccount(account: Account): bigint {
  return parseQuantityToScaled(account.quantity.toString()) ?? 0n;
}

export function toAccountListItem(
  account: Account,
  extras?: Partial<
    Pick<
      AccountListItem,
      "holdingText" | "holdingDetail" | "staleLabel" | "dayMove" | "balance" | "valueUnavailable"
    >
  >,
): AccountListItem {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: extras?.balance ?? account.balance.toString(),
    quantity: account.quantity.toString(),
    assetType: account.assetType,
    color: account.color,
    icon: account.icon,
    isActive: account.isActive,
    includeInAvailable: account.includeInAvailable,
    holdingText: extras?.holdingText ?? null,
    holdingDetail: extras?.holdingDetail ?? null,
    staleLabel: extras?.staleLabel ?? null,
    valueUnavailable: extras?.valueUnavailable ?? false,
    dayMove: extras?.dayMove ?? null,
  };
}

export async function listAccounts(userId: string, options?: { activeOnly?: boolean }) {
  return prisma.account.findMany({
    where: {
      userId,
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function hydrateAccountSnapshots(accounts: Account[]): Promise<AccountSnapshot[]> {
  const rates = await getLatestRates();
  return accounts.map((account) =>
    toAccountSnapshot(
      {
        balance: account.balance,
        isActive: account.isActive,
        includeInAvailable: account.includeInAvailable,
        type: account.type,
        assetType: account.assetType && isReferenceAssetType(account.assetType) ? account.assetType : null,
        quantityScaled: scaledFromAccount(account),
      },
      account.assetType && isReferenceAssetType(account.assetType)
        ? (rates.get(account.assetType)?.rate ?? null)
        : null,
    ),
  );
}

export async function listAccountItems(userId: string): Promise<AccountListItem[]> {
  const [accounts, rates] = await Promise.all([listAccounts(userId), getLatestRates()]);
  const todayStart = tehranMidnightUtc(getTehranJalaliDate());
  const staleAfterMs = readStaleAfterMs();
  const now = new Date();

  const previousRates = new Map<AssetType, bigint>();
  await Promise.all(
    [...rates.keys()].map(async (assetType) => {
      const previous = await getLatestRate(assetType, new Date(todayStart.getTime() - 1));
      if (previous) {
        previousRates.set(assetType, previous.rate.rateToToman);
      }
    }),
  );

  return accounts.map((account) => {
    const assetType =
      account.assetType && isReferenceAssetType(account.assetType) ? account.assetType : null;
    const rate = assetType ? (rates.get(assetType)?.rate ?? null) : null;
    const stale = assetType ? (rates.get(assetType)?.isStale ?? false) : false;
    const snapshot = toAccountSnapshot(
      {
        balance: account.balance,
        isActive: account.isActive,
        includeInAvailable: account.includeInAvailable,
        type: account.type,
        assetType,
        quantityScaled: scaledFromAccount(account),
      },
      rate,
    );
    const explained =
      snapshot.holding && snapshot.holding.value != null
        ? describeHoldingValue(snapshot.holding.quantityScaled, snapshot.holding.rate)
        : null;
    const age = rate ? describeRateAge(rate.effectiveAt, now, staleAfterMs) : null;
    const dayMove =
      rate && assetType ? calculateRateMove(rate.rateToToman, previousRates.get(assetType) ?? null) : null;

    return toAccountListItem(account, {
      balance: snapshot.balance.toString(),
      holdingText: explained?.text ?? null,
      holdingDetail: explained?.detail ?? null,
      staleLabel: stale && age ? age.label : null,
      valueUnavailable:
        snapshot.holding != null && snapshot.holding.value == null && snapshot.holding.quantityScaled > 0n,
      dayMove,
    });
  });
}

export async function getLiquidBalance(userId: string): Promise<bigint> {
  const accounts = await listAccounts(userId, { activeOnly: true });
  const snapshots = await hydrateAccountSnapshots(accounts);
  return snapshots
    .filter((account) => account.includeInAvailable)
    .reduce((sum, account) => sum + account.balance, 0n);
}
