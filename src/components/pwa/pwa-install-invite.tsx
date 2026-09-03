"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/currency/format";
import {
  bindInstallPromptListeners,
  clearDeferredInstallPrompt,
  getInstallPromptSnapshot,
  getServerInstallPromptSnapshot,
  subscribeInstallPrompt,
} from "@/lib/pwa/deferred-prompt";
import {
  PWA_INSTALL_SETTLE_MS,
  browserLocalStorage,
  browserSessionStorage,
  canPresentInstallInvitation,
  dismissInstallInvitation,
  hasShownInstallInvitationThisSession,
  isStandaloneDisplayMode,
  markInstallInvitationInstalled,
  markInstallInvitationShownThisSession,
  readInstallPromptRecord,
  resolveInstallSurface,
  type InstallSurface,
} from "@/lib/pwa/install";

export function PwaInstallInvite({ onboardingPending }: { onboardingPending: boolean }) {
  const prompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getServerInstallPromptSnapshot,
  );
  const [open, setOpen] = useState(false);
  const [surface, setSurface] = useState<InstallSurface>("none");
  const [installing, setInstalling] = useState(false);
  const presentedRef = useRef(false);
  const skipForOnboardingRef = useRef(onboardingPending);
  const closingRef = useRef<"idle" | "dismissed" | "installed">("idle");
  const titleId = useId();
  const drawerOpen = open && !prompt.installed;

  useEffect(() => {
    bindInstallPromptListeners();
  }, []);

  useEffect(() => {
    if (skipForOnboardingRef.current || onboardingPending || presentedRef.current || prompt.installed) {
      return;
    }

    const settleTimer = window.setTimeout(() => {
      const { deferred, installed } = getInstallPromptSnapshot();
      if (presentedRef.current || installed) {
        return;
      }

      const nextSurface = resolveInstallSurface(window, Boolean(deferred));
      const local = browserLocalStorage();
      const session = browserSessionStorage();
      const eligible = canPresentInstallInvitation({
        surface: nextSurface,
        record: readInstallPromptRecord(local),
        shownThisSession: hasShownInstallInvitationThisSession(session),
      });
      if (!eligible) {
        return;
      }

      presentedRef.current = true;
      markInstallInvitationShownThisSession(session);
      closingRef.current = "idle";
      setSurface(nextSurface);
      setOpen(true);
    }, PWA_INSTALL_SETTLE_MS);

    return () => window.clearTimeout(settleTimer);
  }, [onboardingPending, prompt.deferred, prompt.installed]);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const onChange = () => {
      if (!isStandaloneDisplayMode(window)) {
        return;
      }
      markInstallInvitationInstalled(browserLocalStorage());
      closingRef.current = "installed";
      setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function finishDismiss() {
    if (closingRef.current === "installed") {
      return;
    }
    closingRef.current = "dismissed";
    dismissInstallInvitation(browserLocalStorage());
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      finishDismiss();
    }
    setOpen(next);
  }

  async function onNativeInstall() {
    const event = prompt.deferred;
    if (!event) {
      finishDismiss();
      setOpen(false);
      return;
    }
    setInstalling(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      clearDeferredInstallPrompt();
      if (choice.outcome === "accepted") {
        closingRef.current = "installed";
        markInstallInvitationInstalled(browserLocalStorage());
      } else {
        finishDismiss();
      }
      setOpen(false);
    } catch {
      finishDismiss();
      setOpen(false);
    } finally {
      setInstalling(false);
    }
  }

  const copy = inviteCopy(surface);
  const ios = surface === "ios";

  return (
    <Drawer.Root open={drawerOpen} onOpenChange={handleOpenChange} shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content
          aria-labelledby={titleId}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none"
        >
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
          <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
            <div className="flex items-start gap-3">
              <AppMark />
              <div className="min-w-0 pt-0.5">
                <Drawer.Title id={titleId} className="text-base font-semibold leading-7 tracking-tight">
                  {copy.title}
                </Drawer.Title>
                <Drawer.Description className="mt-1.5 text-sm leading-7 text-muted-foreground">
                  {copy.body}
                </Drawer.Description>
              </div>
            </div>

            {ios ? <IosInstallSteps /> : null}

            <div className="mt-5 flex flex-col gap-2">
              {ios ? (
                <Button type="button" className="w-full" onClick={() => handleOpenChange(false)}>
                  متوجه شدم
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  disabled={installing}
                  onClick={() => void onNativeInstall()}
                >
                  {installing ? "در حال افزودن…" : copy.action}
                </Button>
              )}
              <Button type="button" variant="ghost" className="w-full" onClick={() => handleOpenChange(false)}>
                بعداً
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function inviteCopy(surface: InstallSurface) {
  if (surface === "native" && !isCoarsePointer()) {
    return {
      title: "جیب رو مثل اپ نصب کن",
      body: "با نصب، جیب جدا از مرورگر باز می‌شود و همیشه دمِ دست است.",
      action: "نصب جیب",
    };
  }
  return {
    title: "جیب رو به صفحه اصلی اضافه کن",
    body: "جیب رو مثل یک اپ روی گوشی‌ات داشته باش؛ هر وقت خواستی، سریع به وضعیت مالی‌ات سر بزن.",
    action: "افزودن به صفحه اصلی",
  };
}

function isCoarsePointer() {
  if (typeof window === "undefined") {
    return true;
  }
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
}

function AppMark() {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border border-border bg-surface-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={48} height={48} className="size-12" />
    </span>
  );
}

function IosInstallSteps() {
  return (
    <ol className="mt-5 flex flex-col gap-2.5">
      <IosStep index={1}>
        پایین صفحه روی دکمه{" "}
        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-1.5 py-0.5 text-foreground">
          <IosShareGlyph className="size-3.5" />
          Share
        </span>{" "}
        بزن.
      </IosStep>
      <IosStep index={2}>
        گزینه <strong className="font-medium text-foreground">Add to Home Screen</strong> یا{" "}
        <strong className="font-medium text-foreground">افزودن به صفحه اصلی</strong> را انتخاب کن.
      </IosStep>
      <IosStep index={3}>
        روی <strong className="font-medium text-foreground">Add</strong> یا{" "}
        <strong className="font-medium text-foreground">افزودن</strong> بزن.
      </IosStep>
    </ol>
  );
}

function IosStep({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border bg-card px-3.5 py-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-medium">
        {toPersianDigits(index)}
      </span>
      <p className="text-sm leading-7 text-foreground/80">{children}</p>
    </li>
  );
}

function IosShareGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 4v10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.6 7.4 12 4l3.4 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.25 11H6.2A2.2 2.2 0 0 0 4 13.2v6.6A2.2 2.2 0 0 0 6.2 22h11.6a2.2 2.2 0 0 0 2.2-2.2v-6.6A2.2 2.2 0 0 0 17.8 11h-1.05"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
