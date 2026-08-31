import { describe, expect, it } from "vitest";
import { accountDeletionCopy, canPermanentlyDeleteAccount } from "@/lib/accounts/deletion";

describe("account deletion policy", () => {
  it("allows permanent delete only without transactions or recurring", () => {
    expect(
      canPermanentlyDeleteAccount({ transactionCount: 0, recurringCount: 0, goalCount: 0 }),
    ).toBe(true);
    expect(
      canPermanentlyDeleteAccount({ transactionCount: 0, recurringCount: 0, goalCount: 2 }),
    ).toBe(true);
    expect(
      canPermanentlyDeleteAccount({ transactionCount: 1, recurringCount: 0, goalCount: 0 }),
    ).toBe(false);
    expect(
      canPermanentlyDeleteAccount({ transactionCount: 0, recurringCount: 1, goalCount: 0 }),
    ).toBe(false);
  });

  it("explains why a used account cannot be deleted", () => {
    const copy = accountDeletionCopy({
      transactionCount: 4,
      recurringCount: 1,
      goalCount: 0,
    });
    expect(copy.canDelete).toBe(false);
    expect(copy.description).toContain("بایگانی");
    expect(copy.description).toContain("۴");
  });

  it("warns that linked goals will be detached", () => {
    const copy = accountDeletionCopy({
      transactionCount: 0,
      recurringCount: 0,
      goalCount: 1,
    });
    expect(copy.canDelete).toBe(true);
    expect(copy.description).toContain("هدف");
  });
});
