import { describe, expect, it } from "vitest";
import {
  financialHealthOwnerId,
  financialHealthQuerySchema,
  healthHistoryWhere,
  selectSnapshotsForUser,
} from "@/lib/api/financial-health-access";

describe("financial health API ownership", () => {
  it("uses the session user and ignores a query-string userId", () => {
    const params = new URLSearchParams("userId=other-user&months=12");
    expect(financialHealthOwnerId({ id: "session-user" }, params)).toBe("session-user");
    expect(financialHealthOwnerId(null, params)).toBeNull();
  });

  it("scopes snapshot history to the authenticated user only", () => {
    expect(healthHistoryWhere("user-a", 12)).toEqual({
      where: { userId: "user-a" },
      orderBy: { periodStart: "asc" },
      take: 12,
    });
  });

  it("never returns another user's snapshot from a mixed list", () => {
    const rows = [
      { id: "1", userId: "user-a", totalScore: 71 },
      { id: "2", userId: "user-b", totalScore: 99 },
    ];
    expect(selectSnapshotsForUser(rows, "user-a")).toEqual([
      { id: "1", userId: "user-a", totalScore: 71 },
    ]);
  });

  it("rejects out-of-range months and ignores unknown userId fields", () => {
    expect(financialHealthQuerySchema.safeParse({ months: 3 }).success).toBe(false);
    const parsed = financialHealthQuerySchema.safeParse({ months: 12, userId: "other-user" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ months: 12 });
    }
  });
});
