import { create } from "zustand";

export type QuickAddType = "EXPENSE" | "INCOME" | "TRANSFER";
export type QuickAddStep = "amount" | "category" | "account" | "transferTo";

type QuickAddState = {
  open: boolean;
  step: QuickAddStep;
  type: QuickAddType;
  digits: string;
  categoryId: string | null;
  accountId: string | null;
  toAccountId: string | null;
  merchant: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  setType: (type: QuickAddType) => void;
  setDigits: (digits: string) => void;
  appendDigit: (digit: string) => void;
  backspace: () => void;
  appendThousand: () => void;
  setCategoryId: (id: string) => void;
  setAccountId: (id: string) => void;
  setToAccountId: (id: string) => void;
  setMerchant: (value: string) => void;
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
};

export const useQuickAddStore = create<QuickAddState>((set) => ({
  ...initial,
  openDrawer: () => set({ open: true, step: "amount" }),
  closeDrawer: () => set({ open: false }),
  setType: (type) => set({ type, categoryId: null, toAccountId: null }),
  setDigits: (digits) => set({ digits }),
  appendDigit: (digit) =>
    set((state) => ({
      digits: `${state.digits}${digit}`.replace(/^0+(?=\d)/, "").slice(0, 15),
    })),
  backspace: () => set((state) => ({ digits: state.digits.slice(0, -1) })),
  appendThousand: () =>
    set((state) => ({
      digits: `${state.digits || "0"}000`.replace(/^0+(?=\d)/, "").slice(0, 15),
    })),
  setCategoryId: (categoryId) => set({ categoryId }),
  setAccountId: (accountId) => set({ accountId }),
  setToAccountId: (toAccountId) => set({ toAccountId }),
  setMerchant: (merchant) => set({ merchant }),
  goTo: (step) => set({ step }),
  reset: () => set({ ...initial, open: false }),
}));
