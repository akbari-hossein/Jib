"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { MonthlyRecapCard } from "@/features/reports/monthly-recap-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { availableRecapFields, defaultRecapSelection } from "@/lib/finance/monthly-recap-data";
import type { MonthlyRecapDto, RecapFieldId, RecapSelection } from "@/lib/finance/monthly-recap-data";
import {
  downloadPng,
  recapElementToPngBlob,
  recapFilename,
  shareOrDownloadPng,
  type RecapExportVariant,
} from "@/lib/share/recap-image";
import { RECAP_FIELD_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function MonthlyRecapShare({ recap }: { recap: MonthlyRecapDto }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 />
        اشتراک‌گذاری
      </Button>
      <MonthlyRecapShareSheet recap={recap} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function MonthlyRecapShareSheet({
  recap,
  open,
  onOpenChange,
}: {
  recap: MonthlyRecapDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const available = useMemo(() => availableRecapFields(recap), [recap]);
  const [selection, setSelection] = useState<RecapSelection>(() => defaultRecapSelection(recap));
  const [variant, setVariant] = useState<RecapExportVariant>("story");
  const [busy, setBusy] = useState(false);

  function toggleField(id: RecapFieldId) {
    setSelection((current) => {
      const selected = current.fields.includes(id);
      if (selected && current.fields.length === 1) {
        return current;
      }
      return {
        ...current,
        fields: selected ? current.fields.filter((field) => field !== id) : [...current.fields, id],
      };
    });
  }

  async function exportCard(mode: "share" | "download") {
    const node = cardRef.current;
    if (!node) {
      return;
    }
    setBusy(true);
    try {
      const blob = await recapElementToPngBlob(node, variant);
      const filename = recapFilename(recap.year, recap.month, variant);
      const title = `خلاصه ${recap.monthLabel}`;
      if (mode === "download") {
        downloadPng(blob, filename);
        toast.success("عکس ذخیره شد.");
        return;
      }
      const result = await shareOrDownloadPng({ blob, filename, title });
      if (result === "downloaded") {
        toast.success("عکس ذخیره شد.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error("ساخت عکس انجام نشد. دوباره تلاش کن.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
          <Drawer.Title className="px-5 text-base font-semibold">اشتراک‌گذاری خلاصه ماه</Drawer.Title>
          <Drawer.Description className="px-5 pt-1 text-sm leading-7 text-muted-foreground">
            خودت انتخاب کن چه عددی روی کارت باشد. مبلغ دقیق پیش‌فرض خاموش است.
          </Drawer.Description>
          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <div className="mb-4 flex gap-2">
              <FormatPill active={variant === "story"} onClick={() => setVariant("story")}>
                استوری
              </FormatPill>
              <FormatPill active={variant === "square"} onClick={() => setVariant("square")}>
                پست
              </FormatPill>
            </div>

            <div className="mx-auto w-[min(100%,17.5rem)] overflow-hidden rounded-[1.4rem] shadow-md">
              <div ref={cardRef} className={variant === "story" ? "aspect-[9/16]" : "aspect-square"}>
                <MonthlyRecapCard recap={recap} selection={selection} variant={variant} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">نمایش مبلغ به تومان</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  خاموش یعنی فقط درصد؛ برای اشتراک‌گذاری امن‌تر است.
                </p>
              </div>
              <Switch
                checked={selection.exactAmounts}
                aria-label="نمایش مبلغ به تومان"
                onClick={() =>
                  setSelection((current) => ({ ...current, exactAmounts: !current.exactAmounts }))
                }
              />
            </div>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium">چه چیزهایی روی کارت باشد</legend>
              <ul className="mt-3 flex flex-col gap-2">
                {available.map((id) => (
                  <li key={id}>
                    <FieldToggle
                      label={RECAP_FIELD_LABEL[id]}
                      checked={selection.fields.includes(id)}
                      onToggle={() => toggleField(id)}
                    />
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                disabled={busy || selection.fields.length === 0}
                onClick={() => void exportCard("share")}
              >
                <Share2 />
                {busy ? "در حال ساخت عکس..." : "اشتراک‌گذاری"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || selection.fields.length === 0}
                onClick={() => void exportCard("download")}
              >
                <Download />
                دانلود عکس
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function FormatPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 text-sm transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground/70",
      )}
    >
      {children}
    </button>
  );
}

function FieldToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-start"
    >
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-md border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
        )}
      >
        {checked ? <Check className="size-3.5" strokeWidth={2.4} /> : null}
      </span>
    </button>
  );
}
