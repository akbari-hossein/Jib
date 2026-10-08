import { describe, expect, it } from "vitest";
import { hasWriteAccess, isReadOnlyStatus } from "@/lib/subscription/access";
import {
  authorizeAdminList,
  authorizeReceiptReview,
  canSubmitReceipt,
  pickLatestReceipt,
  subscriptionOwnerWhere,
} from "@/lib/subscription/api-access";
import { receiptSubmissionSchema } from "@/lib/subscription/receipt-schema";
import { SUBSCRIPTION_COPY } from "@/lib/subscription/copy";
import { REJECTION_REASON_COPY, isRejectionReasonCode } from "@/lib/subscription/rejection-reasons";
import { validateReceiptImageUpload } from "@/lib/storage/receipt-images";

describe("write access", () => {
  it("allows writes only while TRIALING or ACTIVE", () => {
    expect(hasWriteAccess("TRIALING")).toBe(true);
    expect(hasWriteAccess("ACTIVE")).toBe(true);
    expect(hasWriteAccess("PENDING_REVIEW")).toBe(false);
    expect(hasWriteAccess("EXPIRED")).toBe(false);
    expect(hasWriteAccess("REJECTED")).toBe(false);
  });

  it("marks pending, expired, and rejected as read-only", () => {
    expect(isReadOnlyStatus("EXPIRED")).toBe(true);
    expect(isReadOnlyStatus("REJECTED")).toBe(true);
    expect(isReadOnlyStatus("PENDING_REVIEW")).toBe(true);
    expect(isReadOnlyStatus("ACTIVE")).toBe(false);
  });
});

describe("receipt submission rules", () => {
  it("blocks a second PENDING receipt", () => {
    expect(canSubmitReceipt(1)).toEqual({
      ok: false,
      status: 409,
      error: SUBSCRIPTION_COPY.duplicatePending,
    });
    expect(canSubmitReceipt(0)).toEqual({ ok: true });
  });

  it("requires image or text matching the chosen type", () => {
    expect(receiptSubmissionSchema.safeParse({ type: "IMAGE" }).success).toBe(false);
    expect(receiptSubmissionSchema.safeParse({ type: "TEXT", rawText: "ok" }).success).toBe(false);
    expect(
      receiptSubmissionSchema.safeParse({
        type: "IMAGE",
        imageUrl: "jib-receipt:user-a/abc.jpg",
      }).success,
    ).toBe(true);
    expect(
      receiptSubmissionSchema.safeParse({
        type: "TEXT",
        rawText: "واریز ۵۹۰۰۰ تومان به کارت جیب",
      }).success,
    ).toBe(true);
  });

  it("never takes userId from the body", () => {
    const parsed = receiptSubmissionSchema.safeParse({
      type: "TEXT",
      rawText: "واریز ۵۹۰۰۰ تومان به کارت جیب",
      userId: "attacker",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("userId");
    }
  });
});

describe("admin receipt review authorization", () => {
  const receipt = { id: "r1", subscriptionId: "s1" };

  it("rejects anonymous and non-admin actors", () => {
    const anonymous = authorizeReceiptReview({ actor: null, receipt });
    expect(anonymous).toEqual({ allowed: false, status: 401 });
    expect(
      authorizeReceiptReview({
        actor: { role: "USER", status: "ACTIVE" },
        receipt,
      }),
    ).toEqual({ allowed: false, status: 403 });
  });

  it("does not let an admin mutate a missing receipt", () => {
    expect(
      authorizeReceiptReview({
        actor: { role: "ADMIN", status: "ACTIVE" },
        receipt: null,
      }),
    ).toEqual({ allowed: false, status: 404 });
  });

  it("allows an active admin to review an existing receipt", () => {
    expect(
      authorizeReceiptReview({
        actor: { role: "ADMIN", status: "ACTIVE" },
        receipt,
      }),
    ).toEqual({ allowed: true });
  });

  it("scopes user subscription reads to the session user", () => {
    expect(subscriptionOwnerWhere("user-a")).toEqual({ userId: "user-a" });
  });

  it("blocks a regular user from listing admin receipts", () => {
    expect(authorizeAdminList({ role: "USER", status: "ACTIVE" })).toEqual({
      allowed: false,
      status: 403,
    });
    expect(authorizeAdminList(null)).toEqual({ allowed: false, status: 401 });
  });
});

describe("latest receipt selection", () => {
  it("uses the newest receipt after a series of rejections", () => {
    const latest = pickLatestReceipt([
      { createdAt: new Date("2026-09-01T00:00:00.000Z"), status: "REJECTED" as const },
      { createdAt: new Date("2026-09-03T00:00:00.000Z"), status: "REJECTED" as const },
      { createdAt: new Date("2026-09-05T00:00:00.000Z"), status: "PENDING" as const },
    ]);
    expect(latest?.status).toBe("PENDING");
  });
});

describe("rejection reasons", () => {
  it("exposes only the fixed reason codes", () => {
    expect(isRejectionReasonCode("AMOUNT_MISMATCH")).toBe(true);
    expect(isRejectionReasonCode("free text")).toBe(false);
    expect(REJECTION_REASON_COPY.AMOUNT_MISMATCH).toContain("اشتراک");
  });
});

describe("receipt image validation", () => {
  it("accepts jpeg under the size cap and rejects html or huge files", () => {
    expect(validateReceiptImageUpload({ mimeType: "image/jpeg", size: 1200 })).toEqual({
      ok: true,
      mimeType: "image/jpeg",
    });
    expect(validateReceiptImageUpload({ mimeType: "text/html", size: 1200 }).ok).toBe(false);
    expect(validateReceiptImageUpload({ mimeType: "image/png", size: 9_000_000 }).ok).toBe(false);
  });
});
