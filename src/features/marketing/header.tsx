import Link from "next/link";
import { APP_NAME } from "@/lib/config/app";

const NAV = [
  { href: "/features", label: "امکانات" },
  { href: "/pricing", label: "قیمت" },
  { href: "/faq", label: "سؤال‌ها" },
  { href: "/about", label: "درباره" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <nav aria-label="صفحات عمومی" className="flex items-center gap-1 sm:gap-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ورود
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
          >
            شروع رایگان
          </Link>
        </nav>
      </div>
    </header>
  );
}
