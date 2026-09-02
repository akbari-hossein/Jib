import Link from "next/link";
import { formatCount } from "@/lib/admin/format";
import { buildPageHref } from "@/lib/admin/params";
import { cn } from "@/lib/utils";

export function PaginationBar({
  pathname,
  search,
  page,
  pageCount,
  total,
}: {
  pathname: string;
  search: URLSearchParams;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (total === 0) {
    return null;
  }

  const previous = page > 1 ? buildPageHref(pathname, search, { page: page - 1 }) : null;
  const next = page < pageCount ? buildPageHref(pathname, search, { page: page + 1 }) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        صفحه {formatCount(page)} از {formatCount(pageCount)} · {formatCount(total)} مورد
      </p>
      <div className="flex gap-2">
        <Link
          href={previous ?? pathname}
          aria-disabled={!previous}
          className={cn(
            "inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs",
            !previous && "pointer-events-none opacity-40",
          )}
        >
          قبلی
        </Link>
        <Link
          href={next ?? pathname}
          aria-disabled={!next}
          className={cn(
            "inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs",
            !next && "pointer-events-none opacity-40",
          )}
        >
          بعدی
        </Link>
      </div>
    </div>
  );
}
