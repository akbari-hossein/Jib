import { describe, expect, it } from "vitest";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";

describe("currency format", () => {
  it("formats toman with Persian digits", () => {
    expect(formatToman(8_420_000n)).toBe("۸٬۴۲۰٬۰۰۰ تومان");
  });

  it("can omit the unit", () => {
    expect(formatToman(480_000n, { withUnit: false })).toBe("۴۸۰٬۰۰۰");
  });

  it("compacts thousands", () => {
    expect(formatCompactToman(480_000n)).toBe("۴۸۰ هزار تومان");
  });

  it("converts latin digits", () => {
    expect(toPersianDigits("12")).toBe("۱۲");
  });
});
