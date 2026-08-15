import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
