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
  type LucideIcon,
} from "lucide-react";
import { isCategoryIcon, type CategoryIconName } from "@/lib/categories/icons";
import { cn } from "@/lib/utils";

export {
  CATEGORY_ICON_LABEL,
  CATEGORY_ICONS,
  defaultCategoryIcon,
  isCategoryIcon,
  type CategoryIconName,
} from "@/lib/categories/icons";

const ICONS: Record<CategoryIconName, LucideIcon> = {
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
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = isCategoryIcon(name) ? ICONS[name] : Sparkles;
  return <Icon className={cn("size-4", className)} strokeWidth={1.8} />;
}
