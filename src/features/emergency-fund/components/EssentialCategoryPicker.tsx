"use client";

import { CategoryIcon } from "@/components/category-icon";
import { CATEGORY_GROUP_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { EmergencyFundCategory } from "@/server/emergencyFund/getEmergencyFundData";

const GROUPS = ["ESSENTIAL", "LIVING", "LIFESTYLE", "FINANCIAL"] as const;

export function EssentialCategoryPicker({
  categories,
  selectedIds,
  onToggle,
}: {
  categories: EmergencyFundCategory[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((group) => {
        const items = categories.filter((category) => category.group === group);
        if (items.length === 0) {
          return null;
        }
        return (
          <section key={group}>
            <h3 className="mb-2 text-xs text-muted-foreground">{CATEGORY_GROUP_LABEL[group]}</h3>
            <ul className="flex flex-col gap-1">
              {items.map((category) => {
                const checked = selected.has(category.id);
                return (
                  <li key={category.id}>
                    <label
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl px-2 py-2",
                        checked ? "bg-surface-muted" : "hover:bg-surface-muted/60",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-card">
                          <CategoryIcon name={category.icon} />
                        </span>
                        <span className="font-medium">{category.name}</span>
                      </span>
                      <input
                        type="checkbox"
                        name="essentialCategoryIds"
                        value={category.id}
                        checked={checked}
                        onChange={() => onToggle(category.id)}
                        className="size-5 accent-primary"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
