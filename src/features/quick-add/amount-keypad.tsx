import { Delete } from "lucide-react";
import { toPersianDigits } from "@/lib/currency/format";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const;

export function AmountKeypad({
  onDigit,
  onThousand,
  onBackspace,
}: {
  onDigit: (digit: string) => void;
  onThousand: () => void;
  onBackspace: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 min-[390px]:gap-3">
      {KEYS.map((key) => {
        const label = key === "back" ? <Delete className="size-5 rtl:-scale-x-100" /> : toPersianDigits(key);
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
                onThousand();
                return;
              }
              onDigit(key);
            }}
            className={cn(
              "flex h-12 items-center justify-center rounded-2xl bg-surface-muted text-xl font-medium transition-colors duration-150 min-[390px]:h-14",
              "hover:bg-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            )}
            aria-label={key === "back" ? "حذف" : key === "000" ? "سه صفر" : key}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
