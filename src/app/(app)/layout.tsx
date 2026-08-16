import { AppShell } from "@/components/layout/app-shell";
import { QuickAddHost } from "@/features/quick-add/quick-add-host";
import { requireUser } from "@/lib/auth/session";
import { getQuickAddContext } from "@/server/queries/quick-add";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

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
