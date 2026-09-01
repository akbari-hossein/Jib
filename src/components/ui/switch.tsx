import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { checked: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        checked ? "bg-primary" : "bg-border",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-card shadow-sm transition-[inset-inline-start] duration-150",
          checked ? "start-5" : "start-0.5",
        )}
      />
    </button>
  );
}
