import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatCompactToman } from "@/lib/currency/format";

export function DangCard({ owedToMe, iOwe }: { owedToMe: bigint; iOwe: bigint }) {
  return (
    <Link href="/dang" className="block" aria-label="دنگ">
      <Card className="px-5 py-4 transition-colors hover:bg-surface-muted/60">
        <p className="text-xs text-muted-foreground">دنگ</p>
        <p className="mt-2 text-sm leading-7">
          طلب تو: {formatCompactToman(owedToMe)}
          <span className="mx-2 text-foreground/30">|</span>
          بدهی تو: {formatCompactToman(iOwe)}
        </p>
      </Card>
    </Link>
  );
}
