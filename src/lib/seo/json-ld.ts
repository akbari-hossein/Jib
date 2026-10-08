import { APP_DESCRIPTION, APP_NAME, APP_NAME_EN } from "@/lib/config/app";
import { absoluteUrl, SITE } from "@/lib/config/site";
import type { FaqItem } from "@/features/marketing/content/faq";
import { formatToman } from "@/lib/currency/format";
import {
  getSubscriptionOriginalPriceToman,
  getSubscriptionPriceToman,
} from "@/lib/subscription/config";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.brand,
    alternateName: [APP_NAME, APP_NAME_EN],
    url: absoluteUrl("/"),
    inLanguage: "fa-IR",
    description: APP_DESCRIPTION,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.brand,
    alternateName: [APP_NAME, APP_NAME_EN],
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icons/icon-512.png"),
    description: APP_DESCRIPTION,
  };
}

export function softwareApplicationJsonLd() {
  const price = getSubscriptionPriceToman();
  const originalPrice = getSubscriptionOriginalPriceToman();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    alternateName: APP_NAME_EN,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: "fa-IR",
    description: APP_DESCRIPTION,
    url: absoluteUrl("/"),
    image: absoluteUrl("/icons/icon-512.png"),
    offers: {
      "@type": "Offer",
      price: String(price),
      priceCurrency: "IRR",
      description: `۷ روز آزمایش رایگان، سپس اشتراک ماهانه با ۵۰٪ تخفیف: ${formatToman(BigInt(price))} به‌جای ${formatToman(BigInt(originalPrice))}.`,
    },
  };
}

export function faqJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function jsonLdScript(data: object): string {
  return JSON.stringify(data);
}
