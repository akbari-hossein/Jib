import Link from "next/link";
import { APP_NAME, APP_NAME_EN } from "@/lib/config/app";

const PRODUCT = [
  { href: "/features", label: "امکانات" },
  { href: "/faq", label: "سؤال‌های رایج" },
] as const;

const GUIDES = [
  { href: "/budgeting", label: "بودجه‌بندی شخصی" },
  { href: "/saving", label: "پس‌انداز و هدف" },
  { href: "/expense-tracking", label: "ثبت هزینه" },
] as const;

const TRUST = [
  { href: "/about", label: "درباره جیب" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/terms", label: "شرایط استفاده" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
          <p className="mt-2 text-sm text-muted-foreground">{APP_NAME_EN}</p>
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
            مدیریت پول شخصی برای ایران. بدون حسابداری، بدون هوش مصنوعی.
          </p>
        </div>
        <FooterColumn title="محصول" items={PRODUCT} />
        <FooterColumn title="راهنما" items={GUIDES} />
        <FooterColumn title="اعتماد" items={TRUST} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>جیب یک برنامه مدیریت پول است، نه بانک و نه نرم‌افزار حسابداری.</p>
          <p>ساخته‌شده توسط <a href="https://akbarihossein.ir" target="_blank" rel="noopener noreferrer">حسین اکبری</a></p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
