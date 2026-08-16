import { formatToman } from "@/lib/currency/format";
import { cn } from "@/lib/utils";

export function MoneyDisplay({
  amount,
  className,
  withUnit = true,
}: {
  amount: bigint | string;
  className?: string;
  withUnit?: boolean;
}) {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  return (
    <span className={cn("numeric-display", className)}>
      {formatToman(value, { withUnit })}
    </span>
  );
}
