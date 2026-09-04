import { Delete } from "lucide-react";
import { toPersianDigits } from "@/lib/currency/format";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const;

export function AmountKeypad({
  onDigit,
  onThousand,
  onBackspace,
  decimal = false,
  onDecimal,
}: {
  onDigit: (digit: string) => void;
  onThousand: () => void;
  onBackspace: () => void;
  decimal?: boolean;
  onDecimal?: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => {
        const isDecimalKey = key === "000" && decimal;
        const label = key === "back" ? <Delete className="size-5" /> : isDecimalKey ? "٫" : toPersianDigits(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === "back") {
                onBackspace();
                return;
              }
              if (key === "000") {
                if (decimal) {
                  onDecimal?.();
                  return;
                }
                onThousand();
                return;
              }
              onDigit(key);
            }}
            className={cn(
              "flex h-14 items-center justify-center rounded-2xl bg-surface-muted text-xl font-medium transition-colors duration-150",
              "hover:bg-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            )}
            aria-label={key === "back" ? "حذف" : isDecimalKey ? "ممیز" : key === "000" ? "سه صفر" : key}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
