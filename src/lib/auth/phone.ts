import { toLatinDigits } from "@/lib/currency/format";

const IRAN_MOBILE =
  /^(?:0|98|\+98)?(9\d{9})$/;

export type PhoneParseResult =
  | { ok: true; e164: string; national: string }
  | { ok: false; error: string };

export function parseIranianMobile(input: string): PhoneParseResult {
  const digits = toLatinDigits(input).replace(/[^\d+]/g, "");
  const match = IRAN_MOBILE.exec(digits);

  if (!match) {
    return { ok: false, error: "شماره موبایل معتبر نیست." };
  }

  const nationalNine = match[1]!;
  return {
    ok: true,
    e164: `+98${nationalNine}`,
    national: `0${nationalNine}`,
  };
}

export function maskPhone(e164: string): string {
  const national = e164.startsWith("+98") ? `0${e164.slice(3)}` : e164;
  if (national.length < 8) {
    return national;
  }
  return `${national.slice(0, 4)}***${national.slice(-3)}`;
}
