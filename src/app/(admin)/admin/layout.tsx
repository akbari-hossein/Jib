import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/admin-shell";
import { SessionKeepAlive } from "@/features/auth/session-keep-alive";
import { requireAdmin } from "@/lib/auth/admin";
import { privatePageRobots } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "پنل مدیریت",
    template: "%s · مدیریت جیب",
  },
  robots: privatePageRobots,
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell name={admin.name} email={admin.email}>
      {children}
      <SessionKeepAlive />
    </AdminShell>
  );
}
