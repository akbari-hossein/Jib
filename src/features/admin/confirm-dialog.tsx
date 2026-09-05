"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  destructive = false,
  requireValue,
  requireHint,
  error,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  destructive?: boolean;
  requireValue?: string;
  requireHint?: string;
  error?: string;
  children?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="بستن"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-lg"
      >
        <h2 id="admin-confirm-title" className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
        {children}
        {requireValue ? (
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="admin-confirm-text">{requireHint ?? "برای تأیید، مقدار خواسته‌شده را وارد کن."}</Label>
            <Input
              id="admin-confirm-text"
              name="confirm"
              dir="ltr"
              className="text-left"
              autoComplete="off"
              required
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            انصراف
          </Button>
          <Button
            type="submit"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            className={cn(destructive && "min-h-12")}
          >
            {pending ? "در حال انجام…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
