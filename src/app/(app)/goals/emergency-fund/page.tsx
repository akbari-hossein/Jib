import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmergencyFundDetailView } from "@/features/emergency-fund/components/EmergencyFundDetailView";
import { EmergencyFundSetupForm } from "@/features/emergency-fund/components/EmergencyFundSetupForm";
import { EMERGENCY_FUND_COPY } from "@/features/emergency-fund/copy";
import { getEmergencyFundData } from "@/server/emergencyFund/getEmergencyFundData";

export const metadata = { title: "صندوق اضطراری" };

export default async function EmergencyFundPage() {
  const user = await requireUser();
  const data = await getEmergencyFundData(user.id);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <PageHeader
        title={EMERGENCY_FUND_COPY.name}
        description={data.configured ? undefined : EMERGENCY_FUND_COPY.setupIntro}
      />
      {data.configured ? <EmergencyFundDetailView data={data} /> : <EmergencyFundSetupForm data={data} />}
    </main>
  );
}
