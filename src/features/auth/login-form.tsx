"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtp, type AuthActionState } from "@/server/actions/auth";
import { setDevOtp } from "@/features/auth/dev-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toPersianDigits } from "@/lib/currency/format";

const initial: AuthActionState = { ok: false };

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendOtp, initial);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!state.ok) {
      return;
    }
    if (state.devCode) {
      setDevOtp(state.devCode);
    }
    router.push("/verify");
  }, [router, state]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">شماره موبایل</Label>
        <Input
          id="phone"
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          dir="ltr"
          placeholder="0912xxxxxxx"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="text-left tracking-wide"
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ارسال…" : "دریافت کد"}
      </Button>
      <p className="text-xs leading-6 text-foreground/50">
        کد ۵ رقمی به شماره {phone ? toPersianDigits(phone) : "تو"} پیامک می‌شود.
      </p>
    </form>
  );
}
