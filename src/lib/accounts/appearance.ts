import type { AccountType } from "@prisma/client";

export const ACCOUNT_COLORS = [
  { id: "slate", value: "#6B7C93" },
  { id: "teal", value: "#4F7A6E" },
  { id: "amber", value: "#8A7048" },
  { id: "indigo", value: "#5E6B8A" },
  { id: "rose", value: "#8A5E5E" },
  { id: "violet", value: "#6E5E8A" },
] as const;

export const ACCOUNT_ICONS = [
  "wallet",
  "landmark",
  "credit-card",
  "piggy-bank",
  "banknote",
  "smartphone",
  "coins",
] as const;

export const ACCOUNT_ICON_LABEL: Record<(typeof ACCOUNT_ICONS)[number], string> = {
  wallet: "کیف پول",
  landmark: "بانک",
  "credit-card": "کارت",
  "piggy-bank": "پس‌انداز",
  banknote: "نقد",
  smartphone: "موبایل",
  coins: "سکه",
};

export type AccountIconName = (typeof ACCOUNT_ICONS)[number];
export type AccountColorValue = (typeof ACCOUNT_COLORS)[number]["value"];

const COLOR_VALUES = new Set<string>(ACCOUNT_COLORS.map((item) => item.value));
const ICON_VALUES = new Set<string>(ACCOUNT_ICONS);

export function isAccountColor(value: string): value is AccountColorValue {
  return COLOR_VALUES.has(value);
}

export function isAccountIcon(value: string): value is AccountIconName {
  return ICON_VALUES.has(value);
}

export function parseOptionalAppearance(raw: string): string | null | undefined {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  return value;
}

export function accountFallbackIcon(type: AccountType): AccountIconName {
  switch (type) {
    case "CASH":
      return "banknote";
    case "BANK":
      return "landmark";
    case "CARD":
      return "credit-card";
    case "SAVINGS":
      return "piggy-bank";
    case "ASSET_HOLDING":
      return "coins";
    default:
      return "wallet";
  }
}

export function accountFallbackColor(type: AccountType): AccountColorValue {
  switch (type) {
    case "CASH":
      return "#8A7048";
    case "BANK":
      return "#5E6B8A";
    case "CARD":
      return "#6B7C93";
    case "SAVINGS":
      return "#4F7A6E";
    case "ASSET_HOLDING":
      return "#8A7048";
    default:
      return "#6E5E8A";
  }
}
