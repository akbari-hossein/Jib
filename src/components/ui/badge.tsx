import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        muted: "bg-surface-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        income: "bg-income/10 text-income",
        expense: "bg-expense/10 text-expense",
        savings: "bg-savings/10 text-savings",
        warning: "bg-warning/15 text-foreground",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
