import { NextResponse } from "next/server";
import { financialHealthOwnerId, financialHealthQuerySchema } from "@/lib/api/financial-health-access";
import { getCurrentUser } from "@/lib/auth/session";
import { getFinancialHealth } from "@/server/queries/financial-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const ownerId = financialHealthOwnerId(user, new URL(request.url).searchParams);
  if (!ownerId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = financialHealthQuerySchema.safeParse({
    months: url.searchParams.get("months") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const health = await getFinancialHealth(ownerId);
  return NextResponse.json({
    current: health.current,
    history: health.history,
  });
}
