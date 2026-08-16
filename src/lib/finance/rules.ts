export type RuleMatchField = "MERCHANT" | "NOTE";
export type RuleMatchType = "EXACT" | "CONTAINS";

export type RuleSnapshot = {
  id: string;
  matchField: RuleMatchField;
  matchType: RuleMatchType;
  matchValue: string;
  categoryId: string;
  accountId: string | null;
  priority: number;
  isActive: boolean;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchTransactionRule(
  input: { merchant?: string | null; note?: string | null },
  rules: RuleSnapshot[],
): RuleSnapshot | null {
  const active = rules
    .filter((rule) => rule.isActive)
    .sort((left, right) => right.priority - left.priority || left.matchValue.length - right.matchValue.length);

  const merchant = input.merchant ? normalize(input.merchant) : "";
  const note = input.note ? normalize(input.note) : "";

  for (const rule of active) {
    const needle = normalize(rule.matchValue);
    if (!needle) {
      continue;
    }

    const haystack = rule.matchField === "MERCHANT" ? merchant : note;
    if (!haystack) {
      continue;
    }

    if (rule.matchType === "EXACT" && haystack === needle) {
      return rule;
    }
    if (rule.matchType === "CONTAINS" && haystack.includes(needle)) {
      return rule;
    }
  }

  return null;
}
