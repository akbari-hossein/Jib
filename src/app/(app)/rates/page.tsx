import { requireUser } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HoldingExplain } from "@/components/finance/holding-explain";
import { formatToman } from "@/lib/currency/format";
import { REFERENCE_ASSET_OPTION_LABEL, REFERENCE_ASSET_UNIT_LABEL } from "@/lib/finance/purchasing-power";
import { describeRateAge, readStaleAfterMs } from "@/lib/finance/rate-freshness";
import { getLatestRates } from "@/lib/finance/referenceRates";

export const metadata = { title: "نرخ‌ها" };

export default async function RatesPage() {
  await requireUser();
  const rates = await getLatestRates();
  const now = new Date();
  const staleAfterMs = readStaleAfterMs();
  const rows = [...rates.values()].sort((left, right) =>
    left.assetType.localeCompare(right.assetType),
  );

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="نرخ‌ها"
        description="آخرین نرخ ذخیره‌شده برای هر دارایی. اگر دریافت زنده قطع شود، همین عدد می‌ماند."
      />
      {rows.length === 0 ? (
        <p className="text-sm leading-7 text-muted-foreground">
          هنوز نرخی ثبت نشده. وقتی دریافت زنده تنظیم شود، اینجا پر می‌شود.
        </p>
      ) : (
        <Card className="px-5 py-4">
          <ul className="flex flex-col gap-4">
            {rows.map((rate) => {
              const age = describeRateAge(rate.effectiveAt, now, staleAfterMs);
              const detail = `۱ ${REFERENCE_ASSET_UNIT_LABEL[rate.assetType]} × ${formatToman(rate.rateToToman)} (${age.label})`;
              return (
                <li key={rate.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{REFERENCE_ASSET_OPTION_LABEL[rate.assetType]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{age.label}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="numeric-display text-sm font-semibold">{formatToman(rate.rateToToman)}</p>
                    <HoldingExplain detail={detail} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </main>
  );
}
