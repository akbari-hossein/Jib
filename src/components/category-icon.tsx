import {
  Briefcase,
  Car,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  PiggyBank,
  Plane,
  PlusCircle,
  Repeat,
  Shield,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  zap: Zap,
  landmark: Landmark,
  shield: Shield,
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  car: Car,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  sparkles: Sparkles,
  plane: Plane,
  repeat: Repeat,
  clapperboard: Clapperboard,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  wallet: Wallet,
  briefcase: Briefcase,
  gift: Gift,
  "plus-circle": PlusCircle,
  coins: Coins,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={cn("size-4", className)} strokeWidth={1.8} />;
}
