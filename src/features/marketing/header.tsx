import Link from "next/link";
import { APP_NAME } from "@/lib/config/app";

export function MarketingHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        {APP_NAME}
      </Link>
      <nav className="flex items-center gap-4 text-sm text-foreground/65">
        <Link href="/features" className="hidden hover:text-foreground sm:inline">
          امکانات
        </Link>
        <Link href="/pricing" className="hidden hover:text-foreground sm:inline">
          قیمت
        </Link>
        <Link
          href="/login"
          className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          شروع رایگان
        </Link>
      </nav>
    </header>
  );
}
