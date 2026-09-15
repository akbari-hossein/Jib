import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PwaInstallInvite } from "@/components/pwa/pwa-install-invite";
import { SessionKeepAlive } from "@/features/auth/session-keep-alive";
import { QuickAddHost } from "@/features/quick-add/quick-add-host";
import { OnboardingHost } from "@/features/onboarding/onboarding-host";
import { SubscriptionAccessProvider } from "@/features/subscription/subscription-access";
import { SubscriptionNotice } from "@/features/subscription/components/SubscriptionNotice";
import { TrialBanner } from "@/features/subscription/components/TrialBanner";
import { requireUser } from "@/lib/auth/session";
import { privatePageRobots } from "@/lib/seo/metadata";
import { getQuickAddContext } from "@/server/queries/quick-add";
import { getCachedSubscription, serializeSubscription } from "@/server/services/subscription";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "خانه",
  robots: privatePageRobots,
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [quickAdd, snapshot] = await Promise.all([
    getQuickAddContext(user.id),
    getCachedSubscription(user.id).then(serializeSubscription),
  ]);
  return (
    <SubscriptionAccessProvider snapshot={snapshot}>
      <AppShell>
        <TrialBanner />
        <SubscriptionNotice />
        {children}
        <QuickAddHost context={quickAdd} writeAccess={snapshot.writeAccess} />
        <OnboardingHost initial={user.onboardingCompletedAt === null} />
        <PwaInstallInvite onboardingPending={user.onboardingCompletedAt === null} />
        <SessionKeepAlive />
      </AppShell>
    </SubscriptionAccessProvider>
  );
}
