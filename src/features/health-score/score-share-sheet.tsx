"use client";

import { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { ScoreShareCard, type ScoreShareCardModel } from "@/features/health-score/score-share-card";
import { useFinancialHealthScore } from "@/features/health-score/use-financial-health-score";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HEALTH_SCORE_COPY } from "@/lib/finance/financial-health-copy";
import {
  downloadPng,
  recapElementToPngBlob,
  shareOrDownloadPng,
  type RecapExportVariant,
} from "@/lib/share/recap-image";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { cn } from "@/lib/utils";

function scoreFilename(year: number, month: number, variant: RecapExportVariant): string {
  const padded = String(month).padStart(2, "0");
  return `jib-health-${year}-${padded}-${variant}.png`;
}

export function ScoreShareButton({ model }: { model: ScoreShareCardModel }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Share2 />
        {HEALTH_SCORE_COPY.share}
      </Button>
      <ScoreShareSheet model={model} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ScoreShareSheet({
  model,
  open,
  onOpenChange,
}: {
  model: ScoreShareCardModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { variant, setVariant, includeHighlight, setIncludeHighlight } = useFinancialHealthScore();
  const [busy, setBusy] = useState(false);
  const today = getTehranJalaliDate();

  async function exportCard(mode: "share" | "download") {
    const node = cardRef.current;
    if (!node) {
      return;
    }
    setBusy(true);
    try {
      const blob = await recapElementToPngBlob(node, variant);
      const filename = scoreFilename(today.year, today.month, variant);
      const title = HEALTH_SCORE_COPY.title;
      if (mode === "download") {
        downloadPng(blob, filename);
        toast.success(HEALTH_SCORE_COPY.saved);
        return;
      }
      const result = await shareOrDownloadPng({ blob, filename, title });
      if (result === "downloaded") {
        toast.success(HEALTH_SCORE_COPY.saved);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error(HEALTH_SCORE_COPY.shareFailed);
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
          <Drawer.Title className="px-5 text-base font-semibold">{HEALTH_SCORE_COPY.shareTitle}</Drawer.Title>
          <Drawer.Description className="px-5 pt-1 text-sm leading-7 text-muted-foreground">
            {HEALTH_SCORE_COPY.shareDescription}
          </Drawer.Description>
          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <div className="mb-4 flex gap-2">
              <FormatPill active={variant === "story"} onClick={() => setVariant("story")}>
                {HEALTH_SCORE_COPY.story}
              </FormatPill>
              <FormatPill active={variant === "square"} onClick={() => setVariant("square")}>
                {HEALTH_SCORE_COPY.square}
              </FormatPill>
            </div>

            <div className="mx-auto w-[min(100%,17.5rem)] overflow-hidden rounded-[1.4rem] shadow-md">
              <div ref={cardRef} className={variant === "story" ? "aspect-[9/16]" : "aspect-square"}>
                <ScoreShareCard model={model} variant={variant} includeHighlight={includeHighlight} />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">{HEALTH_SCORE_COPY.includeHighlight}</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {HEALTH_SCORE_COPY.includeHighlightHint}
                </p>
              </div>
              <Switch
                checked={includeHighlight}
                aria-label={HEALTH_SCORE_COPY.includeHighlight}
                onClick={() => setIncludeHighlight((current) => !current)}
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button type="button" disabled={busy} onClick={() => void exportCard("share")}>
                <Share2 />
                {busy ? HEALTH_SCORE_COPY.sharing : HEALTH_SCORE_COPY.share}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void exportCard("download")}
              >
                <Download />
                {HEALTH_SCORE_COPY.download}
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
