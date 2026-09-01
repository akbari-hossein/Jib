"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isReferenceAssetType } from "@/lib/finance/purchasing-power";

export type ReferenceAssetState = {
  ok: boolean;
  error?: string;
};

export async function updateReferenceAssetPreference(
  _previous: ReferenceAssetState | undefined,
  formData: FormData,
): Promise<ReferenceAssetState> {
  const user = await requireUser();
  const enabled = formData.get("enabled") === "on";
  const rawAsset = String(formData.get("asset") ?? "");

  let referenceAssetPreference = null;
  if (enabled) {
    if (!isReferenceAssetType(rawAsset)) {
      return { ok: false, error: "یک دارایی مرجع انتخاب کن." };
    }
    referenceAssetPreference = rawAsset;
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { referenceAssetPreference },
    });
  } catch {
    return { ok: false, error: "ذخیره تنظیم معادل ارزش انجام نشد. دوباره تلاش کن." };
  }

  revalidatePath("/home");
  revalidatePath("/reports");
  revalidatePath("/more");
  return { ok: true };
}
