import type { AssetMovementReason, TransactionType } from "@prisma/client";

export type AssetSavingsMovement = {
  id?: string;
  type: TransactionType | string;
  amount: bigint;
  movementReason: AssetMovementReason | string | null;
};

export type SavingsContribution = {
  id: string | null;
  type: string;
  amount: bigint;
  movementReason: string | null;
  included: boolean;
  contribution: bigint;
  explanation: string;
};

const SAVINGS_INFLOW_REASONS = new Set(["PURCHASE"]);
const SAVINGS_OUTFLOW_REASONS = new Set(["SALE"]);
const NON_SAVINGS_REASONS = new Set(["OPENING", "CORRECTION"]);

function reasonOf(movement: AssetSavingsMovement): string | null {
  return movement.movementReason ?? null;
}

function legacyReason(type: string): "PURCHASE" | "SALE" | null {
  if (type === "ASSET_ADD") {
    return "PURCHASE";
  }
  if (type === "ASSET_REMOVE") {
    return "SALE";
  }
  return null;
}

/**
 * Period extra savings from asset *quantity* movements at their snapshot toman.
 * Opening inventory and corrections never count. Rate changes with no tx never appear here.
 */
export function extraSavingsFromMovements(movements: AssetSavingsMovement[]): bigint {
  return explainAssetSavings(movements).extraSavings;
}

export function costBasisFromMovements(movements: AssetSavingsMovement[]): bigint {
  let basis = 0n;
  for (const movement of movements) {
    if (movement.type === "ASSET_ADD") {
      basis += movement.amount;
    } else if (movement.type === "ASSET_REMOVE") {
      basis -= movement.amount;
    }
  }
  return basis;
}

export function valuationChange(currentValue: bigint | null, costBasis: bigint): bigint | null {
  if (currentValue == null) {
    return null;
  }
  return currentValue - costBasis;
}

export function explainAssetSavings(movements: AssetSavingsMovement[]): {
  extraSavings: bigint;
  lines: SavingsContribution[];
} {
  const lines: SavingsContribution[] = [];
  let extraSavings = 0n;

  for (const movement of movements) {
    const reason = reasonOf(movement) ?? legacyReason(String(movement.type));
    let included = false;
    let contribution = 0n;
    let explanation = "در پس‌انداز دوره نیست";

    if (reason && NON_SAVINGS_REASONS.has(reason)) {
      explanation =
        reason === "OPENING"
          ? "موجودی اولیه — ثبت دارایی موجود، نه پس‌انداز این دوره"
          : "اصلاح مقدار — تراکنش واقعی خرید/فروش نیست";
    } else if (movement.type === "ASSET_ADD" && reason && SAVINGS_INFLOW_REASONS.has(reason)) {
      included = true;
      contribution = movement.amount;
      explanation = "خرید/افزایش دارایی (یک‌بار، با نرخ همان لحظه)";
    } else if (movement.type === "ASSET_REMOVE" && reason && SAVINGS_OUTFLOW_REASONS.has(reason)) {
      included = true;
      contribution = -movement.amount;
      explanation = "فروش/کاهش دارایی — از پس‌انداز دوره کم می‌شود";
    }

    extraSavings += contribution;
    lines.push({
      id: movement.id ?? null,
      type: String(movement.type),
      amount: movement.amount,
      movementReason: reasonOf(movement),
      included,
      contribution,
      explanation,
    });
  }

  return { extraSavings, lines };
}

export function explainPeriodSavings(input: {
  income: bigint;
  expenses: bigint;
  movements: AssetSavingsMovement[];
}): {
  income: bigint;
  expenses: bigint;
  extraSavings: bigint;
  monthlySavings: bigint;
  lines: SavingsContribution[];
} {
  const explained = explainAssetSavings(input.movements);
  return {
    income: input.income,
    expenses: input.expenses,
    extraSavings: explained.extraSavings,
    monthlySavings: input.income - input.expenses + explained.extraSavings,
    lines: explained.lines,
  };
}

export const OPENING_ACCOUNT_WINDOW_MS = 2 * 60 * 1000;

export function isLikelyOpeningBalance(input: {
  type: string;
  occurredAt: Date;
  accountCreatedAt: Date;
  isFirstAssetMovement: boolean;
  movementReason: string | null;
}): boolean {
  if (input.type !== "ASSET_ADD") {
    return false;
  }
  if (input.movementReason === "OPENING") {
    return true;
  }
  if (input.movementReason === "CORRECTION" || input.movementReason === "SALE") {
    return false;
  }
  if (!input.isFirstAssetMovement) {
    return false;
  }
  const delta = Math.abs(input.occurredAt.getTime() - input.accountCreatedAt.getTime());
  return delta <= OPENING_ACCOUNT_WINDOW_MS;
}

export const RATE_UNAVAILABLE_COPY = "قیمت این دارایی موقتاً در دسترس نیست";
export const PARTIAL_FIGURE_COPY = "بدون احتساب دارایی‌های بدون قیمت لحظه‌ای";
export const VALUATION_CHANGE_LABEL = "تغییر ارزش";
