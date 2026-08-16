import { describe, expect, it } from "vitest";
import { matchTransactionRule, type RuleSnapshot } from "@/lib/finance/rules";

function rule(partial: Partial<RuleSnapshot> & Pick<RuleSnapshot, "matchValue" | "categoryId">): RuleSnapshot {
  return {
    id: partial.id ?? partial.matchValue,
    matchField: partial.matchField ?? "MERCHANT",
    matchType: partial.matchType ?? "CONTAINS",
    matchValue: partial.matchValue,
    categoryId: partial.categoryId,
    accountId: partial.accountId ?? null,
    priority: partial.priority ?? 0,
    isActive: partial.isActive ?? true,
  };
}

describe("matchTransactionRule", () => {
  it("maps Snapp to transportation with a contains rule", () => {
    const matched = matchTransactionRule({ merchant: "Snapp Ride" }, [
      rule({ matchValue: "snapp", categoryId: "transport" }),
    ]);
    expect(matched?.categoryId).toBe("transport");
  });

  it("prefers exact matches with higher priority", () => {
    const matched = matchTransactionRule({ merchant: "SnappFood" }, [
      rule({ matchValue: "snapp", categoryId: "transport", priority: 0 }),
      rule({
        matchValue: "snappfood",
        categoryId: "food",
        matchType: "EXACT",
        priority: 10,
      }),
    ]);
    expect(matched?.categoryId).toBe("food");
  });

  it("ignores inactive rules", () => {
    const matched = matchTransactionRule({ merchant: "Snapp" }, [
      rule({ matchValue: "snapp", categoryId: "transport", isActive: false }),
    ]);
    expect(matched).toBeNull();
  });
});
