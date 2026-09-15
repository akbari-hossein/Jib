import { NextResponse } from "next/server";
import { maybePromoteBootstrapAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeReceiptReview } from "@/lib/subscription/api-access";
import { approveReceipt } from "@/server/services/subscription";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const actor = user ? await maybePromoteBootstrapAdmin(user) : null;
  const { id } = await context.params;
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id },
    select: { id: true, subscriptionId: true },
  });
  const auth = authorizeReceiptReview({ actor, receipt });
  if (!auth.allowed) {
    return NextResponse.json(
      { error: auth.status === 401 ? "unauthorized" : auth.status === 403 ? "forbidden" : "not found" },
      { status: auth.status },
    );
  }

  const result = await approveReceipt({ receiptId: id, adminId: actor!.id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ subscription: result.subscription });
}
