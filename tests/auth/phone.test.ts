import { describe, expect, it } from "vitest";
import { parseIranianMobile, maskPhone } from "@/lib/auth/phone";

describe("parseIranianMobile", () => {
  it("accepts national 09 format", () => {
    const result = parseIranianMobile("09121234567");
    expect(result).toEqual({
      ok: true,
      e164: "+989121234567",
      national: "09121234567",
    });
  });

  it("accepts Persian digits", () => {
    const result = parseIranianMobile("۰۹۱۲۱۲۳۴۵۶۷");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.e164).toBe("+989121234567");
    }
  });

  it("accepts +98 format", () => {
    const result = parseIranianMobile("+989121234567");
    expect(result.ok).toBe(true);
  });

  it("rejects landlines", () => {
    const result = parseIranianMobile("02112345678");
    expect(result.ok).toBe(false);
  });
});

describe("maskPhone", () => {
  it("hides the middle digits", () => {
    expect(maskPhone("+989121234567")).toBe("0912***567");
  });
});
