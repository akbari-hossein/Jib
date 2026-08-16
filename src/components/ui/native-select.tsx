import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
        className,
      )}
      {...props}
    />
  );
}
