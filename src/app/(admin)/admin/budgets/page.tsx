import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminBudgetsPage() {
  await requireAdmin();
  notFound();
}
