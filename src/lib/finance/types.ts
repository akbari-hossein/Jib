import type { AssetType, ReferenceRateSnapshot } from "@/lib/finance/purchasing-power";

export type AssetHolding = {
  assetType: AssetType;
  quantityScaled: bigint;
  value: bigint | null;
  rate: ReferenceRateSnapshot | null;
};

export type AccountSnapshot = {
  balance: bigint;
  isActive: boolean;
  includeInAvailable: boolean;
  holding?: AssetHolding;
};

export type GoalSnapshot = {
  currentAmount: bigint;
  targetAmount: bigint;
  targetDate: Date | null;
  accountId: string | null;
  isArchived: boolean;
};

export type PlannedExpenseSnapshot = {
  amount: bigint;
  nextOccurrence: Date;
  isActive: boolean;
};

export type BudgetStatus = "healthy" | "near" | "over";
