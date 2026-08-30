import type { ReactNode } from "react";
import { MarketingFooter } from "@/features/marketing/footer";
import { MarketingHeader } from "@/features/marketing/header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        پرش به محتوا
      </a>
      <MarketingHeader />
      <div id="content" className="flex-1">
        {children}
      </div>
      <MarketingFooter />
    </div>
  );
}
