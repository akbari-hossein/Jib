import Link from "next/link";
import { cn } from "@/lib/utils";

export function PrimaryCta({
  href = "/signup",
  children = "شروع کن",
  className,
}: {
  href?: string;
  children?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SecondaryCta({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}
