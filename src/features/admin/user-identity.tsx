import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminUserIdentity({
  name,
  email,
  href,
  className,
}: {
  name: string | null;
  email: string;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="truncate font-medium">{name?.trim() || "بدون نام"}</p>
      <p className="truncate text-xs text-muted-foreground" dir="ltr">
        {email}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("min-w-0 hover:text-primary", className)}>
        {body}
      </Link>
    );
  }

  return <div className={cn("min-w-0", className)}>{body}</div>;
}
