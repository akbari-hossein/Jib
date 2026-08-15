import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">ورود</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          شماره موبایلت را بده تا کد ورود برایت بیاید.
        </p>
      </div>
      <LoginForm />
    </section>
  );
}
