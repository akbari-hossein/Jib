import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { PrimaryCta } from "@/features/marketing/landing/cta-link";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export function MarketingArticle({
  title,
  description,
  children,
  crumbs,
}: {
  title: string;
  description: string;
  children: ReactNode;
  crumbs: { name: string; path: string }[];
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-14">
      <JsonLd data={breadcrumbJsonLd([{ name: "جیب", path: "/" }, ...crumbs])} />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p>
      <article className="prose-fa mt-10">{children}</article>
      <div className="mt-12 rounded-3xl border border-border bg-card px-5 py-6">
        <p className="font-medium">می‌خواهی روی پول خودت امتحان کنی؟</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          رایگان شروع کن. لازم نیست از اول کامل باشی.
        </p>
        <PrimaryCta className="mt-5">رایگان شروع کن</PrimaryCta>
      </div>
    </main>
  );
}
