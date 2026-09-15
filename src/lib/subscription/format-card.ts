import { toPersianDigits } from "@/lib/currency/format";

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return toPersianDigits(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
}
