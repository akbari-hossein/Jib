import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/features/marketing/header";

export const metadata: Metadata = {
  title: "قیمت",
};

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-3xl font-semibold">قیمت</h1>
        <p className="mt-4 leading-8 text-foreground/65">
          نسخه رایگان برای شروع کافی است. امکانات حرفه‌ای وقتی محصول پایدار شد
          اضافه می‌شود.
        </p>
        <Link href="/login" className="mt-8 inline-flex text-sm text-primary">
          شروع رایگان
        </Link>
      </main>
    </div>
  );
}
