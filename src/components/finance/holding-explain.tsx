import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function HoldingExplain({
  detail,
  className,
}: {
  detail: string;
  className?: string;
}) {
  return (
    <details className={cn("relative inline-flex shrink-0", className)}>
      <summary
        className="flex size-5 cursor-help list-none items-center justify-center rounded-full text-muted-foreground/70 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden"
        aria-label={detail}
      >
        <Info className="size-3.5" aria-hidden />
      </summary>
      <p
        role="tooltip"
        className="absolute end-0 top-full z-20 mt-1 w-max max-w-[18rem] rounded-xl border border-border bg-card px-3 py-2 text-xs leading-6 text-foreground shadow-md"
      >
        {detail}
      </p>
    </details>
  );
}
