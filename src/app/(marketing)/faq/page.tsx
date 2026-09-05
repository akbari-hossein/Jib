import { JsonLd } from "@/components/seo/json-ld";
import { FAQ_ITEMS } from "@/features/marketing/content/faq";
import { PrimaryCta } from "@/features/marketing/landing/cta-link";
import { publicPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/json-ld";

export const metadata = publicPageMetadata({
  title: "سؤال‌های رایج جیب",
  description:
    "جیب چیست، چطور سهم امروز را حساب می‌کند، آیا حسابداری یا هوش مصنوعی است، و داده مالی چطور نگهداری می‌شود.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "جیب", path: "/" },
            { name: "سؤال‌های رایج", path: "/faq" },
          ]),
          faqJsonLd(FAQ_ITEMS),
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">سؤال‌های رایج</h1>
      <p className="mt-4 text-base leading-8 text-muted-foreground">
        جواب‌ها کوتاه و صادقانه‌اند. اگر چیزی را پیاده نکرده‌ایم، اینجا هم ادعا نمی‌کنیم.
      </p>
      <div className="mt-10 divide-y divide-border rounded-3xl border border-border bg-card">
        {FAQ_ITEMS.map((item) => (
          <article key={item.question} className="px-5 py-5">
            <h2 className="text-base font-semibold leading-8">{item.question}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </article>
        ))}
      </div>
      <PrimaryCta className="mt-10" />
    </main>
  );
}
