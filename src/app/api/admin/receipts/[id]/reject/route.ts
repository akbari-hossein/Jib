import { NextResponse } from "next/server";
import { maybePromoteBootstrapAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { authorizeReceiptReview } from "@/lib/subscription/api-access";
import { receiptRejectSchema } from "@/lib/subscription/receipt-schema";
import { rejectReceipt } from "@/server/services/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const raw = await request.json().catch(() => null);
  const parsed = receiptRejectSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "دلیل رد معتبر نیست." }, { status: 400 });
  }

  const result = await rejectReceipt({
    receiptId: id,
    adminId: actor!.id,
    reasonCode: parsed.data.reasonCode,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ receipt: result.receipt });
}
