import { SignupForm } from "@/features/auth/signup-form";
import { isGoogleAuthEnabled } from "@/lib/auth/google";

export const metadata = {
  title: "ثبت‌نام",
};

export default function SignupPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">ساخت حساب</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          رایگان شروع کن. فقط یک ایمیل و رمز عبور لازم است.
        </p>
      </div>
      <SignupForm googleEnabled={isGoogleAuthEnabled()} />
    </section>
  );
}
