import Link from "next/link";
import { MarketingHeader } from "@/features/marketing/header";
import { ProductPreview } from "@/features/marketing/product-preview";
import { APP_NAME } from "@/lib/config/app";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <MarketingHeader />
      <main className="mx-auto grid w-full max-w-5xl gap-12 px-5 pb-24 pt-8 md:grid-cols-2 md:items-center md:pt-16">
        <section className="flex flex-col items-start gap-6">
          <p className="text-sm text-foreground/50">{APP_NAME}</p>
          <h1 className="text-4xl font-semibold leading-[1.25] tracking-tight md:text-5xl">
            پولت کجاست؟
            <br />
            از این به بعد می‌دونی.
          </h1>
          <p className="max-w-md text-base leading-8 text-foreground/65">
            بدون اینکه هر خرج کوچیکی رو ساعت‌ها ثبت کنی، وضعیت مالی‌ات رو ببین و
            بدون چقدر می‌تونی خرج کنی.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            شروع رایگان
          </Link>
        </section>
        <ProductPreview />
      </main>
      <section className="mx-auto grid w-full max-w-5xl gap-8 px-5 pb-24 md:grid-cols-3">
        {[
          {
            title: "امروز چقدر می‌تونی خرج کنی",
            body: "یک عدد روشن، از موجودی واقعی، هزینه‌های نزدیک و هدف‌های ذخیره.",
          },
          {
            title: "ثبت سریع، نه حسابداری",
            body: "خرج را در چند ثانیه می‌نویسی. بقیه را جیب برایت جمع می‌کند.",
          },
          {
            title: "آرام و خصوصی",
            body: "بدون سرزنش، بدون تبلیغ، با داده‌ای که فقط مال خودت است.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground/65">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
