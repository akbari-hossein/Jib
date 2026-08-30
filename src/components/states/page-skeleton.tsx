import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageSkeleton({
  variant = "app",
  className,
}: {
  variant?: "app" | "article";
  className?: string;
}) {
  if (variant === "article") {
    return (
      <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 py-16", className)}>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="mt-6 h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 px-5 pt-8", className)}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
