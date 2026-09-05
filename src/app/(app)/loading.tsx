import { Logo } from "@/components/brand/logo";
import { PageSkeleton } from "@/components/states/page-skeleton";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Logo href="/home" size="sm" className="mx-auto" />
      <PageSkeleton />
    </div>
  );
}
