"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { QuickAddDrawer } from "@/features/quick-add/quick-add-drawer";
import { useQuickAddStore } from "@/features/quick-add/store";
import type { QuickAddContext } from "@/server/queries/quick-add";

export function QuickAddHost({ context }: { context: QuickAddContext }) {
  const openDrawer = useQuickAddStore((state) => state.openDrawer);
  const hasAccounts = context.accounts.length > 0;

  return (
    <>
      {hasAccounts ? (
        <button
          type="button"
          onClick={openDrawer}
          className="fixed bottom-24 end-5 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="ثبت سریع"
        >
          <Plus className="size-6" />
        </button>
      ) : (
        <Link
          href="/accounts"
          className="fixed bottom-24 end-5 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="افزودن حساب"
        >
          <Plus className="size-6" />
        </Link>
      )}
      <QuickAddDrawer context={context} />
    </>
  );
}
