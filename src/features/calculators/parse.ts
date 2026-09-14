import { toLatinDigits } from "@/lib/currency/format";

export function parseDecimalInput(raw: string): number | null {
  const text = toLatinDigits(raw)
    .trim()
    .replace(/[٪%]/g, "")
    .replace(/٫/g, ".")
    .replace(/,/g, ".");

  if (!text) {
    return null;
  }
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    return null;
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function parseIntegerInput(raw: string): number | null {
  const text = toLatinDigits(raw)
    .trim()
    .replace(/[٬,]/g, "");

  if (!text) {
    return null;
  }
  if (!/^-?\d+$/.test(text)) {
    return null;
  }

  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}
