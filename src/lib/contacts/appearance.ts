import { ACCOUNT_COLORS, isAccountColor, type AccountColorValue } from "@/lib/accounts/appearance";

export const CONTACT_COLORS = ACCOUNT_COLORS;

export function isContactColor(value: string): value is AccountColorValue {
  return isAccountColor(value);
}

export function contactColorForIndex(index: number): AccountColorValue {
  const palette = CONTACT_COLORS;
  return palette[index % palette.length]!.value;
}

export function contactInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]! : "؟";
}
