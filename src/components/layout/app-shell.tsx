import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/pwa/offline-banner";

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <OfflineBanner />
      <div className="mx-auto min-h-dvh w-full max-w-xl pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
