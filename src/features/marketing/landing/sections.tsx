import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BudgetProgress } from "@/components/finance/budget-progress";
import { GoalProgress } from "@/components/finance/goal-progress";
import { FAQ_ITEMS } from "@/features/marketing/content/faq";
import { PrimaryCta, SecondaryCta } from "@/features/marketing/landing/cta-link";
import { FullDashboardMock, HeroDashboardMock } from "@/features/marketing/mocks/dashboard-mock";
import { DEMO, DEMO_LABEL } from "@/features/marketing/mocks/demo-data";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";

export function HeroSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-16">
      <div className="motion-rise flex flex-col items-start gap-6">
        <p className="text-sm text-muted-foreground">جیب · مدیریت پول شخصی</p>
        <h1 className="max-w-xl text-4xl font-semibold leading-[1.25] tracking-tight md:text-5xl">
          امروز چقدر می‌تونی خرج کنی؟
        </h1>
        <p className="max-w-md text-base leading-8 text-muted-foreground">
          جیب از موجودی، هزینه‌های نزدیک و هدف‌هات یک عدد روشن می‌سازد: پول قابل‌خرج و سهم امروز.
          لازم نیست حسابدار خودت باشی.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryCta />
          <SecondaryCta href="#how-it-works">چطور کار می‌کنه؟</SecondaryCta>
        </div>
      </div>
      <div className="motion-rise motion-rise-delay-2">
        <HeroDashboardMock />
      </div>
    </section>
  );
}

export function ProblemSection() {
  const problems = [
    { title: "آخر ماه غافلگیر می‌شی", body: "می‌دونی تقریباً چقدر پول داری. نمی‌دونی کجا رفت." },
    { title: "ثبت تک‌تک خرج‌ها خسته‌کننده است", body: "اپ‌هایی که دفتر حساب می‌خواهند، معمولاً رها می‌شوند." },
    { title: "بودجه فقط سقف می‌گذارد", body: "عدد ماهانه هست؛ سهم امروز نیست." },
    { title: "پس‌انداز همیشه برای بعد می‌ماند", body: "تا وقتی قابل‌خرج از هدف جدا نشود، هدف جدی نمی‌شود." },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20">
      <p className="text-sm text-muted-foreground">مشکل</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
        آخر ماه می‌رسه و هنوز دقیق نمی‌دونی پولت کجا رفت.
      </h2>
      <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">
        درآمد معمولاً ثابت می‌ماند، هزینه‌ها آرام بالا می‌روند، و ثبت همه‌چیز خودش یک کار اضافه می‌شود.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {problems.map((item) => (
          <Card key={item.title} className="p-5">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function DifferenceSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20">
      <p className="text-sm text-muted-foreground">تفاوت</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
        سؤال مهم این نیست چقدر خرج کردی.
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">اپ‌های معمولی</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight">«چقدر خرج کردی؟»</p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            یک جمع از گذشته. مفید است، ولی برای تصمیم امروز دیر است.
          </p>
        </Card>
        <Card className="border-primary/25 p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">جیب</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight">«چقدر می‌تونی خرج کنی؟»</p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            یک عدد برای همین حالا: بعد از رزرو هدف، خرج نزدیک، و روزهای مانده تا درآمد بعدی.
          </p>
        </Card>
      </div>
    </section>
  );
}

export function DailySpendSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 md:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">سهم امروز</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">یک عدد برای تصمیم گرفتن.</h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          جیب موجودی را حدس نمی‌زند و به بانک وصل نیست. تو درآمد، حساب‌ها، هزینه‌های تکراری، بودجه و
          هدف را می‌گذاری؛ جیب بقیه‌اش را حساب می‌کند.
        </p>
        <ol className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground">
          <li>موجودی حساب‌هایی که گفتی قابل‌خرج باشند</li>
          <li>منهای هدف بدون حساب و خرج‌های نزدیک</li>
          <li>منهای پس‌اندازی که برای این دوره کنار می‌گذاری</li>
          <li>تقسیم بر روزهای مانده تا درآمد بعدی، منهای خرج امروز</li>
        </ol>
      </div>
      <Card className="p-6">
        <Badge>{DEMO_LABEL}</Badge>
        <dl className="mt-6 space-y-4">
          <DemoRow label="قابل‌خرج" value={formatToman(DEMO.available)} />
          <DemoRow label="تا درآمد بعدی" value={`${toPersianDigits(DEMO.remainingDays)} روز`} />
          <DemoRow label="امروز می‌تونی حدود" value={formatToman(DEMO.today)} emphasize />
        </dl>
      </Card>
    </section>
  );
}

export function DashboardSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20">
      <p className="text-sm text-muted-foreground">خانه</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">
        اول عدد مهم، بعد جزئیات.
      </h2>
      <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">
        قابل‌خرج، سهم امروز، بودجه، هدف و چند تراکنش اخیر — بدون جدول حسابداری.
      </p>
      <div className="mt-10">
        <FullDashboardMock />
      </div>
    </section>
  );
}

