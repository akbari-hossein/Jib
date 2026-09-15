import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/notifications/cron-auth";
import { refreshAllSubscriptionStatuses } from "@/server/services/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await refreshAllSubscriptionStatuses();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
