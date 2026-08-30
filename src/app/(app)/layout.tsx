import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { QuickAddHost } from "@/features/quick-add/quick-add-host";
import { requireUser } from "@/lib/auth/session";
import { privatePageRobots } from "@/lib/seo/metadata";
import { getQuickAddContext } from "@/server/queries/quick-add";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "خانه",
  robots: privatePageRobots,
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const quickAdd = await getQuickAddContext(user.id);
  return (
    <AppShell>
      {children}
      <QuickAddHost context={quickAdd} />
    </AppShell>
  );
}
