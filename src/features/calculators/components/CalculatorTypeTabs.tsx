"use client";

import { CALCULATOR_COPY } from "@/features/calculators/copy";
import type { CalculatorKind } from "@/features/calculators/types";
import { cn } from "@/lib/utils";

const TABS: { id: CalculatorKind; label: string }[] = [
  { id: "loan", label: CALCULATOR_COPY.loanTab },
  { id: "deposit", label: CALCULATOR_COPY.depositTab },
];

export function CalculatorTypeTabs({
  value,
  onChange,
}: {
  value: CalculatorKind;
  onChange: (next: CalculatorKind) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label={CALCULATOR_COPY.title}
      className="grid grid-cols-2 rounded-2xl bg-surface-muted p-1"
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`calculator-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`calculator-panel-${tab.id}`}
            className={cn(
              "h-11 rounded-xl text-sm font-medium transition-colors duration-150",
              selected
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
