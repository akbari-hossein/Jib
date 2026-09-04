import { toLatinDigits, toPersianDigits, groupThousands } from "@/lib/currency/format";

/** Six decimal places. 2.5 سکه → 2_500_000. */
export const QUANTITY_SCALE = 1_000_000n;
export const QUANTITY_SCALE_DIGITS = 6;

export function parseQuantityToScaled(raw: string): bigint | null {
  const text = toLatinDigits(raw)
    .trim()
    .replace(/,/g, ".")
    .replace(/٫/g, ".")
    .replace(/\s/g, "");
  if (!text || text.startsWith("-")) {
    return null;
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    return null;
  }
  const [wholeRaw, fractionRaw = ""] = text.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  if (whole.length > 12) {
    return null;
  }
  const fraction = fractionRaw.slice(0, QUANTITY_SCALE_DIGITS).padEnd(QUANTITY_SCALE_DIGITS, "0");
  const scaled = BigInt(whole) * QUANTITY_SCALE + BigInt(fraction);
  return scaled;
}

export function formatQuantity(scaled: bigint): string {
  const sign = scaled < 0n ? "−" : "";
  const absolute = scaled < 0n ? -scaled : scaled;
  const whole = absolute / QUANTITY_SCALE;
  const fraction = absolute % QUANTITY_SCALE;
  const wholeText = toPersianDigits(groupThousands(whole));
  if (fraction === 0n) {
    return `${sign}${wholeText}`;
  }
  const fractionDigits = fraction.toString().padStart(QUANTITY_SCALE_DIGITS, "0").replace(/0+$/, "");
  return `${sign}${wholeText}٫${toPersianDigits(fractionDigits)}`;
}

export function decimalStringFromScaled(scaled: bigint): string {
  const sign = scaled < 0n ? "-" : "";
  const absolute = scaled < 0n ? -scaled : scaled;
  const whole = (absolute / QUANTITY_SCALE).toString();
  const fraction = (absolute % QUANTITY_SCALE)
    .toString()
    .padStart(QUANTITY_SCALE_DIGITS, "0")
    .replace(/0+$/, "");
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}