export function BudgetsSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 md:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">بودجه</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">سقف ساده، بدون سرزنش.</h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          برای دسته‌های مهم مثل غذا سقف ماهانه می‌گذاری. اگر بخواهی، سقف کل ماه هم می‌گذاری. اگر نزدیک
          شدی، جیب خبر می‌دهد. اگر رد شدی، هنوز می‌توانی سقف را عوض کنی.
        </p>
      </div>
      <Card className="p-6">
        <Badge>{DEMO_LABEL}</Badge>
        <div className="mt-6">
          <BudgetProgress
            name="غذا"
            spent={DEMO.foodSpent}
            limit={DEMO.foodLimit}
            pct={DEMO.foodPct}
            status="healthy"
            caption="هنوز جا دارد. لازم نیست دقیق تا ریال پیش بروی."
          />
        </div>
      </Card>
    </section>
  );
}

export function GoalsSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 md:grid-cols-2">
      <Card className="order-2 p-6 md:order-1">
        <Badge>{DEMO_LABEL}</Badge>
        <div className="mt-6">
          <GoalProgress
            name={DEMO.goalName}
            currentAmount={DEMO.goalCurrent}
            targetAmount={DEMO.goalTarget}
            pct={DEMO.goalPct}
            monthlyNeed={DEMO.goalMonthly}
            caption={`با ماهی ${formatCompactToman(DEMO.goalMonthly)} حدود ${toPersianDigits(DEMO.goalMonthsLeft)} ماه تا هدف باقی مانده`}
          />
        </div>
      </Card>
      <div className="order-1 md:order-2">
        <p className="text-sm text-muted-foreground">هدف</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">پس‌انداز وقتی معنا دارد که از قابل‌خرج جدا شود.</h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          هدف بدون حساب، از پولی که امروز می‌توانی خرج کنی کم می‌شود. هدف وصل به حساب پس‌انداز،
          موجودی همان حساب است. جیب می‌گوید تقریباً چند ماه مانده.
        </p>
      </div>
    </section>
  );
}

export function ReviewSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 md:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">مرور</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">هفته و ماه، خلاصه و آرام.</h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">
          نه ترازنامه. فقط خرج، درآمد، نرخ پس‌انداز و مقایسه با دوره قبل — به زبان آدمیزاد.
        </p>
      </div>
      <Card className="p-6">
        <Badge>{DEMO_LABEL}</Badge>
        <p className="mt-6 text-2xl font-semibold tracking-tight">
          این ماه {toPersianDigits(DEMO.reviewChange)}٪ کمتر از ماه قبل خرج کردی.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          درآمد {formatCompactToman(DEMO.monthlyIncome)} · هزینه{" "}
          {formatCompactToman(DEMO.monthlySpent)}
        </p>
      </Card>
    </section>
  );
}

export function WhySection() {
  const items = [
    { title: "ساده", body: "بدون دفترکل، بدون اصطلاح حسابداری." },
    { title: "برای امروز", body: "جواب همین حالا، نه فقط گزارش دیروز." },
    { title: "سریع", body: "ثبت خرج با مبلغ، دسته و حساب؛ در چند ثانیه." },
    { title: "خصوصی", body: "داده مال توست. به بانک وصل نیستیم و تبلیغ نداریم." },
    { title: "آرام", body: "رابطه با پول نباید شبیه اخطار بانکی باشد." },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-20">
      <p className="text-sm text-muted-foreground">چرا جیب</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">ساده، دقیق، بی‌ادعا.</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <Card key={item.title} className="p-5">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      n: "۱",
      title: "وضعیت مالی‌ات را وارد کن",
      body: "حساب‌ها، درآمد، روز واریز، و هزینه‌های تکراری مثل اجاره.",
    },
    {
      n: "۲",
      title: "هدف و سقف را مشخص کن",
      body: "بودجه دسته و هدف پس‌انداز؛ هرچه لازم داری، نه بیشتر.",
    },
    {
      n: "۳",
      title: "جیب حساب می‌کند",
      body: "قابل‌خرج و سهم امروز از همان ورودی‌ها به دست می‌آید.",
    },
    {
      n: "۴",
      title: "آرام‌تر تصمیم بگیر",
      body: "قبل از خرید می‌دانی این خرج سهم امروز را تمام می‌کند یا نه.",
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-20">
      <p className="text-sm text-muted-foreground">مسیر کار</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">چهار قدم، بدون پیچیدگی.</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <Card key={step.n} className="p-5">
            <p className="text-sm text-muted-foreground">{step.n}</p>
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 pb-20">
      <p className="text-sm text-muted-foreground">سؤال‌های رایج</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">صریح، بدون شعار.</h2>
      <div className="mt-8 divide-y divide-border rounded-3xl border border-border bg-card">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="cursor-pointer list-none text-base font-medium leading-8 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-24">
      <Card className="flex flex-col items-start gap-5 px-6 py-10 md:px-10">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight">ببین امروز چقدر می‌تونی خرج کنی.</h2>
        <p className="max-w-lg text-base leading-8 text-muted-foreground">
          حساب بساز، موجودی را بگذار، و همان روز عدد امروز را ببین. ۱۴ روز اول آزمایشی و رایگان است.
        </p>
        <PrimaryCta />
      </Card>
    </section>
  );
}

function DemoRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={emphasize ? "text-xl font-semibold tracking-tight" : "text-base font-medium"}>
        {value}
      </dd>
    </div>
  );
}
