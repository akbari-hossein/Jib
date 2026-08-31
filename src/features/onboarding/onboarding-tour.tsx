"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { House, List, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/features/onboarding/steps";
import { cn } from "@/lib/utils";
import { markOnboardingDone } from "@/server/actions/onboarding";

const CONCEPTS = [
  { icon: House, title: "خانه", body: "امروز چقدر می‌توانی خرج کنی" },
  { icon: Wallet, title: "حساب‌ها", body: "پولت کجاست" },
  { icon: List, title: "تراکنش و بودجه", body: "کجا می‌رود و سقف کجاست" },
  { icon: Target, title: "هدف‌ها", body: "پس‌انداز از قابل‌خرج جدا" },
] as const;

export function OnboardingTour({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [finishing, setFinishing] = useState(false);
  const step = ONBOARDING_STEPS[index] ?? ONBOARDING_STEPS[0]!;

  const finish = useCallback(async () => {
    if (finishing) {
      return;
    }
    setFinishing(true);
    try {
      await markOnboardingDone();
    } finally {
      onClose();
    }
  }, [finishing, onClose]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const next = ONBOARDING_STEPS[nextIndex];
      if (!next) {
        void finish();
        return;
      }
      setIndex(nextIndex);
      if (next.href !== pathname) {
        router.push(next.href);
      }
    },
    [finish, pathname, router],
  );

  useEffect(() => {
    if (step.href !== pathname) {
      router.push(step.href);
    }
  }, [pathname, router, step.href]);

  useEffect(() => {
    if (!step.target) {
      return;
    }

    const measure = () => {
      const node = document.querySelector(`[data-tour="${step.target}"]`);
      setRect(node ? node.getBoundingClientRect() : null);
    };

    const id = window.setInterval(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const timeout = window.setTimeout(measure, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [pathname, step.target]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        void finish();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const isWelcome = step.layout === "welcome";
  const spotlightRect = step.target ? rect : null;
  const hasSpotlight = Boolean(
    spotlightRect && spotlightRect.width > 8 && spotlightRect.height > 8,
  );

  return (
    <div
      className="fixed inset-0 z-[45]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {isWelcome ? (
        <WelcomePanel
          step={step}
          titleId={titleId}
          finishing={finishing}
          onNext={() => goTo(index + 1)}
          onSkip={() => void finish()}
        />
      ) : (
        <>
          <div className="absolute inset-0" aria-hidden />
          {hasSpotlight && spotlightRect ? (
            <Spotlight rect={spotlightRect} />
          ) : (
            <div className="absolute inset-0 bg-overlay" />
          )}
          <CoachCard
            step={step}
            index={index}
            titleId={titleId}
            finishing={finishing}
            onNext={() => goTo(index + 1)}
            onBack={index > 0 ? () => goTo(index - 1) : undefined}
            onSkip={() => void finish()}
          />
        </>
      )}
    </div>
  );
}

function WelcomePanel({
  step,
  titleId,
  finishing,
  onNext,
  onSkip,
}: {
  step: OnboardingStep;
  titleId: string;
  finishing: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onSkip}
          disabled={finishing}
          className="motion-onboarding-fade self-start text-sm text-muted-foreground"
        >
          رد کردن
        </button>

        <div className="flex flex-1 flex-col justify-center gap-8 py-8">
          <div className="motion-onboarding-rise">
            <p className="text-sm text-muted-foreground">جیب</p>
            <h1 id={titleId} className="mt-3 max-w-sm text-3xl font-semibold leading-snug tracking-tight">
              {step.title}
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-8 text-muted-foreground">{step.body}</p>
          </div>

          <ul className="motion-onboarding-rise motion-onboarding-delay-1 flex flex-col gap-3">
            {CONCEPTS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted">
                    <Icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="motion-onboarding-rise motion-onboarding-delay-2 flex flex-col gap-2">
          <Button type="button" className="w-full" onClick={onNext} disabled={finishing}>
            {step.primary}
          </Button>
          <p className="text-center text-xs leading-6 text-muted-foreground">
            کمتر از یک دقیقه. هر وقت بخواهی از بیشتر می‌توانی دوباره ببینی.
          </p>
        </div>
      </div>
    </div>
  );
}

function CoachCard({
  step,
  index,
  titleId,
  finishing,
  onNext,
  onBack,
  onSkip,
}: {
  step: OnboardingStep;
  index: number;
  titleId: string;
  finishing: boolean;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}) {
  const total = ONBOARDING_STEPS.length;
  const progress = index / (total - 1);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[47] flex justify-center px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto motion-onboarding-rise w-full max-w-xl rounded-[1.6rem] border border-border bg-card p-5 shadow-lg">
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.max(progress, 0.12) * 100}%` }}
          />
        </div>
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {step.title}
          </h2>
          <button
            type="button"
            onClick={onSkip}
            disabled={finishing}
            className="shrink-0 text-xs text-muted-foreground"
          >
            رد کردن
          </button>
        </div>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.body}</p>
        <div className="mt-5 flex gap-2">
          {onBack ? (
            <Button type="button" variant="secondary" className="flex-1" onClick={onBack} disabled={finishing}>
              قبلی
            </Button>
          ) : null}
          <Button type="button" className="flex-1" onClick={onNext} disabled={finishing}>
            {finishing ? "…" : step.primary}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Spotlight({ rect }: { rect: DOMRect }) {
  const pad = 10;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed z-[46] rounded-[1.35rem] ring-2 ring-background/80",
        "transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none",
      )}
      style={{
        top: Math.max(rect.top - pad, 8),
        left: Math.max(rect.left - pad, 8),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        boxShadow: "0 0 0 9999px color-mix(in oklab, var(--foreground) 48%, transparent)",
      }}
    />
  );
}
