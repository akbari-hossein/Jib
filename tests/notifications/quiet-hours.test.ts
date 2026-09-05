import { describe, expect, it } from "vitest";
import { clampHour, isInQuietHours } from "@/lib/notifications/quiet-hours";

describe("isInQuietHours", () => {
  it("treats missing bounds as not quiet", () => {
    expect(isInQuietHours(23, null, 7)).toBe(false);
    expect(isInQuietHours(23, 23, null)).toBe(false);
  });

  it("treats equal start and end as disabled", () => {
    expect(isInQuietHours(22, 22, 22)).toBe(false);
  });

  it("handles a same-day window as half-open", () => {
    expect(isInQuietHours(13, 13, 15)).toBe(true);
    expect(isInQuietHours(14, 13, 15)).toBe(true);
    expect(isInQuietHours(15, 13, 15)).toBe(false);
    expect(isInQuietHours(12, 13, 15)).toBe(false);
  });

  it("wraps overnight windows across midnight", () => {
    expect(isInQuietHours(23, 23, 7)).toBe(true);
    expect(isInQuietHours(2, 23, 7)).toBe(true);
    expect(isInQuietHours(7, 23, 7)).toBe(false);
    expect(isInQuietHours(12, 23, 7)).toBe(false);
  });
});

describe("clampHour", () => {
  it("keeps hours in 0–23", () => {
    expect(clampHour(-1)).toBe(0);
    expect(clampHour(24)).toBe(23);
    expect(clampHour(9.8)).toBe(9);
  });
});
