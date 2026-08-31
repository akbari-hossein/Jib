"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingTour } from "@/features/onboarding/onboarding-tour";

export function OnboardingHost({ initial }: { initial: boolean }) {
  const [active, setActive] = useState(initial);
  const [tourKey, setTourKey] = useState(0);

  const onClose = useCallback(() => {
    setActive(false);
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const onStart = useCallback(() => {
    setTourKey((key) => key + 1);
    setActive(true);
  }, []);

  return (
    <>
      {active ? <OnboardingTour key={tourKey} onClose={onClose} /> : null}
      <Suspense fallback={null}>
        <ReplayBridge onStart={onStart} />
      </Suspense>
    </>
  );
}

function ReplayBridge({ onStart }: { onStart: () => void }) {
  const searchParams = useSearchParams();
  const replay = searchParams.get("tour") === "1";
  const started = useRef(false);

  useEffect(() => {
    if (replay && !started.current) {
      started.current = true;
      onStart();
      return;
    }
    if (!replay) {
      started.current = false;
    }
  }, [onStart, replay]);

  return null;
}
