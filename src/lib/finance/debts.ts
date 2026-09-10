import type { DebtStatus, DebtType } from "@prisma/client";

export type DebtSnapshot = {
  type: DebtType;
  remainingAmount: bigint;
  status: DebtStatus;
};

export type ContactBalanceDirection = "OWED_TO_ME" | "I_OWE" | "SETTLED";

export type ContactBalance = {
  netAmount: bigint;
  signedAmount: bigint;
  direction: ContactBalanceDirection;
};

export class SettlementError extends Error {
  constructor(readonly code: "INVALID_AMOUNT" | "OVERPAYMENT" | "ALREADY_SETTLED") {
    super(code);
    this.name = "SettlementError";
  }
}

export class SplitError extends Error {
  constructor(readonly code: "INVALID_COUNT" | "INVALID_AMOUNT") {
    super(code);
    this.name = "SplitError";
  }
}

function isOpenDebt(record: DebtSnapshot): boolean {
  return record.status !== "SETTLED" && record.remainingAmount > 0n;
}

function sumRemaining(records: readonly DebtSnapshot[], type: DebtType): bigint {
  return records.reduce((sum, record) => {
    if (!isOpenDebt(record) || record.type !== type) {
      return sum;
    }
    return sum + record.remainingAmount;
  }, 0n);
}

export function calculateContactBalance(records: readonly DebtSnapshot[]): ContactBalance {
  const owedToMe = sumRemaining(records, "OWED_TO_ME");
  const iOwe = sumRemaining(records, "I_OWE");
  const signedAmount = owedToMe - iOwe;

  if (signedAmount > 0n) {
    return { netAmount: signedAmount, signedAmount, direction: "OWED_TO_ME" };
  }
  if (signedAmount < 0n) {
    return { netAmount: -signedAmount, signedAmount, direction: "I_OWE" };
  }
  return { netAmount: 0n, signedAmount: 0n, direction: "SETTLED" };
}

export function calculateTotalOwedToMe(records: readonly DebtSnapshot[]): bigint {
  return sumRemaining(records, "OWED_TO_ME");
}

export function calculateTotalIOwe(records: readonly DebtSnapshot[]): bigint {
  return sumRemaining(records, "I_OWE");
}

/** Always negative or zero. Owed-to-me amounts are intentionally excluded. */
export function calculateDebtImpactOnAvailableMoney(records: readonly DebtSnapshot[]): bigint {
  return -calculateTotalIOwe(records);
}

/**
 * Integer-safe even split. The first N participants (input order) each get one extra
 * unit, where N = totalAmount % participantCount, so the shares always sum to totalAmount.
 */
export function splitAmountEvenly(totalAmount: bigint, participantCount: number): bigint[] {
  if (!Number.isInteger(participantCount) || participantCount < 1) {
    throw new SplitError("INVALID_COUNT");
  }
  if (totalAmount < 0n) {
    throw new SplitError("INVALID_AMOUNT");
  }

  const count = BigInt(participantCount);
  const base = totalAmount / count;
  const remainder = totalAmount % count;
  const extraUntil = Number(remainder);

  return Array.from({ length: participantCount }, (_, index) =>
    index < extraUntil ? base + 1n : base,
  );
}

export function applySettlement(
  remainingAmount: bigint,
  amount: bigint,
): { remainingAmount: bigint; status: Extract<DebtStatus, "SETTLED" | "PARTIALLY_SETTLED"> } {
  if (amount <= 0n) {
    throw new SettlementError("INVALID_AMOUNT");
  }
  if (remainingAmount <= 0n) {
    throw new SettlementError("ALREADY_SETTLED");
  }
  if (amount > remainingAmount) {
    throw new SettlementError("OVERPAYMENT");
  }

  const remaining = remainingAmount - amount;
  return {
    remainingAmount: remaining,
    status: remaining === 0n ? "SETTLED" : "PARTIALLY_SETTLED",
  };
}

export function planSettlementAllocation(
  debts: readonly { id: string; remainingAmount: bigint }[],
  amount: bigint,
): { id: string; amount: bigint }[] {
  if (amount <= 0n) {
    throw new SettlementError("INVALID_AMOUNT");
  }

  const open = debts.filter((debt) => debt.remainingAmount > 0n);
  const total = open.reduce((sum, debt) => sum + debt.remainingAmount, 0n);
  if (amount > total) {
    throw new SettlementError("OVERPAYMENT");
  }

  let leftover = amount;
  const allocations: { id: string; amount: bigint }[] = [];
  for (const debt of open) {
    if (leftover <= 0n) {
      break;
    }
    const take = leftover < debt.remainingAmount ? leftover : debt.remainingAmount;
    allocations.push({ id: debt.id, amount: take });
    leftover -= take;
  }
  return allocations;
}
