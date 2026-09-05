import { formatCount } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export function AdminBarChart({
  data,
  label,
}: {
  data: Array<{ key: string; count: number }>;
  label: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.count));

  if (data.length === 0) {
    return null;
  }

  return (
    <figure className="rounded-3xl border border-border bg-card p-5 shadow-xs">
      <figcaption className="text-sm font-medium">{label}</figcaption>
      <div className="mt-6 flex h-36 items-end gap-1" role="img" aria-label={label}>
        {data.map((item) => (
          <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div
              className={cn(
                "w-full rounded-t-md bg-primary/75",
                item.count === 0 && "bg-surface-muted",
              )}
              style={{ height: `${Math.max(item.count === 0 ? 4 : (item.count / max) * 100, 4)}%` }}
              title={`${item.key}: ${item.count}`}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        بیشترین روز: {formatCount(max)} کاربر جدید
      </p>
    </figure>
  );
}
