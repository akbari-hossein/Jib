import { NextResponse } from "next/server";
import type { ReceiptStatus } from "@prisma/client";
import { maybePromoteBootstrapAdmin } from "@/lib/auth/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { authorizeAdminList } from "@/lib/subscription/api-access";
import { listAdminReceipts } from "@/server/services/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ReceiptStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const actor = user ? await maybePromoteBootstrapAdmin(user) : null;
  const auth = authorizeAdminList(actor);
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const statusParam = new URL(request.url).searchParams.get("status") ?? "PENDING";
  const status = STATUSES.includes(statusParam as ReceiptStatus)
    ? (statusParam as ReceiptStatus)
    : "PENDING";

  const receipts = await listAdminReceipts(status);
  return NextResponse.json({
    receipts: receipts.map((receipt) => ({
      id: receipt.id,
      type: receipt.type,
      status: receipt.status,
      createdAt: receipt.createdAt.toISOString(),
      claimedAmount: receipt.claimedAmount,
      claimedTransferDate: receipt.claimedTransferDate?.toISOString() ?? null,
      imageUrl: receipt.type === "IMAGE" ? `/api/subscription/receipts/files/${receipt.imageUrl?.replace(/^jib-receipt:/, "")}` : null,
      rawText: receipt.type === "TEXT" ? receipt.rawText : null,
      user: {
        id: receipt.user.id,
        name: receipt.user.name,
        phone: receipt.user.email,
      },
    })),
  });
}
