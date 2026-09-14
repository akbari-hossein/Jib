import { formatToman, groupThousands, toPersianDigits } from "@/lib/currency/format";

export function roundToman(amount: number): bigint {
  if (!Number.isFinite(amount)) {
    return 0n;
  }
  return BigInt(Math.round(amount));
}

export function formatCalculatorToman(
  amount: number,
  options?: { withUnit?: boolean },
): string {
  return formatToman(roundToman(amount), options);
}

export function formatFaNumber(value: number, maxFractionDigits = 4): string {
  const normalized = Number(value.toFixed(maxFractionDigits));
  const [integerPart, fractionPart] = String(normalized).split(".");
  const grouped = toPersianDigits(groupThousands(Number(integerPart)));
  if (!fractionPart) {
    return grouped;
  }
  return `${grouped}٫${toPersianDigits(fractionPart)}`;
}

export function formatPercent(value: number): string {
  return `${formatFaNumber(value)}٪`;
}
