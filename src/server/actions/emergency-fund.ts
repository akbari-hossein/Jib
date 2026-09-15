"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { parseTomanInput } from "@/lib/validation/money";
import { toLatinDigits } from "@/lib/currency/format";
import { EMERGENCY_FUND_MAX_TARGET_MONTHS } from "@/lib/finance/emergencyFund";
import {
  EmergencyFundError,
  updateEmergencyFundGoal,
} from "@/server/emergencyFund/updateEmergencyFundGoal";
import { userFacingMutationError } from "@/server/services/ownership";
import { writeBlockedState } from "@/server/services/subscription";

export type EmergencyFundActionState = {
  ok: boolean;
  error?: string;
};

function parseMonths(raw: string): number | null {
  const text = toLatinDigits(raw).trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1 || value > EMERGENCY_FUND_MAX_TARGET_MONTHS) {
    return null;
  }
  return value;
}

function revalidateEmergencyFund() {
  revalidatePath("/goals");
  revalidatePath("/goals/emergency-fund");
  revalidatePath("/home");
}

export async function saveEmergencyFund(
  _previous: EmergencyFundActionState | undefined,
  formData: FormData,
): Promise<EmergencyFundActionState> {
  const user = await requireUser();
  const blocked = await writeBlockedState(user.id);
  if (blocked) {
    return blocked;
  }
  const targetMonths = parseMonths(String(formData.get("targetMonths") ?? ""));
  const essentialCategoryIds = formData
    .getAll("essentialCategoryIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const currentAmount = parseTomanInput(String(formData.get("currentAmount") ?? "0"), {
    allowZero: true,
  });
  const estimatedRaw = String(formData.get("estimatedMonthlyEssential") ?? "").trim();
  const estimatedMonthlyEssential = estimatedRaw
    ? parseTomanInput(estimatedRaw, { allowZero: true })
    : 0n;

  if (targetMonths === null) {
    return { ok: false, error: "تعداد ماه پوشش را انتخاب کن." };
  }
  if (essentialCategoryIds.length === 0) {
    return { ok: false, error: "حداقل یک دسته ضروری انتخاب کن." };
  }
  if (currentAmount === null) {
    return { ok: false, error: "مبلغ فعلی معتبر نیست." };
  }
  if (estimatedRaw && estimatedMonthlyEssential === null) {
    return { ok: false, error: "برآورد ماهانه معتبر نیست." };
  }

  try {
    await updateEmergencyFundGoal({
      userId: user.id,
      targetMonths,
      essentialCategoryIds,
      currentAmount,
      estimatedMonthlyEssential:
        estimatedMonthlyEssential && estimatedMonthlyEssential > 0n
          ? estimatedMonthlyEssential
          : null,
    });
  } catch (error) {
    if (error instanceof EmergencyFundError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: userFacingMutationError(error, "ذخیره صندوق اضطراری انجام نشد. دوباره تلاش کن."),
    };
  }

  revalidateEmergencyFund();
  return { ok: true };
}
