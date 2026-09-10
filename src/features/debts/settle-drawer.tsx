"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { SettleForm } from "@/features/debts/settle-form";
import type { AccountOption } from "@/features/debts/types";

export function SettleDrawer({
  mode,
  id,
  defaultAmount,
  accounts,
  label = "تسویه",
}: {
  mode: "debt" | "contact";
  id: string;
  defaultAmount: string;
  accounts: AccountOption[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!defaultAmount || defaultAmount === "0") {
    return null;
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-overlay" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
            <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
            <Drawer.Title className="px-5 pb-1 text-base font-semibold">تسویه</Drawer.Title>
            <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
              <SettleForm
                mode={mode}
                id={id}
                defaultAmount={defaultAmount}
                accounts={accounts}
                onSuccess={() => setOpen(false)}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
