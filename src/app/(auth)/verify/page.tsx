import { redirect } from "next/navigation";
import { VerifyForm } from "@/features/auth/verify-form";
import { maskPhone } from "@/lib/auth/phone";
import { readPendingPhone } from "@/lib/auth/session";
import { toPersianDigits } from "@/lib/currency/format";

export default async function VerifyPage() {
  const phone = await readPendingPhone();
  if (!phone) {
    redirect("/login");
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">کد را وارد کن</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          کد ۵ رقمی به {toPersianDigits(maskPhone(phone))} ارسال شد.
        </p>
      </div>
      <VerifyForm />
    </section>
  );
}
