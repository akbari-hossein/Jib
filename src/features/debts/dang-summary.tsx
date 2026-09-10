import { Card } from "@/components/ui/card";
import { formatToman } from "@/lib/currency/format";

export function DangSummary({ owedToMe, iOwe }: { owedToMe: bigint; iOwe: bigint }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card className="px-5 py-4">
        <p className="text-xs text-muted-foreground">طلب تو از بقیه</p>
        <p className="numeric-display mt-2 text-xl font-semibold">{formatToman(owedToMe)}</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          جدا از قابل‌خرج می‌ماند تا پولی که هنوز نرسیده خرج نشود.
        </p>
      </Card>
      <Card className="px-5 py-4">
        <p className="text-xs text-muted-foreground">بدهی تو به بقیه</p>
        <p className="numeric-display mt-2 text-xl font-semibold">{formatToman(iOwe)}</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">از قابل‌خرج کم شده است.</p>
      </Card>
    </div>
  );
}
