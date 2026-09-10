"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { DebtForm } from "@/features/debts/debt-form";
import { SplitBillForm } from "@/features/debts/split-form";
import type { AccountOption, ContactOption } from "@/features/debts/types";

export function DangComposer({
  contacts,
  accounts,
  defaultContactId,
}: {
  contacts: ContactOption[];
  accounts: AccountOption[];
  defaultContactId?: string;
}) {
  const [open, setOpen] = useState<"debt" | "split" | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="flex-1" onClick={() => setOpen("debt")}>
          دنگ جدید
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen("split")}>
          تقسیم هزینه
        </Button>
      </div>
      <Drawer.Root
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(null);
          }
        }}
        shouldScaleBackground={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-overlay" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
            <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
            <Drawer.Title className="px-5 pb-1 text-base font-semibold">
              {open === "split" ? "تقسیم هزینه" : "دنگ جدید"}
            </Drawer.Title>
            <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
              {open === "split" ? (
                <SplitBillForm
                  contacts={contacts}
                  accounts={accounts}
                  defaultContactId={defaultContactId}
                  onSuccess={() => setOpen(null)}
                />
              ) : open === "debt" ? (
                <DebtForm
                  contacts={contacts}
                  accounts={accounts}
                  defaultContactId={defaultContactId}
                  onSuccess={() => setOpen(null)}
                />
              ) : null}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
