import { requireUser } from "@/lib/auth/session";
import { UpgradeScreen } from "@/features/subscription/components/UpgradeScreen";
import { getCachedSubscription, serializeSubscription } from "@/server/services/subscription";

export const metadata = { title: "اشتراک" };

export default async function UpgradePage() {
  const user = await requireUser();
  const snapshot = serializeSubscription(await getCachedSubscription(user.id));
  return <UpgradeScreen snapshot={snapshot} />;
}
