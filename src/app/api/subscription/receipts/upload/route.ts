import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { receiptImageStore, validateReceiptImageUpload } from "@/lib/storage/receipt-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "عکس رسید را انتخاب کن." }, { status: 400 });
  }

  const validated = validateReceiptImageUpload({
    mimeType: file.type,
    size: file.size,
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = await receiptImageStore.put({
    userId: user.id,
    bytes,
    mimeType: validated.mimeType,
    filename: randomBytes(16).toString("hex"),
  });

  return NextResponse.json({ imageUrl: stored.imageUrl }, { status: 201 });
}
