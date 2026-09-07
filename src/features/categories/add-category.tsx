"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/features/categories/category-form";

export function AddCategoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <Drawer.Trigger asChild>
        <Button type="button" variant="secondary" size="sm">
          + افزودن دسته‌بندی
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
          <Drawer.Title className="px-5 text-base font-semibold">دسته‌بندی جدید</Drawer.Title>
          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
            <CategoryForm onSuccess={() => setOpen(false)} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
