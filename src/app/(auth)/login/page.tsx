import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { isGoogleAuthEnabled } from "@/lib/auth/google";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "ورود",
};

const OAUTH_ERRORS: Record<string, string> = {
  google: "ورود با گوگل انجام نشد. دوباره تلاش کن.",
  google_denied: "ورود با گوگل لغو شد.",
  google_unverified: "ایمیل گوگل هنوز تأیید نشده.",
  google_email: "گوگل ایمیل این حساب را نداد.",
  google_config: "ورود با گوگل روی این سرور فعال نیست.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/home");
  }

  const { error } = await searchParams;
  const oauthError = error ? OAUTH_ERRORS[error] : undefined;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">ورود</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          با ایمیل و رمز عبور وارد شو.
        </p>
      </div>
      <LoginForm googleEnabled={isGoogleAuthEnabled()} oauthError={oauthError} />
    </section>
  );
}
