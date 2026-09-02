import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
