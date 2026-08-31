export type OnboardingStepId =
  | "welcome"
  | "dashboard"
  | "accounts"
  | "transactions"
  | "budgets"
  | "goals"
  | "start";

export type OnboardingStep = {
  id: OnboardingStepId;
  href: string;
  target: string | null;
  title: string;
  body: string;
  primary: string;
  layout: "welcome" | "coach" | "finish";
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    href: "/home",
    target: null,
    title: "خوش آمدی به جیب",
    body: "جیب از موجودی، هزینه‌های نزدیک و هدف‌هات یک عدد روشن می‌سازد: امروز چقدر می‌توانی خرج کنی.",
    primary: "شروع کنیم",
    layout: "welcome",
  },
  {
    id: "dashboard",
    href: "/home",
    target: "available-money",
    title: "خانه: قابل‌خرج",
    body: "این عدد سؤال امروز است. نقد، بودجهٔ نزدیک و پس‌انداز از آن کم می‌شوند تا سهم هر روز مشخص شود.",
    primary: "بعدی",
    layout: "coach",
  },
  {
    id: "accounts",
    href: "/accounts",
    target: "accounts-heading",
    title: "حساب‌ها",
    body: "کارت، نقد و پس‌انداز را جدا نگه دار. فقط حساب‌هایی که در قابل‌خرج باشند عدد خانه را می‌سازند.",
    primary: "بعدی",
    layout: "coach",
  },
  {
    id: "transactions",
    href: "/transactions",
    target: "transactions-heading",
    title: "تراکنش‌ها",
    body: "دکمه + را بزن، مبلغ را بگو، دسته را انتخاب کن. لازم نیست دفتر حساب کامل نگه داری.",
    primary: "بعدی",
    layout: "coach",
  },
  {
    id: "budgets",
    href: "/budgets",
    target: "budgets-heading",
    title: "بودجه",
    body: "برای دسته‌های مهم مثل غذا سقف بگذار. لازم نیست همه چیز را از روز اول پر کنی.",
    primary: "بعدی",
    layout: "coach",
  },
  {
    id: "goals",
    href: "/goals",
    target: "goals-heading",
    title: "هدف‌ها",
    body: "پس‌انداز وقتی جدی می‌شود که از قابل‌خرج جدا شود. هدف می‌تواند به حساب وصل باشد یا از پول آزاد رزرو شود.",
    primary: "بعدی",
    layout: "coach",
  },
  {
    id: "start",
    href: "/accounts",
    target: "add-account",
    title: "از یک حساب شروع کن",
    body: "موجودی فعلی‌ات را وارد کن. همان لحظه خانه معنی‌دار می‌شود — این همان نقطهٔ شروع جیب است.",
    primary: "تمام",
    layout: "finish",
  },
];
