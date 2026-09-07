import { isTomanDigit, toLatinDigits } from "@/lib/currency/format";

export const MAX_TOMAN = 10n ** 15n;
export const MAX_TOMAN_DIGITS = 15;
export const TOMAN_INPUT_SEPARATOR = ",";

const DECIMAL_MARKERS = /[.\٫]/;

export type TomanInputOptions = {
  allowZero?: boolean;
  allowNegative?: boolean;
  maxDigits?: number;
  clip?: boolean;
};

export type NormalizedTomanInput = {
  digits: string;
  negative: boolean;
};

function stripFractionalPart(raw: string): string {
  const decimalAt = raw.search(DECIMAL_MARKERS);
  if (decimalAt < 0) {
    return raw;
  }
  return raw.slice(0, decimalAt);
}

export function normalizeTomanInput(
  raw: string,
  options?: Pick<TomanInputOptions, "allowNegative" | "maxDigits" | "clip">,
): NormalizedTomanInput {
  const maxDigits = options?.maxDigits ?? MAX_TOMAN_DIGITS;
  const clip = options?.clip ?? true;
  let text = toLatinDigits(raw).replace(/[\s\u00a0\u2009\u202f]/g, "");
  text = text.replace(/[٬،]/g, ",").replace(/−/g, "-");

  let negative = false;
  if (text.startsWith("-")) {
    negative = Boolean(options?.allowNegative);
    text = text.slice(1);
  } else if (text.includes("-") && options?.allowNegative) {
    negative = true;
    text = text.replace(/-/g, "");
  } else {
    text = text.replace(/-/g, "");
  }

  text = stripFractionalPart(text);
  let digits = text.replace(/[^\d]/g, "");
  digits = digits.replace(/^0+(?=\d)/, "");
  if (clip && digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits);
  }

  if (!options?.allowNegative) {
    negative = false;
  }

  return { digits, negative };
}

export function formatTomanInput(
  raw: string | number | bigint,
  options?: Pick<TomanInputOptions, "allowNegative" | "maxDigits">,
): string {
  if (typeof raw === "bigint" || typeof raw === "number") {
    const negative = raw < 0 && Boolean(options?.allowNegative);
    const absolute =
      typeof raw === "bigint"
        ? (raw < 0n ? -raw : raw).toString()
        : String(Math.trunc(Math.abs(raw)));
    return formatTomanDigits(absolute, negative, options?.maxDigits);
  }

  const normalized = normalizeTomanInput(raw, options);
  return formatTomanDigits(normalized.digits, normalized.negative, options?.maxDigits);
}

export function formatTomanDigits(
  digits: string,
  negative = false,
  maxDigits = MAX_TOMAN_DIGITS,
): string {
  const clipped = digits.slice(0, maxDigits);
  if (!clipped) {
    return negative ? "-" : "";
  }
  const grouped = clipped.replace(/\B(?=(\d{3})+(?!\d))/g, TOMAN_INPUT_SEPARATOR);
  return negative ? `-${grouped}` : grouped;
}

export function digitCountBefore(value: string, caret: number): number {
  const slice = value.slice(0, Math.max(0, caret));
  let count = 0;
  for (const char of slice) {
    if (isTomanDigit(char)) {
      count += 1;
    }
  }
  return count;
}

export function caretFromDigitCount(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) {
    return formatted.startsWith("-") ? 1 : 0;
  }

  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (isTomanDigit(formatted[index])) {
      seen += 1;
      if (seen === digitsBefore) {
        return index + 1;
      }
    }
  }
  return formatted.length;
}

export function cleanTomanValue(
  raw: string,
  options?: Pick<TomanInputOptions, "allowNegative" | "maxDigits">,
): string {
  const normalized = normalizeTomanInput(raw, options);
  if (!normalized.digits) {
    return "";
  }
  return normalized.negative ? `-${normalized.digits}` : normalized.digits;
}

export function applyTomanInputChange(
  nextRaw: string,
  caret: number,
  options?: Pick<TomanInputOptions, "allowNegative" | "maxDigits">,
): { formatted: string; caret: number; digits: string; negative: boolean } {
  const digitsBefore = digitCountBefore(nextRaw, caret);
  const normalized = normalizeTomanInput(nextRaw, options);
  const formatted = formatTomanDigits(
    normalized.digits,
    normalized.negative,
    options?.maxDigits,
  );
  return {
    formatted,
    caret: caretFromDigitCount(formatted, digitsBefore),
    digits: normalized.digits,
    negative: normalized.negative,
  };
}

export function parseTomanInput(
  raw: string,
  options?: TomanInputOptions,
): bigint | null {
  const latin = toLatinDigits(raw).trim();
  if (!latin) {
    return options?.allowZero ? 0n : null;
  }

  const hasMinus = /[-−]/.test(latin);
  if (hasMinus && !options?.allowNegative) {
    return null;
  }

  const normalized = normalizeTomanInput(latin, {
    allowNegative: options?.allowNegative,
    clip: false,
  });
  if (!normalized.digits) {
    return options?.allowZero && !normalized.negative ? 0n : null;
  }

  const value = BigInt(normalized.digits);
  if (value > MAX_TOMAN) {
    return null;
  }
  if (value === 0n) {
    if (!options?.allowZero) {
      return null;
    }
    return 0n;
  }
  return normalized.negative ? -value : value;
}

export function tomanError(raw: string, options?: TomanInputOptions): string | null {
  const parsed = parseTomanInput(raw, options);
  if (parsed === null) {
    return options?.allowZero ? "مبلغ معتبر نیست." : "مبلغ را وارد کن.";
  }
  return null;
}
