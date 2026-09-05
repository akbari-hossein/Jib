import { listAccountItems } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { listRules } from "@/server/queries/rules";
import { getLastUsedIds } from "@/server/queries/transactions";

export async function getQuickAddContext(userId: string) {
  const [accountItems, categories, lastUsed, rules] = await Promise.all([
    listAccountItems(userId),
    listCategories(userId),
    getLastUsedIds(userId),
    listRules(userId),
  ]);
  const active = accountItems.filter((account) => account.isActive);
  const cashAccounts = active.filter((account) => account.type !== "ASSET_HOLDING");
  const holdings = active.filter((account) => account.type === "ASSET_HOLDING");

  return {
    accounts: cashAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      includeInAvailable: account.includeInAvailable,
    })),
    holdings: holdings.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      assetType: account.assetType,
      quantity: account.quantity,
      holdingText: account.holdingText,
      balance: account.balance,
      valueUnavailable: account.valueUnavailable,
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
