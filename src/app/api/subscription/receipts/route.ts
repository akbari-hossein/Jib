import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { receiptSubmissionSchema } from "@/lib/subscription/receipt-schema";
import { submitPaymentReceipt } from "@/server/services/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = receiptSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "مدرک پرداخت (عکس یا متن) الزامی است." },
      { status: 400 },
    );
  }

  const result = await submitPaymentReceipt({
    userId: user.id,
    userEmail: user.email,
    body: parsed.data,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ receiptId: result.receiptId }, { status: 201 });
}
