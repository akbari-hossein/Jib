import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getComputedSubscription, serializeSubscription } from "@/server/services/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snapshot = await getComputedSubscription(user.id);
  return NextResponse.json(serializeSubscription(snapshot));
}
