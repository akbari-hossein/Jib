import { JsonLd } from "@/components/seo/json-ld";
import { FAQ_ITEMS } from "@/features/marketing/content/faq";
import {
  BudgetsSection,
  DailySpendSection,
  DashboardSection,
  DifferenceSection,
  FaqSection,
  FinalCtaSection,
  GoalsSection,
  HeroSection,
  HowItWorksSection,
  ProblemSection,
  ReviewSection,
  WhySection,
} from "@/features/marketing/landing/sections";
import { publicPageMetadata } from "@/lib/seo/metadata";
import {
  faqJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";

export const metadata = publicPageMetadata({
  title: "جیب — بدون، امروز چقدر می‌تونی خرج کنی",
  description:
    "جیب برنامه مدیریت پول شخصی برای ایران است. از موجودی، هزینه‌های نزدیک و هدف‌هات حساب می‌کند امروز چقدر می‌توانی خرج کنی — بدون حسابداری و بدون هوش مصنوعی.",
  path: "/",
});

export default function LandingPage() {
  return (
    <main>
      <JsonLd
        data={[
          websiteJsonLd(),
          organizationJsonLd(),
          softwareApplicationJsonLd(),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />
      <HeroSection />
      <ProblemSection />
      <DifferenceSection />
      <DailySpendSection />
      <DashboardSection />
      <BudgetsSection />
      <GoalsSection />
      <ReviewSection />
      <WhySection />
      <HowItWorksSection />
      <FaqSection />
      <FinalCtaSection />
    </main>
  );
}
