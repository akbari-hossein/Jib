import { CALCULATOR_COPY } from "@/features/calculators/copy";
import { formatCalculatorToman } from "@/features/calculators/format";
import { toPersianDigits } from "@/lib/currency/format";
import type { AmortizationRow } from "@/features/calculators/types";

export function LoanAmortizationTable({ schedule }: { schedule: AmortizationRow[] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-2xl border border-border">
      <table className="w-full min-w-[28rem] text-right text-xs">
        <thead className="sticky top-0 bg-surface-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{CALCULATOR_COPY.scheduleNumber}</th>
            <th className="px-3 py-2 font-medium">{CALCULATOR_COPY.schedulePayment}</th>
            <th className="px-3 py-2 font-medium">{CALCULATOR_COPY.scheduleInterest}</th>
            <th className="px-3 py-2 font-medium">{CALCULATOR_COPY.schedulePrincipal}</th>
            <th className="px-3 py-2 font-medium">{CALCULATOR_COPY.scheduleBalance}</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.installmentNumber} className="border-t border-border">
              <td className="numeric-display whitespace-nowrap px-3 py-2">{toPersianDigits(row.installmentNumber)}</td>
              <td className="numeric-display whitespace-nowrap px-3 py-2">
                {formatCalculatorToman(row.paymentAmount, { withUnit: false })}
              </td>
              <td className="numeric-display whitespace-nowrap px-3 py-2">
                {formatCalculatorToman(row.interestPortion, { withUnit: false })}
              </td>
              <td className="numeric-display whitespace-nowrap px-3 py-2">
                {formatCalculatorToman(row.principalPortion, { withUnit: false })}
              </td>
              <td className="numeric-display whitespace-nowrap px-3 py-2">
                {formatCalculatorToman(row.remainingBalance, { withUnit: false })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
