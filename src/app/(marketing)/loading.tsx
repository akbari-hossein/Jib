import { Logo } from "@/components/brand/logo";
import { PageSkeleton } from "@/components/states/page-skeleton";

export default function MarketingLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Logo href="/" size="sm" className="mx-auto" />
      <PageSkeleton variant="article" />
    </div>
  );
}
