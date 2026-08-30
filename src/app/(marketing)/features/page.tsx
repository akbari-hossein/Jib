import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { PrimaryCta } from "@/features/marketing/landing/cta-link";
import { FullDashboardMock } from "@/features/marketing/mocks/dashboard-mock";
import { publicPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata = publicPageMetadata({
  title: "امکانات جیب",
  description:
    "قابل‌خرج روزانه، ثبت سریع، بودجه ماهانه شمسی، هدف پس‌انداز و مرور هفته و ماه — بدون حسابداری و بدون هوش مصنوعی.",
  path: "/features",
});

const ITEMS = [
  {
    title: "امروز چقدر می‌تونی خرج کنی",
    body: "یک عدد از موجودی نقد، هدف‌های بدون حساب، خرج نزدیک و پس‌انداز این دوره.",
  },
  {
    title: "ثبت سریع",
    body: "مبلغ، دسته، حساب. قانون فروشنده را خودت می‌سازی؛ مدل زبانی در کار نیست.",
  },
  {
    title: "بودجه و هدف",
    body: "سقف دسته برای ماه جلالی، و هدف با یا بدون حساب پس‌انداز.",
  },
  {
    title: "گزارش هفته و ماه",
    body: "خرج، درآمد، نرخ پس‌انداز و مقایسه آرام با دوره قبل.",
  },
  {
    title: "چند حساب",
    body: "نقد، کارت، بانک یا پس‌انداز. خودت می‌گویی کدام‌ها در قابل‌خرج باشند.",
  },
  {
    title: "تقویم شمسی و تومان",
    body: "ماه بودجه، «امروز» و عددها برای ایران ساخته شده‌اند.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "جیب", path: "/" },
          { name: "امکانات", path: "/features" },
        ])}
      />
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">امکانات</h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
        جیب کمک می‌کند بفهمی چقدر پول داری، چقدرش قابل خرج است، و امروز تا کجا می‌توانی پیش بروی.
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {ITEMS.map((item) => (
          <li key={item.title}>
            <Card className="h-full p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
            </Card>
          </li>
        ))}
      </ul>
      <div className="mt-12">
        <FullDashboardMock />
      </div>
      <div className="mt-10">
        <PrimaryCta>رایگان شروع کن</PrimaryCta>
      </div>
    </main>
  );
}
