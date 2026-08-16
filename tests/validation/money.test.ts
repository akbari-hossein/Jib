import { describe, expect, it } from "vitest";
import { parseTomanInput } from "@/lib/validation/money";

describe("parseTomanInput", () => {
  it("accepts Persian digits and separators", () => {
    expect(parseTomanInput("۲۵۰٬۰۰۰")).toBe(250_000n);
  });

  it("rejects zero unless allowed", () => {
    expect(parseTomanInput("0")).toBeNull();
    expect(parseTomanInput("0", { allowZero: true })).toBe(0n);
  });

  it("rejects empty and oversized values", () => {
    expect(parseTomanInput("")).toBeNull();
    expect(parseTomanInput("1".repeat(16))).toBeNull();
  });
});
