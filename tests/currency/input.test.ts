import { describe, expect, it } from "vitest";
import {
  applyTomanInputChange,
  cleanTomanValue,
  formatTomanInput,
  normalizeTomanInput,
  parseTomanInput,
} from "@/lib/currency/input";

describe("formatTomanInput", () => {
  it("groups latin digits with commas while typing", () => {
    expect(formatTomanInput("1000")).toBe("1,000");
    expect(formatTomanInput("15000")).toBe("15,000");
    expect(formatTomanInput("250000")).toBe("250,000");
    expect(formatTomanInput("1500000")).toBe("1,500,000");
    expect(formatTomanInput("25000000")).toBe("25,000,000");
  });

  it("formats bigint values for editing", () => {
    expect(formatTomanInput(8_420_000n)).toBe("8,420,000");
    expect(formatTomanInput(-50_000n, { allowNegative: true })).toBe("-50,000");
  });

  it("keeps empty input empty", () => {
    expect(formatTomanInput("")).toBe("");
  });
});

describe("normalizeTomanInput", () => {
  it("accepts persian digits, separators, and spaces", () => {
    expect(normalizeTomanInput("۲۵۰٬۰۰۰")).toEqual({ digits: "250000", negative: false });
    expect(normalizeTomanInput("1 500 000")).toEqual({ digits: "1500000", negative: false });
    expect(normalizeTomanInput("1,500,000")).toEqual({ digits: "1500000", negative: false });
    expect(normalizeTomanInput("۱,۲۵۰,۰۰۰")).toEqual({ digits: "1250000", negative: false });
    expect(normalizeTomanInput("1۲5۰ 000")).toEqual({ digits: "1250000", negative: false });
    expect(normalizeTomanInput("١٢٥٠٠٠٠")).toEqual({ digits: "1250000", negative: false });
    expect(normalizeTomanInput("۱،۲۵۰،۰۰۰")).toEqual({ digits: "1250000", negative: false });
  });

  it("drops the fractional toman part instead of merging decimals", () => {
    expect(normalizeTomanInput("1,500.00")).toEqual({ digits: "1500", negative: false });
    expect(normalizeTomanInput("2500٫5")).toEqual({ digits: "2500", negative: false });
  });

  it("strips leading zeros", () => {
    expect(normalizeTomanInput("0001500")).toEqual({ digits: "1500", negative: false });
    expect(normalizeTomanInput("0")).toEqual({ digits: "0", negative: false });
  });

  it("clips overly long input instead of overflowing", () => {
    expect(normalizeTomanInput("1".repeat(20)).digits).toHaveLength(15);
  });
});

describe("parseTomanInput", () => {
  it("accepts formatted and persian values as toman integers", () => {
    expect(parseTomanInput("۲۵۰٬۰۰۰")).toBe(250_000n);
    expect(parseTomanInput("1,500,000")).toBe(1_500_000n);
    expect(parseTomanInput("1,500.00")).toBe(1_500n);
    expect(parseTomanInput("۱۲۵۰۰۰۰")).toBe(1_250_000n);
    expect(parseTomanInput("1۲50,000")).toBe(1_250_000n);
    expect(parseTomanInput("1250000")).toBe(1_250_000n);
  });

  it("exposes a clean numeric value for form submission", () => {
    expect(cleanTomanValue("۱,۲۵۰,۰۰۰")).toBe("1250000");
    expect(cleanTomanValue("1,250,000")).toBe("1250000");
    expect(cleanTomanValue("")).toBe("");
    expect(cleanTomanValue("-50,000", { allowNegative: true })).toBe("-50000");
  });

  it("rejects zero unless allowed", () => {
    expect(parseTomanInput("0")).toBeNull();
    expect(parseTomanInput("0", { allowZero: true })).toBe(0n);
  });

  it("rejects empty and oversized values without changing them", () => {
    expect(parseTomanInput("")).toBeNull();
    expect(parseTomanInput("1".repeat(16))).toBeNull();
  });

  it("rejects a minus sign unless negatives are allowed", () => {
    expect(parseTomanInput("-50000")).toBeNull();
    expect(parseTomanInput("-50,000", { allowNegative: true })).toBe(-50_000n);
  });
});

describe("applyTomanInputChange", () => {
  it("keeps the caret after the same digit count", () => {
    const next = applyTomanInputChange("1500000", 7);
    expect(next.formatted).toBe("1,500,000");
    expect(next.caret).toBe(9);
  });

  it("places the caret after a newly typed digit", () => {
    const next = applyTomanInputChange("15,0000", 7);
    expect(next.formatted).toBe("150,000");
    expect(next.caret).toBe(7);
  });

  it("counts persian digits when placing the caret", () => {
    const next = applyTomanInputChange("۱۲۵۰۰۰۰", 7);
    expect(next.formatted).toBe("1,250,000");
    expect(next.caret).toBe(9);
  });

  it("keeps the caret after a persian digit typed in the middle", () => {
    const next = applyTomanInputChange("1,25۵,000", 6);
    expect(next.formatted).toBe("1,255,000");
    expect(next.caret).toBe(5);
  });
});
