"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { Menu } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/lib/admin/labels";
import { cn } from "@/lib/utils";

function navActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const active = navActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center rounded-2xl px-3 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground/70 hover:bg-surface-muted hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({
  name,
  email,
  children,
}: {
  name: string | null;
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[88rem]">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-border bg-card px-4 py-6 lg:flex">
          <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LogoMark className="h-4 w-auto" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">پنل مدیریت</span>
              <span className="block text-[11px] text-muted-foreground">جیب</span>
            </span>
          </Link>
          <nav className="min-h-0 flex-1 overflow-y-auto" aria-label="منوی مدیریت">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="mt-6 border-t border-border pt-4">
            <p className="truncate px-2 text-sm font-medium">{name ?? "مدیر"}</p>
            <p className="truncate px-2 text-xs text-muted-foreground" dir="ltr">
              {email}
            </p>
            <Link
              href="/home"
              className="mt-3 block px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              بازگشت به جیب
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <Drawer.Root open={open} onOpenChange={setOpen}>
                <Drawer.Trigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="lg:hidden"
                    aria-label="باز کردن منو"
                  >
                    <Menu className="size-4" />
                  </Button>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 z-40 bg-overlay" />
                  <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-3xl border border-border bg-card px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                    <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border" />
                    <Drawer.Title className="mb-4 px-2 text-base font-semibold">پنل مدیریت</Drawer.Title>
                    <nav aria-label="منوی مدیریت">
                      <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                    </nav>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
              <div className="min-w-0 lg:hidden">
                <p className="text-sm font-semibold tracking-tight">پنل مدیریت</p>
                <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                  <LogoMark className="h-3 w-auto" title={undefined} />
                  جیب · دسترسی مدیر
                </p>
              </div>
              <p className="hidden text-sm text-muted-foreground lg:block">دسترسی مدیر · داده‌های کاربران محرمانه است</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
