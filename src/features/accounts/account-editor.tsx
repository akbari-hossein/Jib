"use client";

import { useState, useTransition } from "react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { AccountForm } from "@/features/accounts/account-form";
import { Button } from "@/components/ui/button";
import { accountDeletionCopy, type AccountDependents } from "@/lib/accounts/deletion";
import {
  archiveAccount,
  deleteAccount,
  getAccountDependents,
  restoreAccount,
} from "@/server/actions/accounts";
import type { AccountListItem } from "@/server/queries/accounts";

export function AccountEditor({
  account,
  open,
  onOpenChange,
}: {
  account: AccountListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [dependents, setDependents] = useState<AccountDependents | null>(null);
  const [checking, startChecking] = useTransition();
  const [checkError, setCheckError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setConfirming(false);
      setDependents(null);
      setCheckError(null);
    }
    onOpenChange(next);
  }

  function startDelete() {
    if (!account) {
      return;
    }
    setCheckError(null);
    startChecking(async () => {
      const result = await getAccountDependents(account.id);
      if (!result.ok || !result.dependents) {
        setCheckError(result.error ?? "وضعیت حساب خوانده نشد.");
        return;
      }
      setDependents(result.dependents);
      setConfirming(true);
    });
  }

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
          <Drawer.Title className="px-5 pb-1 text-base font-semibold">
            {confirming ? "حذف حساب" : account ? "ویرایش حساب" : "حساب"}
          </Drawer.Title>
          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
            {account && confirming && dependents ? (
              <DeleteConfirm
                account={account}
                dependents={dependents}
                onCancel={() => setConfirming(false)}
                onDone={() => handleOpenChange(false)}
              />
            ) : account ? (
              <div className="flex flex-col gap-6">
                <AccountForm
                  key={account.id}
                  account={account}
                  onSuccess={() => handleOpenChange(false)}
                />
                {account.isActive ? (
                  <div className="flex flex-col gap-2">
                    {checkError ? (
                      <p role="alert" className="text-sm text-destructive">
                        {checkError}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={startDelete}
                      disabled={checking}
                      className="text-sm text-destructive disabled:opacity-50"
                    >
                      {checking ? "در حال بررسی…" : "حذف حساب"}
                    </button>
                  </div>
                ) : (
                  <RestoreControls accountId={account.id} onDone={() => handleOpenChange(false)} />
                )}
              </div>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function RestoreControls({
  accountId,
  onDone,
}: {
  accountId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function restore() {
    setError(null);
    const formData = new FormData();
    formData.set("id", accountId);
    startTransition(async () => {
      const result = await restoreAccount(undefined, formData);
      if (!result.ok) {
        setError(result.error ?? "بازگردانی انجام نشد.");
        return;
      }
      toast.success("حساب برگردانده شد.");
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-7 text-muted-foreground">این حساب بایگانی شده و در قابل‌خرج نیست.</p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="secondary" disabled={pending} onClick={restore} className="w-full">
        {pending ? "در حال بازگردانی…" : "بازگردانی حساب"}
      </Button>
    </div>
  );
}

function DeleteConfirm({
  account,
  dependents,
  onCancel,
  onDone,
}: {
  account: AccountListItem;
  dependents: AccountDependents;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(dependents);
  const copy = accountDeletionCopy(current);

  function run(kind: "delete" | "archive") {
    setError(null);
    const formData = new FormData();
    formData.set("id", account.id);
    startTransition(async () => {
      const result =
        kind === "delete" ? await deleteAccount(undefined, formData) : await archiveAccount(undefined, formData);
      if (!result.ok) {
        setError(result.error ?? "انجام نشد. دوباره تلاش کن.");
        if (result.dependents) {
          setCurrent(result.dependents);
        }
        return;
      }
      toast.success(kind === "delete" ? "حساب حذف شد." : "حساب بایگانی شد.");
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">{copy.title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy.description}</p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {copy.canDelete ? (
          <Button type="button" variant="destructive" disabled={pending} onClick={() => run("delete")} className="w-full">
            {pending ? "در حال حذف…" : "حذف دائمی"}
          </Button>
        ) : (
          <Button type="button" variant="destructive" disabled={pending} onClick={() => run("archive")} className="w-full">
            {pending ? "در حال بایگانی…" : "بایگانی حساب"}
          </Button>
        )}
        {!copy.canDelete ? (
          <p className="text-xs leading-6 text-foreground/45">
            حذف دائمی تا وقتی تراکنش یا مورد تکراری وصل است ممکن نیست.
          </p>
        ) : (
          <Button type="button" variant="secondary" disabled={pending} onClick={() => run("archive")} className="w-full">
            بایگانی به‌جای حذف
          </Button>
        )}
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel} className="w-full">
          انصراف
        </Button>
      </div>
    </div>
  );
}
