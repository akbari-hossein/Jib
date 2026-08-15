import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/features/marketing/header";

export const metadata: Metadata = {
  title: "امکانات",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-3xl font-semibold">امکانات</h1>
        <p className="mt-4 leading-8 text-foreground/65">
          جیب کمک می‌کند بفهمی چقدر پول داری، چقدرش قابل خرج است، و امروز تا کجا
          می‌توانی پیش بروی.
        </p>
        <Link href="/login" className="mt-8 inline-flex text-sm text-primary">
          شروع رایگان
        </Link>
      </main>
    </div>
  );
}
