import { NextResponse } from "next/server";
import { isActiveAdmin } from "@/lib/admin/access";
import { getCurrentUser } from "@/lib/auth/session";
import { RECEIPT_IMAGE_KEY_PREFIX } from "@/lib/subscription/constants";
import { receiptImageOwnerId, receiptImageStore } from "@/lib/storage/receipt-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { key } = await context.params;
  const imageUrl = `${RECEIPT_IMAGE_KEY_PREFIX}${key.join("/")}`;
  const ownerId = receiptImageOwnerId(imageUrl);
  if (!ownerId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (ownerId !== user.id && !isActiveAdmin(user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const stored = await receiptImageStore.get(imageUrl);
  if (!stored) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(stored.bytes), {
    status: 200,
    headers: {
      "content-type": stored.mimeType,
      "content-disposition": "inline",
      "x-content-type-options": "nosniff",
      "cache-control": "private, max-age=0, no-store",
    },
  });
}
