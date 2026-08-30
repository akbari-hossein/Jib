import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
        className,
      )}
      {...props}
    />
  );
}
