import { listAccounts } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { listRules } from "@/server/queries/rules";
import { getLastUsedIds } from "@/server/queries/transactions";

export async function getQuickAddContext(userId: string) {
  const [accounts, categories, lastUsed, rules] = await Promise.all([
    listAccounts(userId, { activeOnly: true }),
    listCategories(userId),
    getLastUsedIds(userId),
    listRules(userId),
  ]);

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      includeInAvailable: account.includeInAvailable,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      group: category.group,
      kind: category.kind,
      icon: category.icon,
    })),
    lastUsed,
    rules: rules
      .filter((rule) => rule.isActive)
      .map((rule) => ({
        id: rule.id,
        matchField: rule.matchField,
        matchType: rule.matchType,
        matchValue: rule.matchValue,
        categoryId: rule.categoryId,
        accountId: rule.accountId,
        priority: rule.priority,
        isActive: rule.isActive,
      })),
  };
}

export type QuickAddContext = Awaited<ReturnType<typeof getQuickAddContext>>;
