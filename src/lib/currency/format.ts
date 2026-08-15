const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;
const LATIN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function toPersianDigits(value: string | number | bigint): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]!);
}

export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => {
    const index = PERSIAN_DIGITS.indexOf(digit as (typeof PERSIAN_DIGITS)[number]);
    return index >= 0 ? LATIN_DIGITS[index]! : digit;
  });
}

export function groupThousands(value: bigint | number): string {
  const absolute = typeof value === "bigint" ? value : BigInt(Math.trunc(value));
  const sign = absolute < 0n ? "-" : "";
  const digits = (absolute < 0n ? -absolute : absolute).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  return `${sign}${grouped}`;
}

export function formatToman(amount: bigint, options?: { withUnit?: boolean }): string {
  const withUnit = options?.withUnit ?? true;
  const formatted = toPersianDigits(groupThousands(amount));
  return withUnit ? `${formatted} تومان` : formatted;
}

const THOUSAND = 1000n;
const MILLION = 1_000_000n;

export function formatCompactToman(amount: bigint): string {
  const sign = amount < 0n ? "−" : "";
  const absolute = amount < 0n ? -amount : amount;

  if (absolute >= MILLION && absolute % MILLION === 0n) {
    return `${sign}${toPersianDigits(groupThousands(absolute / MILLION))} میلیون تومان`;
  }

  if (absolute >= MILLION) {
    const millions = Number(absolute) / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    const text = Number.isInteger(rounded)
      ? toPersianDigits(String(rounded))
      : toPersianDigits(String(rounded).replace(".", "٫"));
    return `${sign}${text} میلیون تومان`;
  }

  if (absolute >= THOUSAND && absolute % THOUSAND === 0n) {
    return `${sign}${toPersianDigits(groupThousands(absolute / THOUSAND))} هزار تومان`;
  }

  return formatToman(amount);
}
