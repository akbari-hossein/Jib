export const RECAP_EXPORT_SIZE = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

export type RecapExportVariant = keyof typeof RECAP_EXPORT_SIZE;

export async function recapElementToPngBlob(
  element: HTMLElement,
  variant: RecapExportVariant,
): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const { toBlob } = await import("html-to-image");
  const target = RECAP_EXPORT_SIZE[variant];
  const rect = element.getBoundingClientRect();
  const pixelRatio = target.width / Math.max(rect.width, 1);

  const blob = await toBlob(element, {
    pixelRatio,
    backgroundColor: "#F5F2EA",
    cacheBust: false,
    style: {
      transform: "none",
      inset: "auto",
    },
  });

  if (!blob) {
    throw new Error("recap-image-empty");
  }

  return blob;
}

export function recapFilename(
  year: number,
  month: number,
  variant: RecapExportVariant,
): string {
  const padded = String(month).padStart(2, "0");
  return `jib-${year}-${padded}-${variant}.png`;
}

export function downloadPng(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
}

export async function shareOrDownloadPng(input: {
  blob: Blob;
  filename: string;
  title: string;
}): Promise<"shared" | "downloaded"> {
  const file = new File([input.blob], input.filename, { type: "image/png" });
  const payload: ShareData = { files: [file], title: input.title };

  if (canShareFiles(payload)) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
    }
  }

  downloadPng(input.blob, input.filename);
  return "downloaded";
}

function canShareFiles(payload: ShareData): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function") {
    return true;
  }
  try {
    return navigator.canShare(payload);
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
