"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { categoryDeletionCopy, type CategoryDependents } from "@/lib/categories/deletion";
import { CATEGORY_GROUP_LABEL, TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { deleteCategory, getCategoryDependents } from "@/server/actions/categories";
import type { CategoryGroup, CategoryKind } from "@prisma/client";

export type CategoryListItem = {
  id: string;
  name: string;
  icon: string;
  kind: CategoryKind;
  group: CategoryGroup;
  isSystem: boolean;
};

export function CategoryList({ categories }: { categories: CategoryListItem[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<CategoryListItem | null>(null);
  const [dependents, setDependents] = useState<CategoryDependents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, startChecking] = useTransition();

  const groups = ["ESSENTIAL", "LIVING", "LIFESTYLE", "FINANCIAL"] as const;

  function startDelete(category: CategoryListItem) {
    setError(null);
    setPendingId(category.id);
    startChecking(async () => {
      const result = await getCategoryDependents(category.id);
      if (!result.ok || !result.dependents) {
        setError(result.error ?? "وضعیت دسته‌بندی خوانده نشد.");
        setPendingId(null);
        return;
      }
      setDependents(result.dependents);
      setConfirming(category);
      setPendingId(null);
    });
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {groups.map((group) => {
          const items = categories.filter((category) => category.group === group);
          if (items.length === 0) {
            return null;
          }
          return (
            <section key={group} className="rounded-3xl border border-border bg-card p-5">
              <h2 className="mb-3 text-sm text-foreground/45">{CATEGORY_GROUP_LABEL[group]}</h2>
              <ul className="flex flex-col gap-1">
                {items.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center justify-between gap-3 rounded-2xl px-1 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted">
                        <CategoryIcon name={category.icon} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-foreground/45">
                          {TRANSACTION_TYPE_LABEL[category.kind === "INCOME" ? "INCOME" : "EXPENSE"]}
                          {category.isSystem ? " · پیش‌فرض" : " · سفارشی"}
                        </p>
                      </div>
                    </div>
                    {category.isSystem ? null : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={checking && pendingId === category.id}
                        onClick={() => startDelete(category)}
                      >
                        {checking && pendingId === category.id ? "…" : "حذف"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DeleteCategoryDialog
        category={confirming}
        dependents={dependents}
        onClose={() => {
          setConfirming(null);
          setDependents(null);
        }}
      />
    </>
  );
}

function DeleteCategoryDialog({
  category,
  dependents,
  onClose,
}: {
  category: CategoryListItem | null;
  dependents: CategoryDependents | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const open = category != null && dependents != null;
  const copy = category && dependents ? categoryDeletionCopy(category.isSystem, dependents) : null;

  function confirm() {
    if (!category) {
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("id", category.id);
    startTransition(async () => {
      const result = await deleteCategory(undefined, formData);
      if (!result.ok) {
        setError(result.error ?? "حذف انجام نشد. دوباره تلاش کن.");
        return;
      }
      toast.success("دسته‌بندی حذف شد.");
      onClose();
    });
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
          onClose();
        }
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 outline-none">
          <Drawer.Handle className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-border" />
          <Drawer.Title className="text-base font-semibold">{copy?.title}</Drawer.Title>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy?.description}</p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2">
            {copy?.canDelete ? (
              <Button type="button" variant="destructive" disabled={pending} onClick={confirm}>
                {pending ? "در حال حذف…" : "حذف دسته‌بندی"}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
              {copy?.canDelete ? "انصراف" : "متوجه شدم"}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
