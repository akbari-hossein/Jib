import { toLatinDigits } from "@/lib/currency/format";

export const MAX_TOMAN = 10n ** 15n;

export function parseTomanInput(
  raw: string,
  options?: { allowZero?: boolean },
): bigint | null {
  const digits = toLatinDigits(raw).replace(/[^\d]/g, "");
  if (!digits) {
    return options?.allowZero ? 0n : null;
  }

  const value = BigInt(digits);
  if (value > MAX_TOMAN) {
    return null;
  }
  if (value === 0n) {
    return options?.allowZero ? 0n : null;
  }
  return value;
}

export function tomanError(raw: string, options?: { allowZero?: boolean }): string | null {
  const parsed = parseTomanInput(raw, options);
  if (parsed === null) {
    return options?.allowZero ? "مبلغ معتبر نیست." : "مبلغ را وارد کن.";
  }
  return null;
}
