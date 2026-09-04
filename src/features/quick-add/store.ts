import { create } from "zustand";

export type QuickAddType = "EXPENSE" | "INCOME" | "TRANSFER" | "ASSET_ADD" | "ASSET_REMOVE";
export type QuickAddStep = "amount" | "category" | "account" | "transferTo" | "convertTo";

export function isAssetQuickAdd(type: QuickAddType): boolean {
  return type === "ASSET_ADD" || type === "ASSET_REMOVE";
}

type QuickAddState = {
  open: boolean;
  step: QuickAddStep;
  type: QuickAddType;
  digits: string;
  categoryId: string | null;
  accountId: string | null;
  toAccountId: string | null;
  merchant: string;
  convertToCash: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setType: (type: QuickAddType) => void;
  setDigits: (digits: string) => void;
  appendDigit: (digit: string) => void;
  backspace: () => void;
  appendThousand: () => void;
  appendDecimal: () => void;
  setCategoryId: (id: string) => void;
  setAccountId: (id: string) => void;
  setToAccountId: (id: string) => void;
  setMerchant: (value: string) => void;
  setConvertToCash: (value: boolean) => void;
  goTo: (step: QuickAddStep) => void;
  reset: () => void;
};

const initial = {
  open: false,
  step: "amount" as QuickAddStep,
  type: "EXPENSE" as QuickAddType,
  digits: "",
  categoryId: null,
  accountId: null,
  toAccountId: null,
  merchant: "",
  convertToCash: false,
};

function appendMoneyDigit(digits: string, digit: string): string {
  return `${digits}${digit}`.replace(/^0+(?=\d)/, "").slice(0, 15);
}

function appendQuantityDigit(digits: string, digit: string): string {
  if (digit === ".") {
    if (digits.includes(".")) {
      return digits;
    }
    return digits ? `${digits}.` : "0.";
  }
  const next = `${digits}${digit}`.slice(0, 16);
  if (next.includes(".")) {
    const [whole, fraction = ""] = next.split(".");
    return `${whole || "0"}.${fraction.slice(0, 6)}`;
  }
  return next.replace(/^0+(?=\d)/, "") || "0";
}

export const useQuickAddStore = create<QuickAddState>((set) => ({
  ...initial,
  openDrawer: () => set({ open: true, step: "amount" }),
  closeDrawer: () => set({ open: false }),
  setType: (type) =>
    set((state) => ({
      type,
      categoryId: null,
      toAccountId: null,
      accountId: null,
      convertToCash: false,
      digits: isAssetQuickAdd(type) === isAssetQuickAdd(state.type) ? state.digits : "",
    })),
  setDigits: (digits) => set({ digits }),
  appendDigit: (digit) =>
    set((state) => ({
      digits: isAssetQuickAdd(state.type)
        ? appendQuantityDigit(state.digits, digit)
        : appendMoneyDigit(state.digits, digit),
    })),
  backspace: () => set((state) => ({ digits: state.digits.slice(0, -1) })),
  appendThousand: () =>
    set((state) =>
      isAssetQuickAdd(state.type)
        ? state
        : { digits: `${state.digits || "0"}000`.replace(/^0+(?=\d)/, "").slice(0, 15) },
    ),
  appendDecimal: () =>
    set((state) => ({
      digits: isAssetQuickAdd(state.type) ? appendQuantityDigit(state.digits, ".") : state.digits,
    })),
  setCategoryId: (categoryId) => set({ categoryId }),
  setAccountId: (accountId) => set({ accountId }),
  setToAccountId: (toAccountId) => set({ toAccountId }),
  setMerchant: (merchant) => set({ merchant }),
  setConvertToCash: (convertToCash) => set({ convertToCash, toAccountId: null }),
  goTo: (step) => set({ step }),
  reset: () => set({ ...initial, open: false }),
}));
