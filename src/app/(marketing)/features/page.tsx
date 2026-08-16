import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader } from "@/features/marketing/header";

export const metadata: Metadata = {
  title: "امکانات",
};

const ITEMS = [
  {
    title: "امروز چقدر می‌تونی خرج کنی",
    body: "یک عدد از موجودی نقد، هدف‌ها، خرج نزدیک و پس‌انداز این دوره.",
  },
  {
    title: "ثبت سریع",
    body: "مبلغ، دسته، حساب. قانون فروشنده بدون هوش مصنوعی.",
  },
  {
    title: "بودجه و هدف",
    body: "سقف دسته برای ماه جلالی، و هدف با یا بدون حساب پس‌انداز.",
  },
  {
    title: "گزارش هفته و ماه",
    body: "خرج، درآمد، نرخ پس‌انداز و مقایسه آرام با دوره قبل.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">امکانات</h1>
        <p className="mt-4 leading-8 text-foreground/65">
          جیب کمک می‌کند بفهمی چقدر پول داری، چقدرش قابل خرج است، و امروز تا کجا
          می‌توانی پیش بروی.
        </p>
        <ul className="mt-10 flex flex-col gap-5">
          {ITEMS.map((item) => (
            <li key={item.title} className="rounded-3xl border border-border bg-surface p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-foreground/65">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/login" className="text-primary">
            شروع رایگان
          </Link>
          <Link href="/pricing" className="text-foreground/55">
            قیمت
          </Link>
        </div>
      </main>
    </div>
  );
}
