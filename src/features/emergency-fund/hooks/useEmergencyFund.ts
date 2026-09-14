import { useMemo } from "react";
import { assembleEmergencyFund } from "@/lib/finance/emergencyFund";
import type {
  CategoryMonthTotal,
  EmergencyFundMonthlyFlow,
} from "@/server/emergencyFund/getEmergencyFundData";

export function useEmergencyFund(input: {
  categoryMonthTotals: CategoryMonthTotal[];
  windowMonths: string[];
  monthlyFlows: EmergencyFundMonthlyFlow[];
  selectedCategoryIds: string[];
  targetMonths: number;
  currentAmount: number;
  estimatedMonthlyEssential: number | null;
}) {
  return useMemo(
    () =>
      assembleEmergencyFund({
        currentAmount: input.currentAmount,
        targetMonths: input.targetMonths,
        essentialCategoryIds: input.selectedCategoryIds,
        estimatedMonthlyEssential: input.estimatedMonthlyEssential,
        categoryMonthTotals: input.categoryMonthTotals,
        windowMonths: input.windowMonths,
        monthlyFlows: input.monthlyFlows,
      }),
    [
      input.categoryMonthTotals,
      input.windowMonths,
      input.monthlyFlows,
      input.selectedCategoryIds,
      input.targetMonths,
      input.currentAmount,
      input.estimatedMonthlyEssential,
    ],
  );
}
