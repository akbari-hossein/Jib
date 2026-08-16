"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { canSelfServePro } from "@/lib/billing/plan";
import { prisma } from "@/lib/db/prisma";

export async function activatePro(): Promise<void> {
  if (!canSelfServePro()) {
    return;
  }

  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "PRO" },
  });

  revalidatePath("/more");
  revalidatePath("/pricing");
  revalidatePath("/accounts");
  revalidatePath("/goals");
  revalidatePath("/budgets");
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/home");
}
