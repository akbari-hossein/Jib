import {
  Banknote,
  Coins,
  CreditCard,
  Landmark,
  PiggyBank,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { accountFallbackColor, accountFallbackIcon, type AccountIconName } from "@/lib/accounts/appearance";
import type { AccountType } from "@prisma/client";
import { cn } from "@/lib/utils";

const ICONS: Record<AccountIconName, LucideIcon> = {
  wallet: Wallet,
  landmark: Landmark,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  smartphone: Smartphone,
  coins: Coins,
};

export function AccountGlyph({
  icon,
  type,
  color,
  className,
  size = "md",
}: {
  icon: string | null;
  type: AccountType;
  color: string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const name = (icon && icon in ICONS ? icon : accountFallbackIcon(type)) as AccountIconName;
  const Icon = ICONS[name];
  const background = color || accountFallbackColor(type);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-white",
        size === "md" ? "size-11" : "size-9",
        className,
      )}
      style={{ background }}
      aria-hidden
    >
      <Icon className={size === "md" ? "size-5" : "size-4"} strokeWidth={1.8} />
    </span>
  );
}

export function AccountIconMark({
  name,
  className,
}: {
  name: AccountIconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={cn("size-4", className)} strokeWidth={1.8} />;
}
