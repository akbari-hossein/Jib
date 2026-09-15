import { NextResponse } from "next/server";
import { maybePromoteBootstrapAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeAdminList } from "@/lib/subscription/api-access";
import { getAdminSubscriptionMetrics } from "@/server/queries/admin/subscription-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const actor = user ? await maybePromoteBootstrapAdmin(user) : null;
  const auth = authorizeAdminList(actor);
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.status === 401 ? "unauthorized" : "forbidden" },
      { status: auth.status },
    );
  }

  const metrics = await getAdminSubscriptionMetrics();
  return NextResponse.json(metrics);
}
