import { describe, expect, it } from "vitest";
import { formatAdminReceiptMessage } from "@/lib/notifications/adminNotifier";

describe("admin receipt notifier", () => {
  it("builds the deterministic Telegram template without receipt contents", () => {
    const message = formatAdminReceiptMessage({
      id: "receipt-1",
      userId: "user-1",
      userPhone: "owner@jib.app",
      type: "IMAGE",
      createdAt: new Date("2026-09-15T12:00:00.000Z"),
    });

    expect(message).toContain("رسید جدید ثبت شد.");
    expect(message).toContain("کاربر: owner@jib.app");
    expect(message).toContain("نوع: عکس");
    expect(message).toContain("برای بررسی وارد پنل مدیریت شو.");
    expect(message).not.toContain("receipt-1");
    expect(message).not.toContain("jib-receipt:");
  });
});
