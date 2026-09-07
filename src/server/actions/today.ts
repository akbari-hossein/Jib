"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  assertFinancialTaskOwned,
  userFacingMutationError,
} from "@/server/services/ownership";

export type CompleteFinancialTaskResult = {
  ok: boolean;
  error?: string;
};

export async function completeFinancialTask(taskId: string): Promise<CompleteFinancialTaskResult> {
  const user = await requireUser();

  try {
    const task = await assertFinancialTaskOwned(user.id, taskId);
    if (task.isCompleted) {
      return { ok: true };
    }

    await prisma.financialTask.update({
      where: { id: task.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    revalidatePath("/home");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره نشد. دوباره تلاش کن."),
    };
  }
}
