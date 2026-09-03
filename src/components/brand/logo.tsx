import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { JIB_MARK_BODY_PATH, JIB_MARK_FLAP_PATH, JIB_MARK_VIEWBOX } from "@/lib/brand/mark";
import { APP_NAME } from "@/lib/config/app";
import { cn } from "@/lib/utils";

const MARK_SIZE = {
  sm: "h-5 w-auto",
  md: "h-[1.625rem] w-auto",
} as const;

const WORDMARK_SIZE = {
  sm: "text-sm font-semibold tracking-tight",
  md: "text-lg font-semibold tracking-tight",
} as const;

export function LogoMark({
  className,
  title,
  ...props
}: ComponentPropsWithoutRef<"svg"> & { title?: string }) {
  return (
    <svg
      viewBox={JIB_MARK_VIEWBOX}
      fill="currentColor"
      className={cn("block shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d={JIB_MARK_FLAP_PATH} />
      <path d={JIB_MARK_BODY_PATH} />
    </svg>
  );
}

export function Logo({
  href,
  wordmark = true,
  size = "md",
  className,
}: {
  href?: string;
  wordmark?: boolean;
  size?: keyof typeof MARK_SIZE;
  className?: string;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={MARK_SIZE[size]} title={wordmark ? undefined : APP_NAME} />
      {wordmark ? <span className={WORDMARK_SIZE[size]}>{APP_NAME}</span> : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center text-foreground transition-opacity hover:opacity-75"
      aria-label={APP_NAME}
    >
      {content}
    </Link>
  );
}
